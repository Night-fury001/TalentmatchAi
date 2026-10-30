import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Users, Search, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { loginSchema } from '../../utils/schemas';
import { getErrorMessage } from '../../utils/axiosInstance';
import TalentMatchLogo from '../../components/TalentMatchLogo';

/* ── Illustrated avatar faces as inline SVG data URLs ─────────────────── */
function face(bg, hairColor, skinColor) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'>
      <circle cx='30' cy='30' r='30' fill='${bg}'/>
      <ellipse cx='30' cy='52' rx='18' ry='14' fill='${bg}' opacity='0.95'/>
      <circle cx='30' cy='24' r='13' fill='${skinColor}'/>
      <ellipse cx='30' cy='14' rx='14' ry='10' fill='${hairColor}'/>
      <circle cx='25.5' cy='23' r='2' fill='#3a2010' opacity='0.8'/>
      <circle cx='34.5' cy='23' r='2' fill='#3a2010' opacity='0.8'/>
      <path d='M26 30 Q30 33.5 34 30' stroke='#c07060' stroke-width='1.3' fill='none' stroke-linecap='round'/>
    </svg>`
  )}`;
}

const AVATARS = [
  face('#c8b89a', '#d4a060', '#f0d0b0'),  // 0 blonde woman — top
  face('#9a7a5a', '#1a1008', '#c08060'),  // 1 dark-skinned woman (orange bg)
  face('#b89878', '#6a3820', '#e8c0a0'),  // 2 brunette woman — mid
  face('#7a9878', '#1a3010', '#c8a880'),  // 3 young man teal
  face('#c0a888', '#c8a050', '#f0d8b8'),  // 4 blonde woman — bottom
];

/* The avatar network is placed in the PAGE BACKGROUND to the LEFT of the card */
function AvatarNetwork() {
  // positions within a 200×480 viewBox, left of card
  const nodes = [
    { cx: 90,  cy: 55,  r: 32, av: 0 },  // top — blonde woman
    { cx: 32,  cy: 160, r: 30, av: 1 },  // mid-left — dark-skinned
    { cx: 115, cy: 230, r: 28, av: 2 },  // mid — brunette
    { cx: 30,  cy: 320, r: 28, av: 3 },  // lower-left — young man
    { cx: 100, cy: 390, r: 26, av: 4 },  // bottom — blonde woman 2
  ];
  return (
    <svg
      viewBox="0 0 200 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden="true"
    >
      {/* Curved connection lines — warm rust, solid thin */}
      <path d="M90 55 Q55 110 32 160"   stroke="#b07848" strokeWidth="1.3" opacity="0.45" fill="none"/>
      <path d="M32 160 Q75 195 115 230" stroke="#b07848" strokeWidth="1.3" opacity="0.4"  fill="none"/>
      <path d="M115 230 Q60 275 30 320" stroke="#b07848" strokeWidth="1.3" opacity="0.38" fill="none"/>
      <path d="M30 320 Q65 355 100 390" stroke="#b07848" strokeWidth="1.3" opacity="0.35" fill="none"/>
      <path d="M90 55 Q115 140 115 230" stroke="#b07848" strokeWidth="1"   opacity="0.25" fill="none"/>

      {/* Avatar circles */}
      {nodes.map(({ cx, cy, r, av }) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r={r + 2} fill="white" opacity="0.85"/>
          <circle cx={cx} cy={cy} r={r} fill="none"/>
          <image href={AVATARS[av]} x={cx - r} y={cy - r} width={r * 2} height={r * 2}
            clipPath={`circle(${r}px at ${r}px ${r}px)`}
            style={{ borderRadius: '50%' }}/>
        </g>
      ))}
    </svg>
  );
}

/* ── Google G icon ──────────────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(loginSchema) });

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
    /* Full-page warm sandy background */
    <div
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#e8d5b5' }}
    >
      {/* ── ORGANIC BACKGROUND BLOBS (SVG shapes, not circles) ── */}
      <svg
        className="pointer-events-none absolute inset-0 w-full h-full"
        viewBox="0 0 1024 768"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        aria-hidden="true"
      >
        {/* Top-left large amoeba blob */}
        <path
          d="M-60 -80 C60 -120 220 -60 280 60 C340 180 260 300 160 340 C60 380 -80 300 -120 180 C-160 60 -180 40 -60 -80Z"
          fill="#d4bc96" opacity="0.55"
        />
        {/* Second softer blob overlapping top-left */}
        <path
          d="M-40 80 C40 20 160 40 200 140 C240 240 180 340 80 360 C-20 380 -80 300 -100 200 C-120 100 -120 140 -40 80Z"
          fill="#c8ae82" opacity="0.3"
        />
        {/* Small oval mid-left */}
        <ellipse cx="80" cy="440" rx="55" ry="38" fill="#c8ae82" opacity="0.35" transform="rotate(-15 80 440)"/>
        {/* Bottom-right soft blob */}
        <path
          d="M900 680 C980 640 1060 700 1080 780 C1100 860 1040 920 960 900 C880 880 840 820 860 760 C870 720 860 700 900 680Z"
          fill="#d4bc96" opacity="0.4"
        />
        {/* 4-pointed sparkle — bottom right */}
        <path
          d="M940 600 L943 615 L958 618 L943 621 L940 636 L937 621 L922 618 L937 615 Z"
          fill="white" opacity="0.7"
        />
        {/* Tiny sparkle — top right */}
        <path
          d="M870 80 L872 90 L882 92 L872 94 L870 104 L868 94 L858 92 L868 90 Z"
          fill="white" opacity="0.5"
        />
      </svg>

      {/* ── AVATAR NETWORK — left side of page, outside the card ── */}
      <div
        className="pointer-events-none absolute"
        style={{ left: 0, top: '50%', transform: 'translateY(-50%)', width: 180, height: 480 }}
        aria-hidden="true"
      >
        <AvatarNetwork />
      </div>

      {/* ── MAIN CARD ── */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex rounded-2xl overflow-hidden"
        style={{
          width: '100%',
          maxWidth: 820,
          marginLeft: 160,
          zIndex: 10,
          boxShadow: '0 8px 40px -8px rgba(80,50,20,0.18)',
        }}
      >
        {/* ── LEFT PANEL ── */}
        <div
          className="hidden md:flex flex-col relative overflow-hidden p-9 shrink-0"
          style={{ width: 310, backgroundColor: '#e0c9a8' }}
        >
          {/* Subtle inner blob */}
          <div
            className="pointer-events-none absolute -bottom-12 -right-12 rounded-full"
            style={{ width: 180, height: 180, background: 'radial-gradient(circle, rgba(190,150,90,0.3) 0%, transparent 70%)' }}
          />

          {/* Logo + brand */}
          <div className="flex items-center gap-2.5 mb-7 relative z-10">
            <TalentMatchLogo className="h-9 w-9" />
            <span className="font-display text-[17px] font-bold text-ink-900">TalentMatch AI</span>
          </div>

          {/* Headline */}
          <h2
            className="relative z-10 font-display font-bold leading-snug mb-7"
            style={{ fontSize: '1.55rem', color: '#8B4513' }}
          >
            Human connections, powered by intelligent insights.
          </h2>

          {/* Feature bullets */}
          <ul className="relative z-10 space-y-5 flex-1">
            {[
              { Icon: Users,  title: 'Human & AI Synergy',            desc: 'Experience a recruitment flow that values the person behind the resume.' },
              { Icon: Search, title: 'Match Insights & Collaboration', desc: 'Seamlessly review, shortlist, and connect with optimal fits.' },
              { Icon: Heart,  title: 'Natural & Warm Experience',      desc: 'Crafted for human-centric teams.' },
            ].map(({ Icon, title, desc }) => (
              <li key={title} className="flex items-start gap-3">
                <span
                  className="mt-0.5 shrink-0 flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: 'rgba(255,255,255,0.55)' }}
                >
                  <Icon className="w-4 h-4" style={{ color: '#7a5c3a' }} />
                </span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#3a2810' }}>{title}</p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#7a6048' }}>{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 bg-white px-10 py-9 flex flex-col justify-center">
          <h1 className="font-display text-[1.7rem] font-bold text-ink-900 mb-1">Welcome Back</h1>
          <p className="text-sm mb-7" style={{ color: '#7a6048' }}>
            Sign in to continue connecting talent &amp; opportunity.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#3a2810' }}>Email Address</label>
              <input
                type="email"
                placeholder="your@company.com"
                {...register('email')}
                className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-ink-400"
                style={{ borderColor: '#d4bc96', background: '#fdfaf6' }}
                onFocus={e => (e.target.style.borderColor = '#2d6b30')}
                onBlur={e => (e.target.style.borderColor = '#d4bc96')}
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium" style={{ color: '#3a2810' }}>Password</label>
                <Link to="/forgot-password" className="text-xs font-medium" style={{ color: '#8B4513' }}>
                  Forgot?
                </Link>
              </div>
              <input
                type="password"
                placeholder="••••••••••"
                {...register('password')}
                className="w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors"
                style={{ borderColor: '#d4bc96', background: '#fdfaf6' }}
                onFocus={e => (e.target.style.borderColor = '#2d6b30')}
                onBlur={e => (e.target.style.borderColor = '#d4bc96')}
              />
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            {/* Keep me signed in */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border"
                style={{ accentColor: '#d4a050', borderColor: '#d4bc96' }}
              />
              <span className="text-sm" style={{ color: '#5a4030' }}>Keep me signed in</span>
            </label>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
              style={{ background: '#2d6b30' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#235326')}
              onMouseLeave={e => (e.currentTarget.style.background = '#2d6b30')}
            >
              {isSubmitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Social SSO divider */}
          <p className="text-center text-xs my-4" style={{ color: '#9a8060' }}>Social SSO</p>

          {/* Google */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2.5 rounded-lg border py-2.5 text-sm font-medium transition-colors mb-2.5"
            style={{ borderColor: '#d4bc96', color: '#3a2810', background: '#fdfaf6' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f5ede0')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fdfaf6')}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* SSO */}
          <button
            type="button"
            className="w-full flex items-center justify-center rounded-lg border py-2.5 text-sm font-medium transition-colors"
            style={{ borderColor: '#d4bc96', color: '#3a2810', background: '#fdfaf6' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f5ede0')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fdfaf6')}
          >
            Single Sign-On (SSO)
          </button>

          {/* Footer links */}
          <p className="text-center text-sm mt-5" style={{ color: '#9a8060' }}>
            New to TalentMatch AI?{' '}
            <Link to="/register" className="font-medium" style={{ color: '#2d6b30' }}>
              Create an account
            </Link>
          </p>
          <p className="text-center text-xs mt-2" style={{ color: '#b0988a' }}>
            <Link to="#" className="hover:underline">Terms of Service</Link>
            {' · '}
            <Link to="#" className="hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
