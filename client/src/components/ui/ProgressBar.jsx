import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function ProgressBar({ value, colorClassName = 'bg-brand-500', trackClassName, heightClassName = 'h-2', className }) {
  const clamped = Math.max(0, Math.min(100, value || 0));

  return (
    <div className={clsx('w-full rounded-full bg-ink-100 overflow-hidden', heightClassName, trackClassName, className)}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clamped}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={clsx('h-full rounded-full', colorClassName)}
      />
    </div>
  );
}
