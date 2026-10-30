import { forwardRef, useState } from 'react';
import clsx from 'clsx';
import { Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(
  ({ label, error, hint, type = 'text', className, containerClassName, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const resolvedType = isPassword && showPassword ? 'text' : type;

    return (
      <div className={clsx('w-full', containerClassName)}>
        {label && (
          <label htmlFor={props.id || props.name} className="block text-sm font-medium text-ink-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={resolvedType}
            className={clsx(
              'w-full rounded-2xl border bg-white px-4 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus-ring',
              error ? 'border-rose-300 focus-visible:ring-rose-300' : 'border-ink-200 hover:border-ink-300',
              isPassword && 'pr-11',
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
        {!error && hint && <p className="mt-1.5 text-xs text-ink-400">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
