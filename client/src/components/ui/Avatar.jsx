import clsx from 'clsx';
import { getInitials } from '../../utils/formatters';

const SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-24 h-24 text-2xl',
};

export default function Avatar({ src, name, size = 'md', className }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={clsx('rounded-full object-cover border border-ink-200', SIZES[size], className)}
      />
    );
  }

  return (
    <div
      className={clsx(
        'flex items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 border border-brand-200',
        SIZES[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
