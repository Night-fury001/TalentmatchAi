import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import TalentMatchLogo from '../components/TalentMatchLogo';

/* ─── SVG avatar faces (inline, no external images needed) ─────────────── */
/* We use a set of distinct coloured illustrated face circles that mimic
   the photo-realistic circular avatars in the design. Each is a tiny SVG
   embedded as a data URL and rendered as an <img>. */

const AVATAR_SVGS = [
  /* 0 – warm rust woman (top of network) */
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'>
    <circle cx='30' cy='30' r='30' fill='#c07b5a'/>
    <circle cx='30' cy='23' r='11' fill='#f5c9a8'/>
    <ellipse cx='30' cy='50' rx='16' ry='12' fill='#8B3A1A'/>
    <circle cx='30' cy='23' r='8' fill='#f5c9a8'/>
    <circle cx='27' cy='22' r='1.5' fill='#4a2510'/>
    <circle cx='33' cy='22' r='1.5' fill='#4a2510'/>
    <path d='M27 27 Q30 30 33 27' stroke='#c06040' strokeWidth='1.2' fill='none'/>
  </svg>`,
  /* 1 – forest green woman (right of network) */
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'>
    <circle cx='30' cy='30' r='30' fill='#b8c9a0'/>
    <circle cx='30' cy='23' r='11' fill='#f0dcc8'/>
    <ellipse cx='30' cy='50' rx='16' ry='12' fill='#4a7a50'/>
    <circle cx='30' cy='23' r='8' fill='#f0dcc8'/>
    <circle cx='27' cy='22' r='1.5' fill='#3a2010'/>
    <circle cx='33' cy='22' r='1.5' fill='#3a2010'/>
    <path d='M27 27 Q30 30 33 27' stroke='#b06040' strokeWidth='1.2' fill='none'/>
  </svg>`,
  /* 2 – peach woman (bottom-left) */
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'>
    <circle cx='30' cy='30' r='30' fill='#d4956a'/>
    <circle cx='30' cy='23' r='11' fill='#fad7be'/>
    <ellipse cx='30' cy='50' rx='16' ry='12' fill='#a05030'/>
    <circle cx='30' cy='23' r='8' fill='#fad7be'/>
    <circle cx='27' cy='22' r='1.5' fill='#402010'/>
    <circle cx='33' cy='22' r='1.5' fill='#402010'/>
    <path d='M27 27 Q30 30 33 27' stroke='#c07050' strokeWidth='1.2' fill='none'/>
  </svg>`,
  /* 3 – teal/muted woman (bottom-right) */
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'>
    <circle cx='30' cy='30' r='30' fill='#7a9fa8'/>
    <circle cx='30' cy='23' r='11' fill='#ead8c8'/>
    <ellipse cx='30' cy='50' rx='16' ry='12' fill='#305060'/>
    <circle cx='30' cy='23' r='8' fill='#ead8c8'/>
    <circle cx='27' cy='22' r='1.5' fill='#302010'/>
    <circle cx='33' cy='22' r='1.5' fill='#302010'/>
    <path d='M27 27 Q30 30 33 27' stroke='#a06050' strokeWidth='1.2' fill='none'/>
  </svg>`,
  /* 4 – rust man (center-network, Elena's card face) */
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60'>
    <circle cx='30' cy='30' r='30' fill='#c04a18'/>
    <circle cx='30' cy='23' r='11' fill='#f5c9a8'/>
    <ellipse cx='30' cy='50' rx='16' ry='12' fill='#8B2A08'/>
    <circle cx='30' cy='23' r='8' fill='#f5c9a8'/>
    <circle cx='27' cy='22' r='1.5' fill='#4a2510'/>
    <circle cx='33' cy='22' r='1.5' fill='#4a2510'/>
    <path d='M27 27 Q30 30 33 27' stroke='#c06040' strokeWidth='1.2' fill='none'/>
  </svg>`,
];

function svgUrl(index) {
  return `data:image/svg+xml;utf8,${encodeURIComponent(AVATAR_SVGS[index])}`;
}

/* ─── Dot grid (top-right decoration) ─────────────────────────────────── */
function DotGrid() {
  const cols = 7, rows = 6, gap = 22;
  return (
    <svg
      width={cols * gap}
      height={rows * gap}
      viewBox={`0 0 ${cols * gap} ${rows * gap}`}
      fill="none"
      aria-hidden="true"
    >
      {Array.from({ length: cols }, (_, c) =>
        Array.from({ length: rows }, (_, r) => (
          <circle
            key={`${c}-${r}`}
            cx={c * gap + gap / 2}
            cy={r * gap + gap / 2}
            r="2.2"
            fill="#7a6448"
            opacity="0.35"
          />
        ))
      )}
    </svg>
  );
}

/* ─── The right-side hero illustration ────────────────────────────────── */
function HeroIllustration() {
  /* Avatar positions around the peach blob (relative to a 520×400 canvas) */
  const networkAvatars = [
    { cx: 210, cy: 30,  r: 34, idx: 0 },  /* top-centre (warm rust) */
    { cx: 390, cy: 85,  r: 30, idx: 1 },  /* top-right (green) */
    { cx: 105, cy: 240, r: 28, idx: 2 },  /* bottom-left (peach) */
    { cx: 310, cy: 300, r: 30, idx: 3 },  /* bottom-centre */
    { cx: 430, cy: 240, r: 27, idx: 1 },  /* right-middle */
  ];

  return (
    <div className="relative w-full" style={{ height: '420px' }}>

      {/* ── Large warm peach blob ── */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 360, height: 360,
          top: '50%', left: '52%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, #deb887 0%, #d4a46a 30%, #c49050 60%, transparent 80%)',
          opacity: 0.55,
        }}
      />
      {/* inner lighter highlight */}
      <div
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 240, height: 240,
          top: '50%', left: '52%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, #f5dfc0 0%, transparent 70%)',
          opacity: 0.7,
        }}
      />

      {/* ── SVG for connection lines (behind cards) ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 480 420"
        fill="none"
        aria-hidden="true"
        style={{ zIndex: 1 }}
      >
        {/* lines connecting network avatars */}
        <path d="M210 30 Q300 58 390 85"   stroke="#8B6040" strokeWidth="1.2" strokeOpacity="0.3" strokeDasharray="5 4"/>
        <path d="M210 30 Q155 135 105 240" stroke="#8B6040" strokeWidth="1.2" strokeOpacity="0.25" strokeDasharray="5 4"/>
        <path d="M390 85 Q400 165 430 240" stroke="#8B6040" strokeWidth="1"   strokeOpacity="0.2"  strokeDasharray="5 4"/>
        <path d="M105 240 Q210 275 310 300" stroke="#8B6040" strokeWidth="1"  strokeOpacity="0.2"  strokeDasharray="5 4"/>
        <path d="M430 240 Q370 270 310 300" stroke="#8B6040" strokeWidth="1"  strokeOpacity="0.18" strokeDasharray="5 4"/>
        {/* line from Elena card (roughly 165,130) outward */}
        <path d="M165 135 Q190 80 210 30"  stroke="#8B6040" strokeWidth="1"   strokeOpacity="0.18" strokeDasharray="5 4"/>
      </svg>

      {/* ── Network avatar circles ── */}
      {networkAvatars.map(({ cx, cy, r, idx }) => (
        <div
          key={`${cx}-${cy}`}
          className="absolute rounded-full border-2 border-white overflow-hidden shadow-soft"
          style={{
            width: r * 2, height: r * 2,
            left: `${(cx - r) / 480 * 100}%`,
            top: cy - r,
            zIndex: 2,
          }}
        >
          <img src={svgUrl(idx)} alt="" className="w-full h-full object-cover" />
        </div>
      ))}

      {/* ── MAIN Match Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.4 }}
        className="absolute bg-white rounded-2xl border border-cream-200 overflow-hidden"
        style={{
          left: '2%', top: 98,
          width: 230,
          boxShadow: '0 4px 24px -4px rgba(0,0,0,0.12)',
          zIndex: 10,
        }}
      >
        <div className="p-4">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-400 mb-2.5">Match Card</p>
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="rounded-full overflow-hidden border border-cream-200 shrink-0" style={{ width: 40, height: 40 }}>
              <img src={svgUrl(4)} alt="Elena Rostova" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-900 leading-tight">Elena Rostova</p>
              <p className="text-[11px] text-ink-500">· Product Designer</p>
            </div>
          </div>
          {/* AI Match Score badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 mb-2.5" style={{ backgroundColor: '#d4e8d4', border: '1px solid #a9c9aa' }}>
            <span className="h-1.5 w-1.5 rounded-full bg-forest-500 shrink-0" />
            <span className="text-[11px] font-semibold" style={{ color: '#2d6b30' }}>AI Match Score: 94%</span>
          </div>
          {/* Skills */}
          <p className="text-[9px] font-medium text-ink-400 mb-1.5">Natural Skills:</p>
          <div className="flex flex-wrap gap-1">
            {['Natural Designer', 'Analytics'].map(t => (
              <span key={t} className="rounded-full px-2 py-0.5 text-[10px] text-ink-600 font-medium" style={{ background: '#f3ebe0', border: '1px solid #ddd0be' }}>{t}</span>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {['Coörating', 'Botesming'].map(t => (
              <span key={t} className="rounded-full px-2 py-0.5 text-[10px] text-ink-600 font-medium" style={{ background: '#f3ebe0', border: '1px solid #ddd0be' }}>{t}</span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── SECOND Match Card (partial, right edge) ── */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, delay: 0.55 }}
        className="absolute bg-white rounded-2xl border border-cream-200 overflow-hidden"
        style={{
          right: '-18px', top: 98,
          width: 185,
          boxShadow: '0 4px 24px -4px rgba(0,0,0,0.10)',
          zIndex: 9,
        }}
      >
        <div className="p-4">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-ink-400 mb-2.5">Match Card</p>
          <div className="flex items-center gap-2 mb-2.5">
            <div className="rounded-full overflow-hidden border border-cream-200 shrink-0" style={{ width: 36, height: 36 }}>
              <img src={svgUrl(1)} alt="" className="w-full h-full object-cover" />
            </div>
            <p className="text-sm font-semibold text-ink-900 leading-tight truncate">Elena Rostov…</p>
          </div>
          {/* mini face group */}
          <div className="flex -space-x-1.5 mb-2.5">
            {[0, 2, 3].map(i => (
              <div key={i} className="rounded-full overflow-hidden border border-white" style={{ width: 22, height: 22 }}>
                <img src={svgUrl(i)} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <p className="text-[9px] font-medium text-ink-400 mb-1">Natural Skills:</p>
          <div className="flex flex-wrap gap-1">
            <span className="rounded-full px-2 py-0.5 text-[10px] text-ink-600 font-medium" style={{ background: '#f3ebe0', border: '1px solid #ddd0be' }}>Coörpturating</span>
          </div>
        </div>
      </motion.div>

    </div>
  );
}

/* ─── Trust bar avatars ────────────────────────────────────────────────── */
function TrustAvatars() {
  return (
    <div className="flex -space-x-2">
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="rounded-full overflow-hidden border-2 border-cream-50" style={{ width: 34, height: 34 }}>
          <img src={svgUrl(i)} alt="" className="w-full h-full object-cover" />
        </div>
      ))}
    </div>
  );
}

/* ─── Landing Page ─────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    /* The page background is the same warm cream as the PublicLayout */
    <div className="relative overflow-x-hidden">

      {/* Hero section — fills viewport height minus navbar */}
      <section className="relative mx-auto max-w-7xl px-6 pt-14 pb-6 lg:pt-20 lg:pb-10">
        <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8 xl:gap-16 items-center min-h-[520px]">

          {/* ── LEFT column ── */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Main headline */}
            <h1
              className="font-display font-extrabold text-ink-900 leading-[1.08] tracking-tight"
              style={{ fontSize: 'clamp(2.4rem, 4.5vw, 3.6rem)' }}
            >
              Your journey to the<br />perfect fit starts here.
            </h1>

            {/* Sub-headline — rust/warm brown */}
            <p
              className="font-display font-bold leading-[1.2] mt-2"
              style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', color: '#8B4513' }}
            >
              Where human connections<br />meet intelligent insights.
            </p>

            {/* Body copy */}
            <p className="mt-5 text-[15px] text-ink-500 leading-relaxed max-w-[480px]">
              TalentMatch AI brings candidates and employers together naturally, using smart, empathetic matching to find your perfect fit—no endless scrolling required.
            </p>

            {/* CTA row */}
            <div className="mt-8 flex items-center gap-3 flex-wrap">
              <Link to="/register">
                <button
                  className="rounded-full px-7 py-3 text-[14px] font-semibold text-white transition-colors"
                  style={{ background: '#2d6b30' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#235326')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#2d6b30')}
                >
                  Find Your Match
                </button>
              </Link>
              <button
                className="flex items-center gap-2.5 rounded-full border px-5 py-3 text-[14px] font-medium text-ink-700 transition-colors hover:bg-cream-100"
                style={{ borderColor: '#c9b89a', background: 'rgba(255,255,255,0.6)' }}
              >
                <span
                  className="flex h-[26px] w-[26px] items-center justify-center rounded-full"
                  style={{ border: '1.5px solid #8a7055' }}
                >
                  <Play className="w-3 h-3 fill-ink-700 text-ink-700 ml-0.5" />
                </span>
                Watch How It Works
              </button>
            </div>

            {/* Trust bar */}
            <div className="mt-10 flex items-center gap-3">
              <TrustAvatars />
              <p className="text-[13px] text-ink-500">
                Trusted by human-centric teams at over <span className="font-semibold text-ink-700">500+</span> companies.
              </p>
            </div>
          </motion.div>

          {/* ── RIGHT column ── */}
          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            {/* Dot grid — top-right */}
            <div className="absolute -top-2 right-0 z-0 pointer-events-none">
              <DotGrid />
            </div>

            {/* Hero illustration */}
            <div className="relative z-10">
              <HeroIllustration />
            </div>
          </motion.div>

        </div>
      </section>

      {/* Trust line (mobile only — shown below hero) */}
      <div className="lg:hidden text-center pb-8 px-6">
        <p className="text-sm text-ink-400">Trusted by human-centric teams at over 500+ companies.</p>
      </div>

    </div>
  );
}
