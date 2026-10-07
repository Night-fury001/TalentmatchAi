import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Zap, Heart, ShieldCheck } from 'lucide-react';

const FEATURES = [
  { icon: Users, title: 'Human & AI Synergy', description: 'AI surfaces the best matches, but every hiring decision stays beautifully human.' },
  { icon: Zap, title: 'Match Insights & Collaboration', description: 'See why a candidate was matched and collaborate with your team before reaching out.' },
  { icon: Heart, title: 'Natural & Warm Experience', description: 'No cold corporate filters — every interaction feels like a genuine conversation.' },
  { icon: ShieldCheck, title: 'Verified Human Teams', description: 'Every employer is reviewed by our team before their postings go live.' },
];

export default function LandingPage() {
  return (
    <div className="bg-cream-50 min-h-screen">
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left */}
          <motion.div initial={{opacity: 0, y: 24}} animate={{opacity: 1, y: 0}} transition={{duration: 0.6}}>
            <span className="inline-flex items-center gap-2 rounded-full border border-forest-200 bg-forest-50 px-4 py-1.5 text-xs font-semibold text-forest-600 mb-6">
              AI-Powered Matching
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-ink-900 leading-tight">
              Your journey to the perfect fit starts here.
            </h1>
            <p className="mt-3 text-xl font-medium text-rust-500">
              Where human connections meet intelligent insights.
            </p>
            <p className="mt-4 text-base text-ink-500 max-w-lg">
              TalentMatch AI brings together the warmth of human connection with the precision of intelligent matching. Find roles that resonate — or candidates that truly fit.
            </p>
            <div className="mt-8 flex items-center gap-3 flex-wrap">
              <Link to="/register">
                <button className="rounded-full bg-forest-500 px-6 py-3 text-sm font-semibold text-white hover:bg-forest-600 transition-colors shadow-soft">
                  Find Your Match
                </button>
              </Link>
              <Link to="/jobs">
                <button className="rounded-full border border-cream-300 bg-white px-6 py-3 text-sm font-medium text-ink-700 hover:bg-cream-100 transition-colors">
                  Watch How It Works
                </button>
              </Link>
            </div>
            {/* Trust bar */}
            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2">
                {['#2d6b30','#c04a18','#e08840','#4d8b50'].map((color, i) => (
                  <div key={i} style={{backgroundColor: color}} className="h-8 w-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold">{['A','B','C','D'][i]}</div>
                ))}
              </div>
              <p className="text-sm text-ink-500">Trusted by <span className="font-semibold text-ink-700">500+</span> human-centric teams</p>
            </div>
          </motion.div>

          {/* Right — decorative card */}
          <motion.div initial={{opacity: 0, x: 24}} animate={{opacity: 1, x: 0}} transition={{duration: 0.6, delay: 0.1}} className="flex justify-center">
            <div className="relative">
              {/* Decorative dots */}
              <div className="absolute -inset-6 rounded-3xl" style={{background: 'radial-gradient(circle, rgba(45,107,48,0.06) 0%, transparent 70%)'}} />
              {/* Match card */}
              <div className="relative bg-white border border-cream-200 rounded-3xl p-6 shadow-soft w-80">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-forest-100 flex items-center justify-center text-forest-700 font-bold text-lg">AC</div>
                  <div>
                    <p className="font-semibold text-ink-900">Alex Chen</p>
                    <p className="text-sm text-ink-500">Senior Product Designer</p>
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-forest-200 bg-forest-50 px-3 py-1 mb-4">
                  <span className="h-2 w-2 rounded-full bg-forest-500"></span>
                  <span className="text-xs font-semibold text-forest-600">AI Match Score: 94%</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['Product Strategy', 'UX Research', 'Figma', 'Systems Thinking'].map(tag => (
                    <span key={tag} className="rounded-full bg-cream-100 border border-cream-200 px-3 py-1 text-xs text-ink-600">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{opacity: 0, y: 16}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, margin: '-40px'}}
              transition={{duration: 0.4, delay: i * 0.08}}
              className="bg-white border border-cream-200 rounded-2xl p-6 shadow-soft"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-forest-50 text-forest-500 mb-4">
                <feature.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-ink-900">{feature.title}</h3>
              <p className="mt-1.5 text-sm text-ink-500">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
