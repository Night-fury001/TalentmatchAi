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
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema), defaultValues: { role: 'CLIENT' } });

  const watchedPassword = watch('password');

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
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 overflow-hidden" style={{ backgroundColor: '#fdf6ef' }}>

      {/* ── PAGE BACKGROUND BLOBS ── */}
      {/* Top-right organic blob */}
      <div
        className="pointer-events-none absolute -top-40 -right-32 w-[480px] h-[480px] rounded-full"
        style={{ background: 'radial-gradient(circle, #f5d0a8 0%, #fbe8d0 40%, transparent 72%)', opacity: 0.65 }}
      />
      {/* Bottom-left organic blob */}
      <div
        className="pointer-events-none absolute -bottom-32 -left-28 w-[400px] h-[400px] rounded-full"
        style={{ background: 'radial-gradient(circle, #d4e4d4 0%, #eef3ee 45%, transparent 70%)', opacity: 0.6 }}
      />
      {/* Mid warm accent */}
      <div
        className="pointer-events-none absolute top-1/2 right-1/4 -translate-y-1/2 w-[320px] h-[220px] rounded-full"
        style={{ background: 'radial-gradient(ellipse, rgba(237,224,204,0.4) 0%, transparent 70%)' }}
      />
      {/* Sparkle accent */}
      <svg className="pointer-events-none absolute top-20 left-16 w-6 h-6 opacity-35" viewBox="0 0 32 32" fill="none">
        <path d="M16 2 L17.5 14.5 L30 16 L17.5 17.5 L16 30 L14.5 17.5 L2 16 L14.5 14.5 Z" fill="#c04a18" />
      </svg>
      <svg className="pointer-events-none absolute bottom-24 right-20 w-5 h-5 opacity-30" viewBox="0 0 32 32" fill="none">
        <path d="M16 2 L17.5 14.5 L30 16 L17.5 17.5 L16 30 L14.5 17.5 L2 16 L14.5 14.5 Z" fill="#2d6b30" />
      </svg>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-4xl flex rounded-3xl overflow-hidden shadow-soft border border-cream-200"
        style={{ zIndex: 1 }}
      >
        {/* Left panel */}
        <div className="hidden md:flex flex-col justify-between relative overflow-hidden p-10 w-2/5" style={{ backgroundColor: '#f0e8da' }}>

          {/* Left panel background blobs */}
          <div
            className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(237,176,112,0.3) 0%, transparent 70%)' }}
          />
          <div
            className="pointer-events-none absolute -bottom-8 -left-8 w-52 h-52 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(45,107,48,0.1) 0%, transparent 70%)' }}
          />

          {/* Floating avatar network — all inside SVG so overflow:hidden clips correctly */}
          <svg
            className="pointer-events-none absolute inset-0 w-full h-full"
            viewBox="0 0 200 500"
            fill="none"
            preserveAspectRatio="xMidYMid slice"
          >
            {/* Connection lines */}
            <path d="M40 44 Q95 85 130 130" stroke="#c04a18" strokeWidth="1" strokeOpacity="0.22" strokeDasharray="5 4"/>
            <path d="M130 130 Q100 190 30 248" stroke="#2d6b30" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="5 4"/>
            <path d="M130 130 Q148 195 138 272" stroke="#e08840" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="5 4"/>
            <path d="M30 248 Q84 260 138 272" stroke="#4d8b50" strokeWidth="1" strokeOpacity="0.17" strokeDasharray="5 4"/>
            <path d="M138 272 Q105 350 60 388" stroke="#9a3a12" strokeWidth="1" strokeOpacity="0.17" strokeDasharray="5 4"/>

            {/* ER — top area */}
            <circle cx="40" cy="44" r="27" fill="white" opacity="0.6"/>
            <circle cx="40" cy="44" r="24" fill="#c04a18" opacity="0.88"/>
            <text x="40" y="50" textAnchor="middle" fill="white" fontSize="11" fontWeight="700" fontFamily="system-ui">ER</text>

            {/* MC — mid-right */}
            <circle cx="148" cy="130" r="23" fill="white" opacity="0.6"/>
            <circle cx="148" cy="130" r="20" fill="#2d6b30" opacity="0.88"/>
            <text x="148" y="136" textAnchor="middle" fill="white" fontSize="10" fontWeight="700" fontFamily="system-ui">MC</text>

            {/* JS — mid-left */}
            <circle cx="30" cy="248" r="21" fill="white" opacity="0.6"/>
            <circle cx="30" cy="248" r="18" fill="#e08840" opacity="0.88"/>
            <text x="30" y="254" textAnchor="middle" fill="white" fontSize="10" fontWeight="700" fontFamily="system-ui">JS</text>

            {/* AL — mid-right lower */}
            <circle cx="150" cy="272" r="19" fill="white" opacity="0.6"/>
            <circle cx="150" cy="272" r="16" fill="#4d8b50" opacity="0.88"/>
            <text x="150" y="278" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">AL</text>

            {/* PK — bottom */}
            <circle cx="60" cy="388" r="17" fill="white" opacity="0.6"/>
            <circle cx="60" cy="388" r="14" fill="#9a3a12" opacity="0.88"/>
            <text x="60" y="394" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="system-ui">PK</text>
          </svg>

          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 mb-8">
              <TalentMatchLogo className="h-9 w-9" />
              <span className="font-display text-lg font-bold text-ink-900">TalentMatch AI</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-rust-500 leading-snug">
              Your journey to the perfect fit starts here.
            </h2>
            <ul className="mt-6 space-y-4">
              {[
                { icon: Zap, title: 'AI-Powered Matches', desc: 'No more endless scrolling. Find natural fits based on your unique skills.' },
                { icon: Users, title: 'Real Human Connection', desc: 'Directly interact with employers who value what you bring to the table.' },
                { icon: Heart, title: 'Collaborative Journey', desc: 'Get personalized feedback, rich insights, and a transparent recruitment flow.' },
              ].map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/60 text-forest-600 shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink-800">{title}</p>
                    <p className="text-xs text-ink-500 mt-0.5">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative z-10" />
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
            {/* Visual password strength bar */}
            <div className="flex gap-1 -mt-1">
              <div className={clsx('h-1 flex-1 rounded-full transition-colors', watchedPassword && watchedPassword.length >= 1 ? 'bg-rust-400' : 'bg-cream-200')} />
              <div className={clsx('h-1 flex-1 rounded-full transition-colors', watchedPassword && watchedPassword.length >= 6 ? 'bg-peach-400' : 'bg-cream-200')} />
              <div className={clsx('h-1 flex-1 rounded-full transition-colors', watchedPassword && watchedPassword.length >= 10 ? 'bg-forest-400' : 'bg-cream-200')} />
            </div>
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
