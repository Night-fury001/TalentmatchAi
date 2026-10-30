import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { authService } from '../../services/authService';
import { resetPasswordSchema } from '../../utils/schemas';
import { getErrorMessage } from '../../utils/axiosInstance';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await authService.resetPassword(token, data);
      toast.success('Password reset! Please log in.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'This link may have expired.'));
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
        <h1 className="text-2xl font-display font-bold text-ink-900">Choose a new password</h1>
        <p className="text-sm text-ink-500 mt-1.5 mb-8">Make it strong — at least 8 characters with a mix of cases and a number.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="New password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />
          <Input
            label="Confirm new password"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Reset password
          </Button>
        </form>
        <p className="text-center text-sm text-ink-500 mt-6">
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Back to log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
