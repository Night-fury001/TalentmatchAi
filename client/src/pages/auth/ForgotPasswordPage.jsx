import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MailCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import { forgotPasswordSchema } from '../../utils/schemas';
import { getErrorMessage } from '../../utils/axiosInstance';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await authService.forgotPassword(data);
      setSent(true);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Something went wrong.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center px-6 py-16 bg-gradient-to-b from-brand-50/60 to-ink-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md surface p-8"
      >
        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-50 text-glow-emerald">
              <MailCheck className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-display font-bold text-ink-900">Check your inbox</h1>
            <p className="text-sm text-ink-500 mt-2">
              If an account exists for that email, we&apos;ve sent a link to reset your password.
            </p>
            <Link to="/login" className="inline-block mt-6 text-sm font-medium text-brand-600 hover:text-brand-700">
              Back to log in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-display font-bold text-ink-900">Reset your password</h1>
            <p className="text-sm text-ink-500 mt-1.5 mb-8">
              Enter your email and we&apos;ll send you a link to reset it.
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                error={errors.email?.message}
                {...register('email')}
              />
              <Button type="submit" className="w-full" isLoading={isSubmitting}>
                Send reset link
              </Button>
            </form>
            <p className="text-center text-sm text-ink-500 mt-6">
              <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
                Back to log in
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
