# Implementation Plan — TalentMatch AI Rebrand & Redesign

## Codebase Findings

- **"Northa" occurrences found**: `Navbar.jsx` (line 8), `RecruiterLayout.jsx` (lines 59, 79),
  `ClientLayout.jsx` (lines 72, 88), `AdminLayout.jsx` (lines 72, 87), `LandingPage.jsx` (line 42),
  `Footer.jsx` (line 5). No service/utility JS files contain "Northa".
- **`index.html`**: Title is `"Northa — AI-Powered Job Portal"`, theme-color is `#6d3fff`. Both need updating.
- **Current color system**: `ink` (cool gray) + `brand` (purple `#6d3fff`). The new config adds
  `cream`, `forest`, `rust`, `peach` and re-aliases `brand` → forest for backward compatibility.
- **`Button.jsx`** uses `variant="primary"` → `bg-brand-600`. After the config change, `brand-600`
  maps to `forest-600` automatically — no Button.jsx edits needed.
- **`Card.jsx`** renders `.surface` class (defined in `index.css` as `bg-white border border-ink-200/70
  rounded-3xl shadow-soft`) — no changes needed there.
- **`RegisterPage.jsx`**: `register` is aliased to `registerUser` for the auth hook, so the
  react-hook-form `register` name is safe. Destructure `watch` from `useForm` for the visual password
  strength bar.
- **`RecruiterDashboardPage.jsx`**: does NOT currently import `useAuth` or `Sparkles` — both must be
  added. The greeting uses `user?.recruiterProfile?.fullName ?? 'Recruiter'` via the auth context
  (same pattern as `RecruiterLayout.jsx` which reads `user?.recruiterProfile`).
- **`APPLICATION_STATUS_LABELS`** has 7 keys; pipeline stages show 5 (PENDING, SHORTLISTED,
  INTERVIEWING ×2, OFFERED) — the repeated INTERVIEWING key is intentional decoration.
- **`clsx`** is already imported in all layout files and RegisterPage; NOT in RecruiterDashboardPage
  — add it there.
- **Build command**: `cd d:\VS Code\job-portal-final\job-portal\client ; npx vite build 2>&1`

---

## Step-by-Step Plan

- [ ] 1. **`tailwind.config.js`** — replace color palette and fix `boxShadow.lift`.
      Replace the entire `colors` object under `theme.extend` with the new `cream`, `forest`, `rust`,
      `peach`, `brand` (aliased to forest values), and `ink` (warm brownish-gray) palettes as
      specified in the design system. Update `boxShadow.lift` from the purple rgba to
      `'0 8px 30px -8px rgba(45,107,48,0.35)'`. Keep all other config untouched (fontFamily,
      backgroundImage, borderRadius, keyframes, animation, `boxShadow.soft`, `boxShadow.glow`).
      Files: `client/tailwind.config.js`
      Verify: `cd d:\VS Code\job-portal-final\job-portal\client ; npx vite build 2>&1` — exits 0.

- [ ] 2. **`src/index.css`** — update body bg and selection colors.
      In `@layer base`:
      - `body`: change `bg-ink-50` → `bg-cream-50`.
      - `::selection`: change `bg-brand-200 text-brand-900` → `bg-forest-200 text-forest-900`.
      - `.focus-ring`: change `focus-visible:ring-brand-400` → `focus-visible:ring-forest-400`.
      Keep scrollbar rules, `.surface`, `.grain-overlay`, `.skeleton` exactly as-is.
      Files: `client/src/index.css`
      Verify: `npx vite build` — exits 0, no CSS errors.

- [ ] 3. **`index.html`** — rebrand title and meta.
      - `<title>`: `Northa — AI-Powered Job Portal` → `TalentMatch AI — Find Your Perfect Fit`
      - `<meta name="theme-color" content="#6d3fff">` → `content="#2d6b30"`
      - `<meta name="description">`: update to `"AI-powered job matching — find your next role or your
        next hire with TalentMatch AI."`
      - `<body class="bg-ink-50 ...">` → `bg-cream-50`
      Files: `client/index.html`
      Verify: `npx vite build` — exits 0.

- [ ] 4. **`src/components/Footer.jsx`** — replace "Northa".
      Change footer text:
      `© {new Date().getFullYear()} Northa. Find your next role, faster.`
      → `© {new Date().getFullYear()} TalentMatch AI. Human connections, powered by intelligence.`
      Files: `client/src/components/Footer.jsx`
      Verify: `npx vite build` — exits 0.

- [ ] 5. **`src/components/Navbar.jsx`** — full redesign with TalentMatchLogo.
      Changes:
      - Remove `Sparkles` import (no longer used).
      - Define `TalentMatchLogo` as a local function **above** the default export:
        ```jsx
        function TalentMatchLogo({ className = 'h-8 w-8' }) {
          return (
            <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="10" fill="white"/>
              <ellipse cx="22" cy="16" rx="9" ry="6" transform="rotate(-30 22 16)" fill="#2d6b30" opacity="0.9"/>
              <ellipse cx="18" cy="24" rx="9" ry="6" transform="rotate(-30 18 24)" fill="#c04a18" opacity="0.85"/>
              <circle cx="20" cy="20" r="2.5" fill="white"/>
            </svg>
          );
        }
        ```
      - `<header>` classes: `border-ink-100 bg-ink-50/80` → `border-cream-200 bg-cream-50/90`.
      - Logo `<Link>`: replace `<span className="...bg-brand-600..."><Sparkles/></span> Northa` with
        `<TalentMatchLogo className="h-8 w-8" /> TalentMatch AI`.
      - Nav links: replace the single "Browse jobs" link with four `<a href="#">` anchors:
        "How It Works", "For Employers", "For Candidates", "About Us" — same `hover:text-ink-900
        transition-colors` style.
      - Auth buttons: rename "Log in" → "Sign In" (ghost variant unchanged). Rename "Get started" →
        "Get Started" and add `className="bg-forest-500 hover:bg-forest-600 text-white rounded-full"`.
        (Since `brand` now aliases `forest`, `variant="primary"` also works — but explicit className
        is more explicit and future-proof.)
      - Authenticated state: keep "Go to dashboard" button as-is.
      Files: `client/src/components/Navbar.jsx`
      Verify: `npx vite build` — exits 0; no "Northa" in file.

- [ ] 6. **`src/layouts/RecruiterLayout.jsx`** — forest palette sidebar, TalentMatchLogo.
      Changes:
      - Remove `Sparkles` from the lucide import list.
      - Define `TalentMatchLogo` (same SVG as step 5) above the `NAV_ITEMS` constant.
      - `SidebarContent` active class: `bg-brand-50 text-brand-700` → `bg-forest-500/10 text-forest-600`.
      - `SidebarContent` inactive hover: `hover:bg-ink-100` → `hover:bg-cream-100`.
      - "Post a job" NavLink: `bg-brand-600 text-white hover:bg-brand-700` →
        `bg-forest-500 text-white hover:bg-forest-600`.
      - Desktop `<aside>`: `border-ink-100 bg-white` → `border-cream-200 bg-cream-50`.
      - Desktop logo block: replace `<span className="...bg-brand-600..."><Sparkles/></span> Northa`
        with `<TalentMatchLogo className="h-8 w-8" /> TalentMatch AI`.
      - "Recruiter" badge: `text-brand-500 bg-brand-50` → `text-forest-600 bg-forest-50`.
      - Mobile aside `<motion.aside>`: `bg-white` → `bg-cream-50`.
      - Mobile header title: `"Northa"` → `"TalentMatch AI"`.
      - Top sticky `<header>`: `border-ink-100 bg-white/90` → `border-cream-200 bg-cream-50/90`.
      Files: `client/src/layouts/RecruiterLayout.jsx`
      Verify: `npx vite build` — exits 0; no "Northa" in file.

- [ ] 7. **`src/layouts/ClientLayout.jsx`** — same pattern as step 6.
      Changes:
      - **Keep** `Sparkles` in the import (it is used as the nav icon for "AI matches" in `NAV_ITEMS`).
      - Define `TalentMatchLogo` (same SVG) above `NAV_ITEMS`.
      - `SidebarContent` active class: `bg-brand-50 text-brand-700` → `bg-forest-500/10 text-forest-600`.
      - `SidebarContent` inactive hover: `hover:bg-ink-100` → `hover:bg-cream-100`.
      - Desktop `<aside>`: `border-ink-100 bg-white` → `border-cream-200 bg-cream-50`.
      - Desktop logo block: replace `<span className="...bg-brand-600..."><Sparkles/></span> Northa`
        with `<TalentMatchLogo className="h-8 w-8" /> TalentMatch AI`.
      - Mobile aside `<motion.aside>`: `bg-white` → `bg-cream-50`.
      - Mobile header title: `"Northa"` → `"TalentMatch AI"`.
      - Top sticky `<header>`: `border-ink-100 bg-white/90` → `border-cream-200 bg-cream-50/90`.
      Files: `client/src/layouts/ClientLayout.jsx`
      Verify: `npx vite build` — exits 0; no "Northa" in file.

- [ ] 8. **`src/layouts/PublicLayout.jsx`** — update root div bg.
      Change outer `<div className="min-h-screen flex flex-col bg-ink-50">` →
      `bg-cream-50`.
      Files: `client/src/layouts/PublicLayout.jsx`
      Verify: `npx vite build` — exits 0.

- [ ] 9. **`src/layouts/AdminLayout.jsx`** — forest palette sidebar, TalentMatchLogo.
      Changes:
      - Remove `Sparkles` from the lucide import list.
      - Define `TalentMatchLogo` (same SVG) above `NAV_ITEMS`.
      - `SidebarContent` active class: `bg-brand-50 text-brand-700` → `bg-forest-500/10 text-forest-600`.
      - `SidebarContent` inactive hover: `hover:bg-ink-100` → `hover:bg-cream-100`.
      - Desktop `<aside>`: `border-ink-100 bg-white` → `border-cream-200 bg-cream-50`.
      - Desktop logo block: replace `<span className="...bg-ink-900..."><Sparkles/></span> Northa`
        with `<TalentMatchLogo className="h-8 w-8" /> TalentMatch AI`. Keep the "Admin" badge span
        unchanged (`bg-ink-100 text-ink-500`).
      - Mobile aside `<motion.aside>`: `bg-white` → `bg-cream-50`.
      - Mobile header title: `"Northa"` → `"TalentMatch AI"`.
      - Top sticky `<header>`: `border-ink-100 bg-white/90` → `border-cream-200 bg-cream-50/90`.
      Files: `client/src/layouts/AdminLayout.jsx`
      Verify: `npx vite build` — exits 0; no "Northa" in file.

- [ ] 10. **`src/pages/LandingPage.jsx`** — full rewrite to TalentMatch AI homepage.
       Remove all current imports and content. New file structure:

       **Imports**: `Link` from react-router-dom; `motion` from framer-motion;
       `Users, Sparkles, Heart, ShieldCheck` from lucide-react; `Button` from
       `'../components/ui/Button'`.

       **FEATURES array** (4 entries):
       ```js
       const FEATURES = [
         { icon: Users,       title: 'Human & AI Synergy',
           description: 'Our AI surfaces the best candidates — your team makes every final call.' },
         { icon: Sparkles,    title: 'Match Insights & Collaboration',
           description: 'Transparent match scores give hiring teams shared context, not just a list.' },
         { icon: Heart,       title: 'Natural & Warm Experience',
           description: 'No cold corporate filters. Every interaction is designed to feel human.' },
         { icon: ShieldCheck, title: 'Verified Human Teams',
           description: 'Every employer is reviewed before their postings go live.' },
       ];
       ```

       **JSX structure**:
       ```
       <div className="bg-cream-50 min-h-screen">

         {/* Hero */}
         <section className="relative overflow-hidden py-20 lg:py-28">
           <div className="mx-auto max-w-7xl px-6">
             <div className="grid lg:grid-cols-2 gap-12 items-center">

               {/* Left column */}
               <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
                           transition={{ duration:0.6, ease:[0.16,1,0.3,1] }}>
                 {/* Badge */}
                 <span className="inline-flex items-center gap-2 rounded-full border border-forest-200
                   bg-forest-50 px-4 py-1.5 text-xs font-medium text-forest-600">
                   <Sparkles className="w-3.5 h-3.5" /> AI-Powered Matching
                 </span>
                 {/* H1 */}
                 <h1 className="mt-6 font-display text-4xl sm:text-5xl font-bold text-ink-900
                   leading-tight">
                   Your journey to the perfect fit<br/>
                   <span className="text-forest-500">starts here.</span>
                 </h1>
                 {/* Subtitle */}
                 <p className="mt-3 text-xl font-medium text-rust-500">
                   Where human connections meet intelligent insights.
                 </p>
                 {/* Body */}
                 <p className="mt-4 text-lg text-ink-500 leading-relaxed max-w-lg">
                   TalentMatch AI brings together the warmth of human connection with the precision
                   of intelligent matching. Find roles that resonate — or candidates that truly fit.
                 </p>
                 {/* CTAs */}
                 <div className="mt-8 flex flex-wrap items-center gap-3">
                   <Link to="/register">
                     <Button size="lg"
                       className="bg-forest-500 hover:bg-forest-600 text-white rounded-full border-0">
                       Find Your Match
                     </Button>
                   </Link>
                   <Button size="lg" variant="ghost"
                     className="border border-cream-300 rounded-full">
                     Watch How It Works
                   </Button>
                 </div>
                 {/* Trust bar */}
                 <div className="mt-8 flex items-center gap-3">
                   <div className="flex -space-x-2">
                     {[['AC','bg-forest-200 text-forest-700'],
                       ['BK','bg-rust-200 text-rust-700'],
                       ['CM','bg-peach-200 text-peach-700'],
                       ['DL','bg-cream-300 text-ink-700']].map(([initials, cls]) => (
                       <div key={initials}
                         className={`h-8 w-8 rounded-full border-2 border-cream-50 flex items-center
                           justify-center text-xs font-bold ${cls}`}>
                         {initials}
                       </div>
                     ))}
                   </div>
                   <p className="text-sm text-ink-500">
                     Trusted by <span className="font-semibold text-ink-700">500+</span>
                     {' '}human-centric teams
                   </p>
                 </div>
               </motion.div>

               {/* Right column — decorative card mockup */}
               <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }}
                           transition={{ duration:0.6, delay:0.15, ease:[0.16,1,0.3,1] }}
                 className="relative">
                 {/* Subtle background dots */}
                 <div className="absolute inset-0 -z-10 opacity-40"
                   style={{ backgroundImage:
                     'radial-gradient(circle, #a9c9aa 1px, transparent 1px)',
                     backgroundSize: '24px 24px' }} />
                 {/* Card */}
                 <div className="bg-white border border-cream-200 rounded-3xl p-6 shadow-soft
                   max-w-sm mx-auto">
                   {/* Avatar row */}
                   <div className="flex items-center gap-3 mb-4">
                     <div className="h-10 w-10 rounded-full bg-forest-200 flex items-center
                       justify-center text-forest-700 font-bold text-sm">AC</div>
                     <div>
                       <p className="font-semibold text-ink-900">Alex Chen</p>
                       <p className="text-sm text-ink-500">Senior Product Designer</p>
                     </div>
                   </div>
                   {/* Match score badge */}
                   <div className="mb-4 inline-flex items-center gap-2 bg-forest-50 border
                     border-forest-200 text-forest-600 rounded-full px-3 py-1 text-sm font-medium">
                     <Sparkles className="w-3.5 h-3.5" /> AI Match Score: 94%
                   </div>
                   {/* Skill tags */}
                   <div className="flex flex-wrap gap-2">
                     {['Product Strategy','UX Research','Figma','Systems Thinking'].map(skill => (
                       <span key={skill}
                         className="bg-cream-100 border border-cream-200 text-ink-700 rounded-full
                           px-3 py-1 text-sm">
                         {skill}
                       </span>
                     ))}
                   </div>
                 </div>
               </motion.div>

             </div>
           </div>
         </section>

         {/* Features */}
         <section className="mx-auto max-w-6xl px-6 pb-24">
           <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
             {FEATURES.map((feature, i) => (
               <motion.div key={feature.title}
                 initial={{ opacity:0, y:16 }} whileInView={{ opacity:1, y:0 }}
                 viewport={{ once:true, margin:'-40px' }}
                 transition={{ duration:0.4, delay: i * 0.08 }}
                 className="bg-white border border-cream-200 rounded-2xl p-6 shadow-soft">
                 <div className="flex h-11 w-11 items-center justify-center rounded-2xl
                   bg-forest-50 text-forest-500 mb-4">
                   <feature.icon className="w-5 h-5" />
                 </div>
                 <h3 className="font-semibold text-ink-900">{feature.title}</h3>
                 <p className="mt-1.5 text-sm text-ink-500">{feature.description}</p>
               </motion.div>
             ))}
           </div>
         </section>

       </div>
       ```
       Files: `client/src/pages/LandingPage.jsx`
       Verify: `npx vite build` — exits 0; no "Northa" in file.

- [ ] 11. **`src/pages/auth/LoginPage.jsx`** — two-column card redesign, preserve all form logic.
        **Preserve exactly** (do not move or modify):
        - All imports at top (add `Users, Heart` from lucide-react).
        - The entire logic block: `useAuth`, `useNavigate`, `useLocation`, `useState(isSubmitting)`,
          `useForm` with `zodResolver(loginSchema)`, `onSubmit` async function.

        **Add** `TalentMatchLogo` local function (same SVG) above the default export.

        Replace only the `return (...)` JSX:
        ```
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-cream-50">
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.5, ease:[0.16,1,0.3,1] }}
            className="w-full max-w-4xl">
            <div className="flex rounded-3xl overflow-hidden shadow-soft border border-cream-200">

              {/* Left panel */}
              <div className="hidden md:flex flex-col justify-between bg-cream-100
                rounded-l-3xl p-10 w-[42%]">
                <div>
                  <div className="flex items-center gap-2">
                    <TalentMatchLogo className="h-9 w-9" />
                    <span className="font-display text-lg font-bold text-ink-900">TalentMatch AI</span>
                  </div>
                  <h2 className="mt-8 font-display text-2xl font-bold text-rust-500 leading-snug">
                    Human connections,<br/>powered by intelligent insights.
                  </h2>
                  <ul className="mt-6 space-y-4">
                    {[
                      { icon: Users,    title: 'Human & AI Synergy',
                        sub: 'AI assists, humans decide' },
                      { icon: Sparkles, title: 'Match Insights & Collaboration',
                        sub: 'Transparent matching' },
                      { icon: Heart,    title: 'Natural & Warm Experience',
                        sub: 'No cold corporate filters' },
                    ].map(({ icon: Icon, title, sub }) => (
                      <li key={title} className="flex items-start gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl
                          bg-forest-100 text-forest-600 shrink-0 mt-0.5">
                          <Icon className="w-4 h-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-ink-800">{title}</p>
                          <p className="text-xs text-ink-500">{sub}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Decorative circles */}
                <div className="mt-8 flex">
                  <div className="h-10 w-10 rounded-full bg-forest-400 opacity-80" />
                  <div className="h-10 w-10 rounded-full bg-rust-400 opacity-80 -ml-3" />
                  <div className="h-10 w-10 rounded-full bg-peach-400 opacity-80 -ml-3" />
                </div>
              </div>

              {/* Right panel */}
              <div className="flex-1 flex flex-col justify-center bg-white rounded-r-3xl p-10">
                <h1 className="font-display text-2xl font-bold text-ink-900">Welcome Back</h1>
                <p className="text-sm text-ink-500 mt-1 mb-8">Sign in to continue your journey.</p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <Input label="Email address" type="email" placeholder="you@example.com"
                    error={errors.email?.message} {...register('email')} />
                  <Input label="Password" type="password" placeholder="••••••••"
                    error={errors.password?.message} {...register('password')} />
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-ink-500 cursor-pointer
                      select-none">
                      <input type="checkbox"
                        className="rounded border-ink-300 accent-forest-500" />
                      Keep me signed in
                    </label>
                    <Link to="/forgot-password"
                      className="text-xs font-medium text-forest-600 hover:text-forest-700">
                      Forgot password?
                    </Link>
                  </div>
                  <Button type="submit" isLoading={isSubmitting}
                    className="w-full bg-forest-500 hover:bg-forest-600 text-white rounded-full
                      py-3 border-0">
                    Sign In
                  </Button>
                </form>

                <div className="my-6 flex items-center gap-3">
                  <hr className="flex-1 border-cream-200" />
                  <span className="text-xs text-ink-400">or continue with</span>
                  <hr className="flex-1 border-cream-200" />
                </div>
                <button type="button"
                  className="w-full border border-cream-300 rounded-full py-2.5 text-sm
                    text-ink-700 hover:bg-cream-50 transition-colors">
                  Continue with Google
                </button>

                <p className="text-center text-sm text-ink-500 mt-6">
                  New to TalentMatch AI?{' '}
                  <Link to="/register"
                    className="font-medium text-forest-600 hover:text-forest-700">
                    Create an account
                  </Link>
                </p>
              </div>

            </div>
          </motion.div>
        </div>
        ```
        **Note**: The `Button` component's `primary` variant includes `bg-brand-600` etc. via its
        VARIANTS map; passing explicit `className` overrides for bg/rounded/border works because clsx
        appends them and Tailwind JIT processes them. However, since `brand` → `forest` after config
        change, `variant="primary"` would also produce green — use the explicit className approach
        for full clarity.
        Files: `client/src/pages/auth/LoginPage.jsx`
        Verify: `npx vite build` — exits 0.

- [ ] 12. **`src/pages/auth/RegisterPage.jsx`** — two-column card redesign, preserve all form logic.
        **Preserve exactly**:
        - All existing imports (keep `User`, `Briefcase`, `Sparkles`; add `Heart` from lucide-react).
        - Logic block: `useAuth().register` aliased to `registerUser`, `useState(isSubmitting)`,
          `useState(role)`, `useForm` with `zodResolver(registerSchema)`, `chooseRole`, `onSubmit`.
        - **Add** `watch` to the `useForm` destructure: `const { register, handleSubmit, setValue,
          watch, formState: { errors } } = useForm(...)`.
        - **Add** `const watchedPassword = watch('password');` after the useForm call — purely for
          the visual strength bar; no effect on validation.

        **Add** `TalentMatchLogo` local function (same SVG) above the default export.

        Replace only the `return (...)` JSX:
        ```
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-cream-50">
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.5, ease:[0.16,1,0.3,1] }}
            className="w-full max-w-4xl">
            <div className="flex rounded-3xl overflow-hidden shadow-soft border border-cream-200">

              {/* Left panel — same style as Login */}
              <div className="hidden md:flex flex-col justify-between bg-cream-100
                rounded-l-3xl p-10 w-[42%]">
                <div>
                  <div className="flex items-center gap-2">
                    <TalentMatchLogo className="h-9 w-9" />
                    <span className="font-display text-lg font-bold text-ink-900">TalentMatch AI</span>
                  </div>
                  <h2 className="mt-8 font-display text-2xl font-bold text-rust-500 leading-snug">
                    Your journey to the perfect fit starts here.
                  </h2>
                  <ul className="mt-6 space-y-4">
                    {[
                      { icon: Sparkles, title: 'AI-Powered Matches',
                        sub: 'Roles ranked by genuine fit' },
                      { icon: Heart,    title: 'Real Human Connection',
                        sub: 'Warmth at every touchpoint' },
                      { icon: Users,    title: 'Collaborative Journey',
                        sub: 'Work together, not in silos' },
                    ].map(({ icon: Icon, title, sub }) => (
                      <li key={title} className="flex items-start gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl
                          bg-forest-100 text-forest-600 shrink-0 mt-0.5">
                          <Icon className="w-4 h-4" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-ink-800">{title}</p>
                          <p className="text-xs text-ink-500">{sub}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Decorative circles */}
                <div className="mt-8 flex">
                  <div className="h-10 w-10 rounded-full bg-forest-400 opacity-80" />
                  <div className="h-10 w-10 rounded-full bg-rust-400 opacity-80 -ml-3" />
                  <div className="h-10 w-10 rounded-full bg-peach-400 opacity-80 -ml-3" />
                </div>
              </div>

              {/* Right panel */}
              <div className="flex-1 flex flex-col justify-center bg-white rounded-r-3xl p-10">
                <h1 className="font-display text-2xl font-bold text-ink-900">Create your Account</h1>
                <p className="text-sm text-ink-500 mt-1 mb-6">Join TalentMatch AI today.</p>

                {/* Role toggle */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button type="button" onClick={() => chooseRole('CLIENT')}
                    className={clsx(
                      'flex flex-col items-center gap-2 rounded-2xl border-2 px-4 py-3.5
                        transition-colors text-sm font-medium',
                      role === 'CLIENT'
                        ? 'border-forest-500 bg-forest-50 text-forest-700'
                        : 'border-ink-200 text-ink-600 hover:border-ink-300'
                    )}>
                    <User className={clsx('w-5 h-5',
                      role === 'CLIENT' ? 'text-forest-600' : 'text-ink-400')} />
                    I am a Candidate
                  </button>
                  <button type="button" onClick={() => chooseRole('RECRUITER')}
                    className={clsx(
                      'flex flex-col items-center gap-2 rounded-2xl border-2 px-4 py-3.5
                        transition-colors text-sm font-medium',
                      role === 'RECRUITER'
                        ? 'border-forest-500 bg-forest-50 text-forest-700'
                        : 'border-ink-200 text-ink-600 hover:border-ink-300'
                    )}>
                    <Briefcase className={clsx('w-5 h-5',
                      role === 'RECRUITER' ? 'text-forest-600' : 'text-ink-400')} />
                    I am an Employer/Recruiter
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <input type="hidden" {...register('role')} />
                  <Input label="Full Name" placeholder="Jamie Rivera"
                    error={errors.fullName?.message} {...register('fullName')} />
                  <Input label="Email address" type="email" placeholder="you@example.com"
                    error={errors.email?.message} {...register('email')} />
                  <Input label="Password" type="password" placeholder="••••••••"
                    error={errors.password?.message} {...register('password')} />
                  <Input label="Confirm Password" type="password" placeholder="••••••••"
                    error={errors.confirmPassword?.message} {...register('confirmPassword')} />

                  {/* Visual password strength bar — not wired to validation */}
                  <div className="flex gap-1 pt-0.5">
                    <div className={clsx('h-1 flex-1 rounded-full transition-colors',
                      watchedPassword ? 'bg-forest-400' : 'bg-cream-200')} />
                    <div className={clsx('h-1 flex-1 rounded-full transition-colors',
                      watchedPassword && watchedPassword.length >= 8
                        ? 'bg-forest-400' : 'bg-cream-200')} />
                    <div className={clsx('h-1 flex-1 rounded-full transition-colors',
                      watchedPassword && watchedPassword.length >= 12
                        ? 'bg-forest-400' : 'bg-cream-200')} />
                  </div>

                  {/* Terms — visual only */}
                  <label className="flex items-center gap-2 text-sm text-ink-500 cursor-pointer
                    select-none">
                    <input type="checkbox"
                      className="rounded border-ink-300 accent-forest-500" />
                    I agree to the Terms of Service and Privacy Policy
                  </label>

                  <Button type="submit" isLoading={isSubmitting}
                    className="w-full bg-forest-500 hover:bg-forest-600 text-white rounded-full
                      py-3 border-0">
                    Get Started
                  </Button>
                </form>

                <div className="my-4 flex items-center gap-3">
                  <hr className="flex-1 border-cream-200" />
                  <span className="text-xs text-ink-400">Or sign up with</span>
                  <hr className="flex-1 border-cream-200" />
                </div>
                <button type="button"
                  className="w-full border border-cream-300 rounded-full py-2.5 text-sm
                    text-ink-700 hover:bg-cream-50 transition-colors">
                  Continue with Google
                </button>

                <p className="text-center text-sm text-ink-500 mt-6">
                  Already have an account?{' '}
                  <Link to="/login"
                    className="font-medium text-forest-600 hover:text-forest-700">
                    Sign In
                  </Link>
                </p>
              </div>

            </div>
          </motion.div>
        </div>
        ```
        **Note**: `Users` is used in the bullet list but is not in the current RegisterPage imports —
        add it to the lucide-react import line.
        Files: `client/src/pages/auth/RegisterPage.jsx`
        Verify: `npx vite build` — exits 0.

- [ ] 13. **`src/pages/recruiter/RecruiterDashboardPage.jsx`** — redesign UI, preserve all data logic.
        **Preserve exactly**: all existing imports, `INTERVIEW_ICON` map, component state
        (`data`, `isLoading`), `useEffect` load block with `cancelled` guard,
        `if (isLoading)` / `if (!data)` guards, and `statCards` array definition.

        **Add to imports**:
        - `import clsx from 'clsx';`
        - `import { useAuth } from '../../context/AuthContext';`
        - Add `Sparkles` to the existing lucide-react import line.

        **Add inside component** (after the `statCards` array):
        ```js
        const { user } = useAuth();
        ```

        Replace only the `return (...)` JSX:
        ```
        <div className="space-y-8">

          {/* Page header */}
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <h1 className="text-2xl font-display font-bold text-ink-900">Dashboard</h1>
              {/* Tab row — visual only */}
              <div className="flex items-center gap-1 bg-cream-100 rounded-full p-1">
                {['Jobs', 'Talent Pool', 'Analytics', 'Settings'].map((tab, i) => (
                  <button key={tab}
                    className={clsx(
                      'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                      i === 0
                        ? 'bg-forest-500 text-white'
                        : 'text-ink-500 hover:text-ink-700'
                    )}>
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xl font-display font-medium text-rust-500 mt-2">
              Good morning, {user?.recruiterProfile?.fullName ?? 'Recruiter'}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-sm text-ink-500">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}
              </p>
              <span className="text-xs font-semibold uppercase tracking-wide
                text-forest-600 bg-forest-50 px-2 py-0.5 rounded-full">
                Recruiter
              </span>
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {statCards.map((stat, i) => (
              <motion.div key={stat.label}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="bg-white border border-cream-200 rounded-2xl p-5 shadow-soft">
                <p className="text-sm text-ink-500">{stat.label}</p>
                <p className="text-2xl font-display font-bold text-ink-900 mt-1">{stat.value}</p>
                <p className="text-xs text-ink-400 mt-0.5">{stat.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* AI Talent Pipeline Feed */}
          <div className="bg-white border border-cream-200 rounded-2xl p-6 shadow-soft">
            <h2 className="font-semibold text-ink-900 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-forest-500" />
              AI Talent Pipeline Feed
            </h2>
            <div className="flex items-start gap-2 flex-wrap">
              {[
                { label: 'Sourced (AI)', key: 'PENDING' },
                { label: 'Screened',     key: 'SHORTLISTED' },
                { label: 'Assessment',   key: 'INTERVIEWING' },
                { label: 'Interview',    key: 'INTERVIEWING' },
                { label: 'Offered',      key: 'OFFERED' },
              ].map((stage, i, arr) => (
                <div key={`${stage.label}-${i}`} className="flex items-center gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <span className={clsx(
                      'rounded-full px-3 py-1 text-sm font-medium border',
                      i === 0
                        ? 'bg-forest-500 text-white border-forest-500'
                        : 'bg-cream-100 border-cream-200 text-ink-700'
                    )}>
                      {stage.label}
                    </span>
                    <span className="text-xs text-ink-400">
                      {data.applicationsByStatus[stage.key] || 0}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <span className="text-ink-300 text-base mb-5">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Application funnel + Jobs by status */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="bg-white border border-cream-200 rounded-2xl p-6 shadow-soft
              lg:col-span-2">
              <h2 className="font-semibold text-ink-900 mb-4">Application Funnel</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(APPLICATION_STATUS_LABELS)
                  .filter(([key]) => key !== 'WITHDRAWN')
                  .map(([key, label]) => (
                    <div key={key}
                      className="bg-cream-50 border border-cream-200 rounded-xl p-3.5">
                      <p className="text-2xl font-display font-bold text-ink-900">
                        {data.applicationsByStatus[key] || 0}
                      </p>
                      <p className="text-xs text-ink-500 mt-0.5">{label}</p>
                    </div>
                  ))}
              </div>
            </div>

            <div className="bg-white border border-cream-200 rounded-2xl p-6 shadow-soft">
              <h2 className="font-semibold text-ink-900 mb-4">Jobs by Status</h2>
              <div className="space-y-2.5">
                {Object.entries(JOB_STATUS_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-ink-600">{label}</span>
                    <span className="font-semibold text-ink-900">
                      {data.jobsByStatus[key] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Upcoming interviews */}
          <div className="bg-white border border-cream-200 rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ink-900 flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-forest-500" />
                Upcoming Interviews
              </h2>
            </div>
            {data.upcomingInterviews.length === 0 ? (
              <EmptyState icon={CalendarClock} title="No interviews scheduled"
                description="Scheduled interviews will appear here." />
            ) : (
              <ul className="divide-y divide-cream-200">
                {data.upcomingInterviews.map((iv) => {
                  const Icon = INTERVIEW_ICON[iv.mode] || Video;
                  return (
                    <li key={iv.id}
                      className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl
                          bg-forest-50 text-forest-500 shrink-0">
                          <Icon className="w-4 h-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-ink-900 truncate">
                            {iv.application.applicant.fullName}
                          </p>
                          <p className="text-sm text-ink-500 truncate">
                            {iv.application.job.title}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-ink-500 shrink-0">
                        {formatDateTime(iv.scheduledAt)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Recent applications */}
          <div className="bg-white border border-cream-200 rounded-2xl p-6 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ink-900">Recent Applications</h2>
              <Link to="/recruiter/applications"
                className="text-sm font-medium text-forest-600 hover:text-forest-700
                  inline-flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {data.recentApplications.length === 0 ? (
              <EmptyState icon={Users} title="No applications yet"
                description="Applications to your job postings will show up here." />
            ) : (
              <ul className="divide-y divide-cream-200">
                {data.recentApplications.map((app) => (
                  <li key={app.id}
                    className="py-3.5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-ink-900 truncate">
                        {app.applicant.fullName}
                      </p>
                      <p className="text-sm text-ink-500 truncate">{app.job.title}</p>
                    </div>
                    <Badge>{APPLICATION_STATUS_LABELS[app.status]}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
        ```
        Files: `client/src/pages/recruiter/RecruiterDashboardPage.jsx`
        Verify: `npx vite build` — exits 0.

- [ ] 14. **Final build verification and Northa sweep**.
        Run: `cd d:\VS Code\job-portal-final\job-portal\client ; npx vite build 2>&1`
        If any errors appear, fix them (common causes: unused import not removed, missing `clsx`
        import, missing lucide icon in import list, `React.Fragment` with key used without React
        import — use `<div key={...}>` wrapper instead to avoid adding a React import).
        Then run the grep to confirm zero "Northa" occurrences:
        `Get-ChildItem -Path "d:\VS Code\job-portal-final\job-portal\client\src" -Recurse -Include "*.jsx","*.js" | Select-String -Pattern "Northa"`
        Must return no output.
        Files: whichever files build errors point to.
        Verify: Build exits code 0; grep returns zero matches.

---

## Edge Cases & Implementation Notes

1. **`brand-*` backward compatibility**: After the tailwind config change, `brand` is aliased to
   `forest` values. Any existing page that still uses `brand-*` classes (e.g., `Badge.jsx`,
   `constants.js` `APPLICATION_STATUS_COLORS`, `ROLE_COLORS`) will automatically render green
   instead of purple — no additional changes needed for those files.

2. **`Button` primary variant**: `bg-brand-600` in Button.jsx will now render `forest-600`
   (green) because brand is aliased. The explicit `className` overrides in steps 11/12 are for
   clarity, but `variant="primary"` alone would also work after the config change.

3. **`React.Fragment` with key in RecruiterDashboard pipeline**: The pipeline loop uses
   `key={...}` on the outer element. Wrap with `<div key={...} className="flex items-center gap-2">`
   rather than `<React.Fragment key={...}>` — this avoids needing to import React explicitly and
   also makes the layout more controllable.

4. **`watch` in RegisterPage**: Adding `watch` to the useForm destructure is purely additive.
   `react-hook-form` already subscribes to field changes for validation; `watch('password')` just
   reads the current value without re-registering anything. No risk to form submission behavior.

5. **`user?.recruiterProfile?.fullName` in RecruiterDashboard**: The `useAuth` context sets
   `user.recruiterProfile` only when role is RECRUITER, and may be `null` before the profile
   fetch completes. The `??` fallback to `'Recruiter'` is mandatory.

6. **`APPLICATION_STATUS_LABELS` pipeline**: "Assessment" and "Interview" stages both display
   `data.applicationsByStatus['INTERVIEWING']` — this is intentional UI decoration showing the
   same count in two pipeline stages. A brief code comment in the file makes this explicit.

7. **`index.html` encoding**: The file stores `—` as an em-dash that may display as `â€"` in
   some terminals; this is a terminal encoding artifact, not a file corruption. Edit the file
   using the fs_write tool to avoid encoding issues — write the full corrected file.

8. **`min-h-screen` vs `min-h-[calc(100vh-73px)]`**: The new Login/Register pages are full-screen
   cards that sit inside `PublicLayout` (which renders `<Navbar>` above them). Using `min-h-screen`
   means the card container is slightly taller than the viewport when the navbar is visible, causing
   a small scroll. This is acceptable for the design — the card is centered with `flex items-center`
   so it still looks correct. Alternatively use `min-h-[calc(100vh-73px)]` to match the old approach
   exactly. Either works; the plan uses `min-h-screen` for simplicity.
