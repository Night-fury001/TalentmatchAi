import clsx from 'clsx';

export default function Badge({ children, className, variant = 'default' }) {
  const variants = {
    default: 'bg-ink-100 text-ink-700 border-ink-200',
    brand: 'bg-brand-50 text-brand-700 border-brand-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  // An explicit className carrying its own bg-/text-/border- utilities
  // (e.g. status color maps) fully replaces the variant styling instead
  // of fighting it — Tailwind utilities share specificity, so two
  // conflicting `bg-*` classes on the same element have an unpredictable
  // winner based on stylesheet order, not class-string order.
  const hasColorOverride = /\b(bg|text|border)-/.test(className || '');

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
        !hasColorOverride && variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
