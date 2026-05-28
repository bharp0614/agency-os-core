interface FormFieldProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (value: string) => void;
  error?: string;
  type?: 'text' | 'number' | 'tel';
  placeholder?: string;
  hint?: string;
  maxLength?: number;
}

export function FormField({
  label,
  name,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  hint,
  maxLength,
}: FormFieldProps) {
  const hasError = Boolean(error);

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-sm font-medium text-gray-200"
      >
        {label}
        <span className="text-red-400 ml-0.5" aria-hidden="true">*</span>
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${name}-error` : hint ? `${name}-hint` : undefined}
        className={[
          'rounded-lg border px-3 py-2 text-sm bg-gray-900 text-white',
          'placeholder:text-gray-500 outline-none transition-colors',
          'focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-950',
          hasError
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/40'
            : 'border-gray-700 hover:border-gray-600 focus:border-indigo-500 focus:ring-indigo-500/30',
        ].join(' ')}
      />

      {hint && !hasError && (
        <p id={`${name}-hint`} className="text-xs text-gray-500">
          {hint}
        </p>
      )}

      {hasError && (
        <p
          id={`${name}-error`}
          role="alert"
          className="text-xs text-red-400 flex items-center gap-1"
        >
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      )}
    </div>
  );
}
