/**
 * Global Zustand store for truth-source form state.
 *
 * Owns the BusinessDataForm lifecycle:
 *   formData  → user input
 *   errors    → per-field Zod validation messages
 *   saveStatus → idle | saving | saved | error
 *
 * The `save()` action validates client-side via Zod, then POSTs to the
 * Vite dev-server API (`/api/truth-source/business-data`) which calls
 * writeTruthSource() to atomically update the markdown files.
 */

import { create } from 'zustand';
import {
  BusinessDataFormSchema,
  type BusinessDataFormValues,
  type BusinessDataFormErrors,
} from '@shared/types/truth-source-schemas';

// ── Types ────────────────────────────────────────────────────────────────────

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface TruthSourceStore {
  // ── State ──────────────────────────────────────────────────────────────────
  formData: BusinessDataFormValues;
  errors: BusinessDataFormErrors;
  saveStatus: SaveStatus;
  saveError: string | null;

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Update a single form field and clear its error. */
  setField: <K extends keyof BusinessDataFormValues>(
    field: K,
    value: BusinessDataFormValues[K],
  ) => void;

  /**
   * Run the full Zod schema against current formData.
   * Populates `errors` on failure.
   * Returns true if data is valid.
   */
  validate: () => boolean;

  /**
   * Validate → POST to the dev-server API → write both truth-source files.
   * Sets saveStatus throughout the lifecycle.
   */
  save: () => Promise<void>;

  /** Reset form to blank defaults and clear all errors/status. */
  reset: () => void;
}

// ── Default values ───────────────────────────────────────────────────────────

const DEFAULT_FORM: BusinessDataFormValues = {
  business_name:  '',
  street_address: '',
  city:           '',
  state:          '',
  zip:            '',
  phone:          '',
  radius_miles:   0,
};

// ── Store ────────────────────────────────────────────────────────────────────

export const useTruthSourceStore = create<TruthSourceStore>((set, get) => ({
  formData:   { ...DEFAULT_FORM },
  errors:     {},
  saveStatus: 'idle',
  saveError:  null,

  setField: (field, value) =>
    set((state) => ({
      formData: { ...state.formData, [field]: value },
      // Clear the error for this field as soon as the user edits it
      errors: { ...state.errors, [field]: undefined },
    })),

  validate: () => {
    const result = BusinessDataFormSchema.safeParse(get().formData);

    if (result.success) {
      set({ errors: {} });
      return true;
    }

    const errors: BusinessDataFormErrors = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as keyof BusinessDataFormValues;
      if (field && !errors[field]) {
        errors[field] = issue.message;
      }
    }
    set({ errors });
    return false;
  },

  save: async () => {
    const isValid = get().validate();
    if (!isValid) return;

    set({ saveStatus: 'saving', saveError: null });

    try {
      const response = await fetch('/api/truth-source/business-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(get().formData),
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? `Server error ${response.status}`);
      }

      set({ saveStatus: 'saved' });
      // Auto-reset the success badge after 4 s
      setTimeout(() => set({ saveStatus: 'idle' }), 4000);
    } catch (err) {
      set({
        saveStatus: 'error',
        saveError: err instanceof Error ? err.message : String(err),
      });
    }
  },

  reset: () =>
    set({
      formData:   { ...DEFAULT_FORM },
      errors:     {},
      saveStatus: 'idle',
      saveError:  null,
    }),
}));
