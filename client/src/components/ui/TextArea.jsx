import { forwardRef } from 'react';
import clsx from 'clsx';

const TextArea = forwardRef(({ label, error, hint, rows = 4, className, containerClassName, ...props }, ref) => {
  return (
    <div className={clsx('w-full', containerClassName)}>
      {label && (
        <label htmlFor={props.id || props.name} className="block text-sm font-medium text-ink-700 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={clsx(
          'w-full rounded-2xl border bg-white px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus-ring resize-none',
          error ? 'border-rose-300 focus-visible:ring-rose-300' : 'border-ink-200 hover:border-ink-300',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
      {!error && hint && <p className="mt-1.5 text-xs text-ink-400">{hint}</p>}
    </div>
  );
});

TextArea.displayName = 'TextArea';
export default TextArea;
