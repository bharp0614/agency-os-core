/**
 * BusinessDataForm
 *
 * Collects fundamental business data (NAP + service radius) and writes it to:
 *   - truth-source/03-seo-and-aeo.md     (nap fields)
 *   - truth-source/02-business-operations.md  (service_radius fields)
 *
 * Validation:  Zod via useTruthSourceStore.validate()
 * Persistence: POST /api/truth-source/business-data → writeTruthSource()
 */

import { useTruthSourceStore } from '@/stores/truth-source-store';
import { FormField } from './components/FormField';
import { SaveButton } from './components/SaveButton';

export function BusinessDataForm() {
  const formData   = useTruthSourceStore((s) => s.formData);
  const errors     = useTruthSourceStore((s) => s.errors);
  const saveStatus = useTruthSourceStore((s) => s.saveStatus);
  const saveError  = useTruthSourceStore((s) => s.saveError);
  const setField   = useTruthSourceStore((s) => s.setField);
  const save       = useTruthSourceStore((s) => s.save);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      noValidate
      aria-label="Business Data Form"
      className="flex flex-col gap-6"
    >
      {/* ── NAP Section ────────────────────────────────────────────────── */}
      <fieldset className="flex flex-col gap-4 rounded-xl border border-gray-800 p-5">
        <legend className="px-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
          NAP — Name · Address · Phone
        </legend>

        <FormField
          label="Business Name"
          name="business_name"
          value={formData.business_name}
          onChange={(v) => setField('business_name', v)}
          error={errors.business_name}
          placeholder="Acme Plumbing LLC"
          hint="Exact legal name — must match Google Business Profile precisely."
        />

        <FormField
          label="Street Address"
          name="street_address"
          value={formData.street_address}
          onChange={(v) => setField('street_address', v)}
          error={errors.street_address}
          placeholder="123 Main Street"
        />

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-1">
            <FormField
              label="City"
              name="city"
              value={formData.city}
              onChange={(v) => setField('city', v)}
              error={errors.city}
              placeholder="Los Angeles"
            />
          </div>

          <div className="col-span-1">
            <FormField
              label="State"
              name="state"
              value={formData.state}
              onChange={(v) => setField('state', v.toUpperCase())}
              error={errors.state}
              placeholder="CA"
              maxLength={2}
              hint="2-letter code"
            />
          </div>

          <div className="col-span-1">
            <FormField
              label="ZIP Code"
              name="zip"
              value={formData.zip}
              onChange={(v) => setField('zip', v)}
              error={errors.zip}
              placeholder="90210"
            />
          </div>
        </div>

        <FormField
          label="Phone Number"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={(v) => setField('phone', v)}
          error={errors.phone}
          placeholder="(310) 555-0100"
          hint="This number appears on every page and in citation directories."
        />
      </fieldset>

      {/* ── Service Radius ─────────────────────────────────────────────── */}
      <fieldset className="flex flex-col gap-4 rounded-xl border border-gray-800 p-5">
        <legend className="px-1 text-xs font-semibold uppercase tracking-widest text-gray-400">
          Service Radius
        </legend>

        <FormField
          label="Radius (miles)"
          name="radius_miles"
          type="number"
          value={formData.radius_miles}
          onChange={(v) => setField('radius_miles', Number(v))}
          error={errors.radius_miles}
          placeholder="25"
          hint="How far from the primary city the business operates."
        />
      </fieldset>

      {/* ── Actions ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <SaveButton status={saveStatus} onClick={() => void save()} />

        {saveStatus === 'error' && saveError && (
          <p role="alert" className="text-xs text-red-400 flex-1 text-right">
            {saveError}
          </p>
        )}

        {saveStatus === 'saved' && (
          <p role="status" className="text-xs text-emerald-400 flex-1 text-right">
            Both truth-source files updated successfully.
          </p>
        )}
      </div>
    </form>
  );
}
