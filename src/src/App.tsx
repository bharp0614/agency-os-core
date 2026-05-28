import { TruthSourceManager } from '@features/truth-source-manager';

export function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top bar */}
      <header className="border-b border-gray-800/60 px-6 py-4">
        <div className="mx-auto max-w-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-indigo-400 text-lg font-bold leading-none">◈</span>
            <span className="text-sm font-semibold text-white">Agency OS</span>
            <span className="text-gray-600 text-sm">/ Frontend-OS</span>
          </div>
          <span className="rounded-full bg-emerald-900/40 border border-emerald-800/60 px-2.5 py-0.5 text-xs text-emerald-400">
            Phase 3
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-2xl px-6 py-10">
        <TruthSourceManager />
      </main>
    </div>
  );
}
