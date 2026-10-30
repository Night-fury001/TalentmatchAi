import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function Card({ children, className, animate = true, index = 0, ...props }) {
  const Component = animate ? motion.div : 'div';
  const animationProps = animate
    ? {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, delay: Math.min(index * 0.05, 0.4), ease: [0.16, 1, 0.3, 1] },
      }
    : {};

  return (
    <Component className={clsx('surface p-6', className)} {...animationProps} {...props}>
      {children}
    </Component>
  );
}
