import { BusinessDataForm } from './BusinessDataForm';

interface Props {
  className?: string;
}

export function TruthSourceManager({ className = '' }: Props) {
  return (
    <section className={`flex flex-col gap-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Truth Source Manager
        </h2>
        <p className="text-sm text-gray-400">
          Populate the core business data. On save, these values are written
          atomically to{' '}
          <code className="rounded bg-gray-800 px-1 text-gray-300">
            truth-source/02-business-operations.md
          </code>{' '}
          and{' '}
          <code className="rounded bg-gray-800 px-1 text-gray-300">
            truth-source/03-seo-and-aeo.md
          </code>
          . All fields are required.
        </p>
      </div>

      {/* Schema enforcement notice */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-800/50 bg-amber-900/20 px-4 py-3">
        <span className="text-amber-400 text-base leading-none mt-0.5" aria-hidden="true">⚠</span>
        <p className="text-xs text-amber-300/80 leading-relaxed">
          <strong className="text-amber-300">Schema-enforced:</strong> All input
          is validated against the Zod schemas before any write occurs. Invalid
          data is rejected — the markdown files are never partially updated.
        </p>
      </div>

      {/* Form */}
      <BusinessDataForm />
    </section>
  );
}
