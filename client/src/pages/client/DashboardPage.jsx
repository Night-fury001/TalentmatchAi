import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, ResponsiveContainer } from 'recharts';
import { dashboardService } from '../../services/dashboardService';
import { getErrorMessage } from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { SkeletonList } from '../../components/ui/Skeleton';

// ── Circular gauge component ──────────────────────────────────────────────────
function CircularGauge({ value = 84 }) {
  const r = 52;
  const cx = 64;
  const cy = 64;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <svg
      width="128"
      height="128"
      viewBox="0 0 128 128"
      aria-label={`${value}% overall fit`}
    >
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ede0cc" strokeWidth="12" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#2d6b30"
        strokeWidth="12"
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text
        x={cx}
        y={cy - 6}
        textAnchor="middle"
        fill="#2d6b30"
        fontSize="24"
        fontWeight="700"
        fontFamily="system-ui"
      >
        {value}%
      </text>
      <text
        x={cx}
        y={cy + 12}
        textAnchor="middle"
        fill="#5a4030"
        fontSize="11"
        fontFamily="system-ui"
      >
        Overall Fit
      </text>
    </svg>
  );
}

// ── Static chart data ─────────────────────────────────────────────────────────
const activityData = [
  { day: 'Mon', applied: 3, screened: 2, shortlisted: 1, interview: 0 },
  { day: 'Tue', applied: 5, screened: 3, shortlisted: 2, interview: 1 },
  { day: 'Wed', applied: 4, screened: 4, shortlisted: 2, interview: 1 },
  { day: 'Thu', applied: 7, screened: 5, shortlisted: 3, interview: 2 },
  { day: 'Fri', applied: 6, screened: 4, shortlisted: 3, interview: 2 },
  { day: 'Sat', applied: 2, screened: 2, shortlisted: 1, interview: 1 },
  { day: 'Sun', applied: 3, screened: 2, shortlisted: 2, interview: 1 },
];

// ── Mock candidates (used when API returns no recent applications) ─────────────
const mockCandidates = [
  {
    id: 'm1',
    name: 'Elena Rostova',
    role: 'Product Designer',
    match: 94,
    matchLabel: 'Excellent',
    skills: ['Figma', 'User Research', 'AI Integration'],
    bullets: [
      "Strong natural alignment with your team's focus on complex SaaS tools.",
      'Past work: 4 years at DesignCo',
    ],
    initials: 'ER',
    color: '#c04a18',
  },
  {
    id: 'm2',
    name: 'Marcus Chen',
    role: 'UI Designer',
    match: 89,
    matchLabel: 'Strong',
    skills: ['UI Prototyping', 'Workshop Facilitation'],
    bullets: [
      'Great experience leading cross-functional design sprints.',
      'Past work: 3 years at StartupInc',
    ],
    initials: 'MC',
    color: '#2d6b30',
  },
];

// ── Main component ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await dashboardService.getClientDashboard();
        if (!cancelled) setData(result);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Could not load your dashboard.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) return <SkeletonList count={3} />;
  if (!data) return null;

  const firstName =
    user?.jobSeekerProfile?.fullName?.split(' ')[0] || 'there';

  // Build candidate list from real data or mock
  const candidates =
    data.recentApplications?.length > 0
      ? data.recentApplications.slice(0, 2).map((app, i) => ({
          id: app.id,
          name: app.applicant?.fullName || mockCandidates[i]?.name,
          role: app.job?.title || mockCandidates[i]?.role,
          match: i === 0 ? 94 : 89,
          matchLabel: i === 0 ? 'Excellent' : 'Strong',
          skills:
            i === 0
              ? ['Figma', 'User Research', 'AI Integration']
              : ['UI Prototyping', 'Workshop Facilitation'],
          bullets: mockCandidates[i]?.bullets || [],
          initials: (app.applicant?.fullName || 'U')
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2),
          color: i === 0 ? '#c04a18' : '#2d6b30',
        }))
      : mockCandidates;

  return (
    <div className="space-y-5">
      {/* Full-width greeting */}
      <div>
        <h1 className="font-display text-3xl font-bold" style={{ color: '#8B4513' }}>
          Good morning, {firstName}
        </h1>
        <p className="text-sm text-ink-400 mt-0.5">
          Current date{' '}
          {new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* 3-column main content */}
      <div className="grid gap-5 lg:grid-cols-3">

        {/* ── COL 1: Insights & Analytics ── */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-ink-800">Insights &amp; Analytics</h2>

          {/* AI Matching Hub */}
          <div className="bg-white border border-cream-200 rounded-2xl p-5 shadow-soft">
            <p className="text-sm font-semibold text-ink-800 mb-3">Your AI Matching Hub</p>
            <div className="flex justify-center mb-3">
              <CircularGauge value={data.profileCompleteness || 84} />
            </div>
            <p className="text-xs text-center text-ink-500 mb-3">
              across {data.totalJobs || 12} open roles.
            </p>
            <p className="text-[11px] text-ink-500 italic leading-relaxed border-t border-cream-100 pt-3">
              <em>
                AI Tip: Candidates with &apos;collaborative design&apos; in their bios are matching
                well with the <strong>Product Designer</strong> role.
              </em>
            </p>
          </div>

          {/* Application Activity */}
          <div className="bg-white border border-cream-200 rounded-2xl p-5 shadow-soft">
            <p className="text-sm font-semibold text-ink-800 mb-1">Application Activity</p>
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              {[
                ['Applied', '#2d6b30'],
                ['AI Screened', '#e08840'],
                ['Shortlisted', '#c04a18'],
                ['In Interview', '#d4bc96'],
              ].map(([l, c]) => (
                <div key={l} className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: c }} />
                  <span className="text-[10px] text-ink-500">{l}</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={activityData}>
                <defs>
                  {[
                    ['g1', '#2d6b30'],
                    ['g2', '#e08840'],
                    ['g3', '#c04a18'],
                    ['g4', '#d4bc96'],
                  ].map(([id, c]) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={c} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={c} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <Area
                  type="monotone"
                  dataKey="applied"
                  stroke="#2d6b30"
                  strokeWidth={1.5}
                  fill="url(#g1)"
                />
                <Area
                  type="monotone"
                  dataKey="screened"
                  stroke="#e08840"
                  strokeWidth={1.5}
                  fill="url(#g2)"
                />
                <Area
                  type="monotone"
                  dataKey="shortlisted"
                  stroke="#c04a18"
                  strokeWidth={1.5}
                  fill="url(#g3)"
                />
                <Area
                  type="monotone"
                  dataKey="interview"
                  stroke="#d4bc96"
                  strokeWidth={1.5}
                  fill="url(#g4)"
                />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: '#9a8060' }}
                  axisLine={false}
                  tickLine={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── COL 2: Best Fit Matches ── */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-ink-800">Best Fit Matches</h2>
            <p className="text-xs text-ink-500">For &quot;Product Designer&quot;</p>
          </div>

          {candidates.map((candidate) => (
            <div
              key={candidate.id}
              className="bg-white border border-cream-200 rounded-2xl p-5 shadow-soft"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ background: candidate.color }}
                >
                  {candidate.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-900">{candidate.name}</p>
                  <span
                    className="inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold mt-0.5"
                    style={{ background: '#d4e8d4', color: '#2d6b30' }}
                  >
                    {candidate.match}% Match ({candidate.matchLabel})
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {candidate.skills.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-cream-200 bg-cream-50 px-2.5 py-0.5 text-[11px] text-ink-600"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <ul className="text-xs text-ink-600 space-y-1 mb-4">
                {candidate.bullets.map((b) => (
                  <li key={b} className="flex gap-1.5">
                    <span className="text-ink-400 shrink-0">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2">
                <button className="flex-1 rounded-lg border border-cream-300 py-2 text-xs font-medium text-ink-700 hover:bg-cream-50 transition-colors">
                  Review
                </button>
                <button className="flex-1 rounded-lg border border-cream-300 py-2 text-xs font-medium text-ink-700 hover:bg-cream-50 transition-colors">
                  Shortlist
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ── COL 3: Collaborative & Human-Centric Features ── */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-ink-800">
            Collaborative &amp; Human-Centric Features
          </h2>

          {/* Quick Highlights */}
          <div className="bg-white border border-cream-200 rounded-2xl p-5 shadow-soft">
            <p className="text-sm font-semibold text-ink-800 mb-3">Quick Highlights</p>
            <div className="space-y-3">
              {[
                {
                  initials: 'MC',
                  color: '#2d6b30',
                  text: 'New Match: Marcus Chen applied',
                  time: '2 hours ago',
                },
                {
                  initials: 'ER',
                  color: '#c04a18',
                  text: 'Elena Rostova was shortlisted by you',
                  time: '4 hours ago',
                },
                {
                  initials: 'AI',
                  color: '#e08840',
                  text: 'AI found 5 new potential matches for UX Researcher.',
                  time: '6 hours ago',
                },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-2.5">
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                    style={{ background: item.color }}
                  >
                    {item.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink-800 leading-snug">{item.text}</p>
                    <p className="text-[10px] text-ink-400 mt-0.5">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Needs Your Touch */}
          <div
            className="rounded-2xl p-5"
            style={{ background: '#fdf0e0', border: '1px solid #f0d8b0' }}
          >
            <p className="text-sm font-semibold text-ink-800 mb-3">Needs Your Touch</p>
            <div className="flex items-start gap-2.5 mb-3">
              <div
                className="h-9 w-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                style={{ background: '#7a9fa8' }}
              >
                JF
              </div>
              <p className="text-xs text-ink-700 leading-relaxed">
                Evaluate Jessica&apos;s portfolio – AI detects high soft-skills alignment but needs
                human review on wireframes.
              </p>
            </div>
            <button className="w-full rounded-lg border border-cream-300 bg-white py-2 text-xs font-medium text-ink-700 hover:bg-cream-50 transition-colors">
              Review Portfolio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
