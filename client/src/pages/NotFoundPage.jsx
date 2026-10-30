import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';
import Button from '../components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center"
      >
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-50 text-brand-500">
          <Compass className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-display font-bold text-ink-900">Lost the trail</h1>
        <p className="mt-2 text-sm text-ink-500">We couldn&apos;t find the page you were looking for.</p>
        <Link to="/">
          <Button className="mt-6">Back home</Button>
        </Link>
      </motion.div>
    </div>
  );
}
