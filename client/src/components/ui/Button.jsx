import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

const VARIANTS = {
  primary:
    'bg-brand-600 text-white shadow-lift hover:bg-brand-700 disabled:bg-ink-300 disabled:shadow-none',
  secondary:
    'bg-white text-ink-800 border border-ink-200 hover:border-ink-300 hover:bg-ink-50 disabled:opacity-50',
  ghost: 'bg-transparent text-ink-700 hover:bg-ink-100 disabled:opacity-50',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300',
  emerald: 'bg-glow-emerald text-white hover:bg-emerald-600 disabled:bg-emerald-200',
};

const SIZES = {
  sm: 'text-sm px-3 py-1.5 rounded-xl gap-1.5',
  md: 'text-sm px-4 py-2.5 rounded-2xl gap-2',
  lg: 'text-base px-6 py-3 rounded-2xl gap-2',
};

const Button = forwardRef(
  (
    { children, variant = 'primary', size = 'md', isLoading = false, disabled, className, icon: Icon, ...props },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        disabled={disabled || isLoading}
        className={clsx(
          'inline-flex items-center justify-center font-medium transition-colors duration-150 focus-ring disabled:cursor-not-allowed',
          VARIANTS[variant],
          SIZES[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          Icon && <Icon className="w-4 h-4" />
        )}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
