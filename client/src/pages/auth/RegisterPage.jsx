import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Zap, Users, Heart, User, Briefcase } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { registerSchema } from '../../utils/schemas';
import { getErrorMessage } from '../../utils/axiosInstance';
import Input from '../../components/ui/Input';
import TalentMatchLogo from '../../components/TalentMatchLogo';

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [role, setRole] = useState('CLIENT');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema), defaultValues: { role: 'CLIENT' } });

  const chooseRole = (value) => {
    setRole(value);
    setValue('role', value);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const user = await registerUser(data);
      toast.success('Account created! Check your email to verify your address.');
      navigate(user.role === 'RECRUITER' ? '/recruiter/dashboard' : '/client/dashboard', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not create your account.'));
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
              Your journey to the perfect fit starts here.
            </h2>
            <ul className="mt-6 space-y-4">
              {[
                { icon: Zap, title: 'AI-Powered Matches', desc: 'Matched by skills, not just keywords.' },
                { icon: Users, title: 'Real Human Connection', desc: 'Warm introductions, not cold outreach.' },
                { icon: Heart, title: 'Collaborative Journey', desc: 'Your team reviews every match together.' },
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
          <h1 className="font-display text-2xl font-bold text-ink-900 mb-1">Create your Account</h1>
          <p className="text-sm text-ink-500 mb-6">Join TalentMatch AI today.</p>

          {/* Role toggle */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => chooseRole('CLIENT')}
              className={clsx(
                'flex items-center justify-center gap-2 rounded-full border-2 px-4 py-2.5 text-sm font-medium transition-colors',
                role === 'CLIENT' ? 'border-forest-500 bg-forest-50 text-forest-700' : 'border-cream-300 text-ink-600 hover:border-cream-400'
              )}
            >
              <User className="w-4 h-4" />
              I am a Candidate
            </button>
            <button
              type="button"
              onClick={() => chooseRole('RECRUITER')}
              className={clsx(
                'flex items-center justify-center gap-2 rounded-full border-2 px-4 py-2.5 text-sm font-medium transition-colors',
                role === 'RECRUITER' ? 'border-forest-500 bg-forest-50 text-forest-700' : 'border-cream-300 text-ink-600 hover:border-cream-400'
              )}
            >
              <Briefcase className="w-4 h-4" />
              I am an Employer
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <input type="hidden" {...register('role')} />
            <Input label="Full name" placeholder="Jamie Rivera" error={errors.fullName?.message} {...register('fullName')} />
            <Input label="Email address" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
            <Input label="Confirm password" type="password" placeholder="••••••••" error={errors.confirmPassword?.message} {...register('confirmPassword')} />

            <label className="flex items-center gap-2 text-xs text-ink-500 cursor-pointer">
              <input type="checkbox" className="rounded border-cream-300" />
              I agree to the Terms of Service and Privacy Policy
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-forest-500 py-2.5 text-sm font-semibold text-white hover:bg-forest-600 transition-colors disabled:opacity-60"
            >
              {isSubmitting ? 'Creating account...' : 'Get Started'}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="flex-1 border-t border-cream-200"></div>
            <span className="text-xs text-ink-400">Or sign up with</span>
            <div className="flex-1 border-t border-cream-200"></div>
          </div>

          <button type="button" className="w-full rounded-full border border-cream-300 py-2.5 text-sm font-medium text-ink-700 hover:bg-cream-50 transition-colors">
            Continue with Google
          </button>

          <p className="text-center text-sm text-ink-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-forest-600 hover:text-forest-700">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
