import type { SaveStatus } from '@/stores/truth-source-store';

interface SaveButtonProps {
  status: SaveStatus;
  onClick: () => void;
}

const LABEL: Record<SaveStatus, string> = {
  idle:   'Save to Truth Source',
  saving: 'Saving…',
  saved:  'Saved ✓',
  error:  'Save Failed — Retry',
};

const STYLE: Record<SaveStatus, string> = {
  idle:   'bg-indigo-600 hover:bg-indigo-500 text-white focus:ring-indigo-500/40',
  saving: 'bg-indigo-600/60 text-indigo-200 cursor-wait',
  saved:  'bg-emerald-600 text-white cursor-default',
  error:  'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500/40',
};

export function SaveButton({ status, onClick }: SaveButtonProps) {
  const isDisabled = status === 'saving' || status === 'saved';

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      aria-busy={status === 'saving'}
      className={[
        'rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors',
        'outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        STYLE[status],
      ].join(' ')}
    >
      {LABEL[status]}
    </button>
  );
}
