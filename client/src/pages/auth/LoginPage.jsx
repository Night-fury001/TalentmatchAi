import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Users, Sparkles, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { loginSchema } from '../../utils/schemas';
import { getErrorMessage } from '../../utils/axiosInstance';
import Input from '../../components/ui/Input';
import TalentMatchLogo from '../../components/TalentMatchLogo';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const user = await login(data);
      toast.success('Welcome back!');
      const redirectTo =
        location.state?.from?.pathname ||
        (user.role === 'RECRUITER' ? '/recruiter/dashboard' : user.role === 'ADMIN' ? '/admin/dashboard' : '/client/dashboard');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not log you in.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 px-4 py-12">
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.5, ease: [0.16, 1, 0.3, 1]}}
        className="w-full max-w-4xl flex rounded-3xl overflow-hidden shadow-soft border border-cream-200"
      >
        {/* Left panel */}
        <div className="hidden md:flex flex-col justify-between bg-cream-100 p-10 w-2/5">
          <div>
            <div className="flex items-center gap-2.5 mb-8">
              <TalentMatchLogo className="h-9 w-9" />
              <span className="font-display text-lg font-bold text-ink-900">TalentMatch AI</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-rust-500 leading-snug">
              Human connections, powered by intelligent insights.
            </h2>
            <ul className="mt-6 space-y-4">
              {[
                { icon: Users, title: 'Human & AI Synergy', desc: 'AI assists, humans decide.' },
                { icon: Sparkles, title: 'Match Insights', desc: 'Transparent, explainable matching.' },
                { icon: Heart, title: 'Natural Experience', desc: 'Warm, not corporate.' },
              ].map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-forest-100 text-forest-600">
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-800">{title}</p>
                    <p className="text-xs text-ink-500">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex gap-2 mt-8">
            <div className="h-10 w-10 rounded-full bg-forest-400 opacity-70"></div>
            <div className="h-10 w-10 rounded-full bg-rust-400 opacity-70 -ml-3"></div>
            <div className="h-10 w-10 rounded-full bg-peach-400 opacity-70 -ml-3"></div>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 bg-white p-10">
          <h1 className="font-display text-2xl font-bold text-ink-900 mb-1">Welcome Back</h1>
          <p className="text-sm text-ink-500 mb-7">Sign in to continue your journey.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />
              <div className="flex justify-end mt-1">
                <Link to="/forgot-password" className="text-xs font-medium text-forest-600 hover:text-forest-700">
                  Forgot password?
                </Link>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink-600 cursor-pointer">
              <input type="checkbox" className="rounded border-cream-300" />
              Keep me signed in
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-forest-500 py-2.5 text-sm font-semibold text-white hover:bg-forest-600 transition-colors disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 border-t border-cream-200"></div>
            <span className="text-xs text-ink-400">or continue with</span>
            <div className="flex-1 border-t border-cream-200"></div>
          </div>

          <button type="button" className="w-full rounded-full border border-cream-300 py-2.5 text-sm font-medium text-ink-700 hover:bg-cream-50 transition-colors">
            Continue with Google
          </button>

          <p className="text-center text-sm text-ink-500 mt-6">
            New to TalentMatch AI?{' '}
            <Link to="/register" className="font-medium text-forest-600 hover:text-forest-700">
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
