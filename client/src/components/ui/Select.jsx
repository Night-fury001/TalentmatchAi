import { forwardRef } from 'react';
import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(
  ({ label, error, hint, options = [], placeholder = 'Select…', className, containerClassName, ...props }, ref) => {
    return (
      <div className={clsx('w-full', containerClassName)}>
        {label && (
          <label htmlFor={props.id || props.name} className="block text-sm font-medium text-ink-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={clsx(
              'w-full appearance-none rounded-2xl border bg-white px-4 py-2.5 pr-10 text-sm text-ink-900 transition-colors focus-ring',
              error ? 'border-rose-300 focus-visible:ring-rose-300' : 'border-ink-200 hover:border-ink-300',
              className
            )}
            {...props}
          >
            <option value="">{placeholder}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
        </div>
        {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
        {!error && hint && <p className="mt-1.5 text-xs text-ink-400">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
