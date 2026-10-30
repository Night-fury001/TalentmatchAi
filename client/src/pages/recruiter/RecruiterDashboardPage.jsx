import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ChevronDown, Mail, Square, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { recruiterDashboardService } from '../../services/recruiterDashboardService';
import { getErrorMessage } from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { SkeletonList } from '../../components/ui/Skeleton';
import Avatar from '../../components/ui/Avatar';

export default function RecruiterDashboardPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await recruiterDashboardService.getRecruiterDashboard();
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
    user?.recruiterProfile?.fullName?.split(' ')[0] || 'Recruiter';

  const pipelineStages = [
    {
      label: 'Sourced (AI)',
      count: data.applicationsByStatus?.PENDING || 145,
      style: { background: '#d4e8d4', color: '#2d6b30', border: '1px solid #a9c9aa' },
    },
    {
      label: 'Screened',
      count: data.applicationsByStatus?.SHORTLISTED || 32,
      style: { background: '#fdf0e0', color: '#c04a18', border: '1px solid #f0d0a8' },
    },
    {
      label: 'Assessment',
      count: data.applicationsByStatus?.INTERVIEWING || 18,
      style: { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
    },
    {
      label: 'Interview',
      count: data.applicationsByStatus?.OFFERED || 8,
      style: { background: '#ffedd5', color: '#c2410c', border: '1px solid #fed7aa' },
    },
    {
      label: 'Offered',
      count: data.applicationsByStatus?.ACCEPTED || 1,
      style: { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' },
    },
  ];

  const mockCandidates = [
    {
      name: 'Elena Rostova',
      role: 'Product Designer',
      pct: 94,
      matchLabel: 'Strong',
      bullets: [
        'Strong UI/UX leadership & experience with B2B SaaS',
        'Previous experience at Figma',
      ],
      initials: 'ER',
      color: '#c04a18',
    },
    {
      name: 'Marcus Chen',
      role: 'UI Designer',
      pct: 89,
      matchLabel: 'Good',
      bullets: [
        'Experience with cross-functional design sprints',
        'Past work: StartupInc & DesignCo',
      ],
      initials: 'MC',
      color: '#2d6b30',
    },
  ];

  const hasCandidates =
    data.recentApplications && data.recentApplications.length > 0;

  return (
    <div className="space-y-5">
      {/* Top stat bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active Jobs', value: data.jobsByStatus?.OPEN || 5 },
          { label: 'New High-Score Matches Today', value: data.totalApplications || 42 },
          { label: 'Interviews Scheduled This Week', value: data.upcomingInterviews?.length || 8 },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white border border-cream-200 rounded-xl p-4 shadow-soft text-center"
          >
            <p className="text-2xl font-display font-bold text-ink-900">{stat.value}</p>
            <p className="text-xs text-ink-500 mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Main 3-column grid */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-4 col-span-1">
          {/* Greeting */}
          <div>
            <h1 className="font-display text-2xl font-bold" style={{ color: '#8B4513' }}>
              Good morning, {firstName}
            </h1>
            <p className="text-xs text-ink-400 mt-0.5">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>

          {/* Selected Job Sourcing Focus */}
          <div className="bg-white border border-cream-200 rounded-xl p-4 shadow-soft">
            <p className="text-sm font-semibold text-ink-800 mb-2">Selected Job Sourcing Focus</p>
            <div className="flex items-center justify-between border border-cream-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-cream-50 transition-colors">
              <span className="text-sm text-ink-600 truncate">
                Focusing on: Senior Product Designer (San Francisco/Hybrid)
              </span>
              <ChevronDown className="w-4 h-4 text-ink-400 shrink-0 ml-2" />
            </div>
          </div>

          {/* AI Talent Pipeline Feed */}
          <div className="bg-white border border-cream-200 rounded-xl p-4 shadow-soft">
            <p className="text-sm font-semibold text-ink-800 mb-3">AI Talent Pipeline Feed</p>

            {/* Overall Sourcing Pipeline */}
            <p className="text-xs font-medium text-ink-500 mb-2">Overall Sourcing Pipeline</p>
            <div className="flex items-center gap-1 flex-wrap mb-4">
              {pipelineStages.map((stage, i, arr) => (
                <div key={stage.label} className="flex items-center gap-1">
                  <div className="flex flex-col items-center">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap"
                      style={stage.style}
                    >
                      {stage.label}
                    </span>
                    <span className="text-[11px] font-bold text-ink-700 mt-0.5">{stage.count}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-ink-300 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Highly Recommended Candidates */}
            <p className="text-xs font-semibold text-ink-700 mb-2">
              Highly Recommended Candidates{' '}
              <span className="font-normal text-ink-400">(AI Matching Match 90%+)</span>
            </p>
            <div className="space-y-3">
              {hasCandidates
                ? data.recentApplications.slice(0, 2).map((app, i) => {
                    const matchPct = i === 0 ? 94 : 89;
                    const matchLabel = i === 0 ? 'Strong' : 'Good';
                    const bullets =
                      i === 0
                        ? [
                            'Strong UI/UX leadership & experience with B2B SaaS',
                            'Previous experience at Figma',
                          ]
                        : [
                            'Experience with cross-functional design sprints',
                            'Past work: StartupInc & DesignCo',
                          ];
                    return (
                      <div
                        key={app.id}
                        className="border border-cream-200 rounded-xl p-3 bg-cream-50"
                      >
                        <div className="flex items-center gap-2.5 mb-2">
                          <Avatar
                            src={app.applicant?.avatarUrl}
                            name={app.applicant?.fullName}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-ink-900 truncate">
                              {app.applicant?.fullName || 'Candidate'}
                            </p>
                            <p className="text-xs text-ink-500">{app.job?.title || 'Product Designer'}</p>
                          </div>
                          <span
                            className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
                            style={{ background: '#d4e8d4', color: '#2d6b30' }}
                          >
                            {matchPct}% Match ({matchLabel})
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-ink-700 mb-1">
                          AI Reasoning highlights
                        </p>
                        <ul className="text-[11px] text-ink-600 space-y-0.5 mb-2">
                          {bullets.map((b) => (
                            <li key={b} className="flex gap-1">
                              <span>•</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex gap-2">
                          <button className="rounded-lg border border-cream-300 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-cream-100 transition-colors">
                            Review Profile
                          </button>
                          <button className="rounded-lg border border-cream-300 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-cream-100 transition-colors">
                            Shortlist
                          </button>
                          <button
                            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                            style={{ background: '#2d6b30' }}
                          >
                            Send Message
                          </button>
                        </div>
                      </div>
                    );
                  })
                : mockCandidates.map((c) => (
                    <div
                      key={c.name}
                      className="border border-cream-200 rounded-xl p-3 bg-cream-50"
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ background: c.color }}
                        >
                          {c.initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-ink-900">{c.name}</p>
                          <p className="text-xs text-ink-500">{c.role}</p>
                        </div>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
                          style={{ background: '#d4e8d4', color: '#2d6b30' }}
                        >
                          {c.pct}% Match ({c.matchLabel})
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-ink-700 mb-1">
                        AI Reasoning highlights
                      </p>
                      <ul className="text-[11px] text-ink-600 space-y-0.5 mb-2">
                        {c.bullets.map((b) => (
                          <li key={b} className="flex gap-1">
                            <span>•</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-2">
                        <button className="rounded-lg border border-cream-300 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-cream-100 transition-colors">
                          Review Profile
                        </button>
                        <button className="rounded-lg border border-cream-300 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-cream-100 transition-colors">
                          Shortlist
                        </button>
                        <button
                          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                          style={{ background: '#2d6b30' }}
                        >
                          Send Message
                        </button>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </div>

        {/* ── MIDDLE COLUMN ── */}
        <div className="space-y-4 col-span-1">
          {/* Smart Recruiter Outreach */}
          <div className="bg-white border border-cream-200 rounded-xl p-4 shadow-soft">
            <p className="text-sm font-semibold text-ink-800 mb-1">Smart Recruiter Outreach</p>
            <p className="text-xs text-ink-500 mb-3">
              Recent Activity &amp; Suggested Outreach
              <br />
              Recommending actions in action like:
            </p>

            {/* Suggestion row */}
            <div
              className="flex items-start gap-2.5 rounded-lg p-2.5 mb-3"
              style={{ background: '#fdf6ef' }}
            >
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                style={{ background: '#2d6b30' }}
              >
                MC
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-800">Suggest Outreach to Marcus Chen</p>
                <p className="text-[10px] text-ink-500">
                  (89% Match) · Best match for Design Systems
                </p>
              </div>
            </div>

            {/* Quick templates */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-ink-600">Quick templates</span>
              <span className="rounded-full border border-cream-300 px-2 py-0.5 text-[11px] text-ink-600 cursor-pointer hover:bg-cream-50">
                quick templates
              </span>
            </div>

            {/* Email section */}
            <div className="flex items-start gap-2 mb-3 border-t border-cream-100 pt-3">
              <Mail className="w-4 h-4 text-ink-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-ink-800">Send AI-crafted outreach email</p>
                <p className="text-[10px] text-ink-500">
                  e.g., inviting him to chat or schedule, scheduling via a single-button click.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button className="flex-1 rounded-lg border border-cream-300 py-2 text-xs font-medium text-ink-700 hover:bg-cream-50 transition-colors">
                Send Profile
              </button>
              <button
                className="flex-1 rounded-lg py-2 text-xs font-semibold text-white transition-colors"
                style={{ background: '#2d6b30' }}
              >
                Send InMail
              </button>
            </div>
          </div>

          {/* Collaborative Notes & Team Feedback */}
          <div className="bg-white border border-cream-200 rounded-xl p-4 shadow-soft">
            <p className="text-sm font-semibold text-ink-800 mb-3">
              Collaborative Notes &amp; Team Feedback
            </p>
            <div className="space-y-3">
              {[
                {
                  initials: 'DD',
                  color: '#7a9fa8',
                  text: '"Portfolio looks perfect for this role. Move to screen asap!"',
                },
                {
                  initials: 'DD',
                  color: '#7a9fa8',
                  text: '"Strong communication skills observed in initial screening."',
                },
              ].map((note, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                    style={{ background: note.color }}
                  >
                    {note.initials}
                  </div>
                  <div>
                    <p className="text-[11px] text-ink-600 font-medium">
                      Design Director left a note:
                    </p>
                    <p className="text-[11px] text-ink-700 italic mt-0.5">{note.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-4 col-span-1">
          {/* Analytics & Insights */}
          <div className="bg-white border border-cream-200 rounded-xl p-4 shadow-soft">
            <p className="text-sm font-semibold text-ink-800 mb-3">Analytics &amp; Insights</p>
            <div className="border border-cream-200 rounded-xl p-3 mb-3">
              <p className="text-xs font-semibold text-ink-700 mb-2">
                AI Sourcing &amp; Diversity Insights
              </p>
              <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="h-2 w-2 rounded-full bg-forest-500 inline-block" />
                    <span className="text-[10px] text-ink-500">Sourcing Activity</span>
                  </div>
                  <ResponsiveContainer width="100%" height={70}>
                    <AreaChart
                      data={[
                        { d: 'M', v: 20 },
                        { d: 'T', v: 35 },
                        { d: 'W', v: 55 },
                        { d: 'T', v: 40 },
                        { d: 'F', v: 60 },
                        { d: 'S', v: 30 },
                        { d: 'S', v: 45 },
                      ]}
                    >
                      <defs>
                        <linearGradient id="cGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2d6b30" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#2d6b30" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke="#2d6b30"
                        strokeWidth={1.5}
                        fill="url(#cGrad)"
                      />
                      <XAxis
                        dataKey="d"
                        tick={{ fontSize: 9, fill: '#9a8060' }}
                        axisLine={false}
                        tickLine={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <p className="text-[10px] font-medium text-ink-500 mb-1">Skill Tags</p>
                  {['Interactive Design', 'Prototyping', 'Product Strategy'].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap"
                      style={{
                        background: '#d4e8d4',
                        color: '#2d6b30',
                        border: '1px solid #a9c9aa',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Daily Action List */}
          <div
            className="rounded-xl p-4"
            style={{ background: '#fdf0e0', border: '1px solid #f0d8b0' }}
          >
            <p className="text-sm font-semibold text-ink-800">Daily Action List</p>
            <p className="text-xs text-ink-500 mb-3">
              Highlights critical tasks for {firstName}
            </p>
            <div className="space-y-2.5">
              {[
                'Review 12 new applicants for Frontend Engineer',
                'Finalize feedback for 3 interviewees',
                'Finalize feedback for 3 interviewees for bogiruppers',
              ].map((task) => (
                <div key={task} className="flex items-start gap-2">
                  <Square className="w-4 h-4 text-ink-400 shrink-0 mt-0.5" />
                  <span className="text-[12px] text-ink-700 leading-snug">{task}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
