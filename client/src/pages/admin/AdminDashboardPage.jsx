import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Users, Building2, Briefcase, ShieldAlert, ScrollText, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { adminDashboardService } from '../../services/adminDashboardService';
import { getErrorMessage } from '../../utils/axiosInstance';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/Skeleton';
import { ROLE_LABELS, JOB_STATUS_LABELS, APPLICATION_STATUS_LABELS, ACTIVITY_ACTION_LABELS, CHART_COLORS } from '../../utils/constants';
import { formatRelativeTime } from '../../utils/formatters';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await adminDashboardService.getAdminDashboard();
        if (!cancelled) setData(result);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Could not load the admin dashboard.'));
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

  const userRoleData = Object.entries(ROLE_LABELS).map(([key, label]) => ({
    name: label,
    value: data.users.byRole[key] || 0,
  }));

  const jobStatusData = Object.entries(JOB_STATUS_LABELS).map(([key, label]) => ({
    name: label,
    value: data.jobs.byStatus[key] || 0,
  }));

  const applicationStatusData = Object.entries(APPLICATION_STATUS_LABELS)
    .filter(([key]) => key !== 'WITHDRAWN')
    .map(([key, label]) => ({ name: label, value: data.applications.byStatus[key] || 0 }));

  const statCards = [
    { label: 'Active users', value: data.users.totalActive, sub: `+${data.users.newLast7Days} this week`, icon: Users },
    { label: 'Companies', value: data.companies.total, sub: `${data.companies.pending} pending review`, icon: Building2 },
    { label: 'Applications', value: data.applications.total, sub: 'platform-wide', icon: Briefcase },
    { label: 'Flagged jobs', value: data.jobs.flagged, sub: 'need review', icon: ShieldAlert },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink-900">Command center</h1>
        <p className="text-sm text-ink-500 mt-1">Platform health at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="surface p-5"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ink-100 text-ink-700">
                <stat.icon className="w-5 h-5" />
              </span>
              <div>
                <p className="text-2xl font-display font-bold text-ink-900">{stat.value}</p>
                <p className="text-xs text-ink-500">
                  {stat.label} · {stat.sub}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card index={0}>
          <h2 className="font-semibold text-ink-900 mb-4">Users by role</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={userRoleData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                {userRoleData.map((entry, i) => (
                  <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={30} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card index={1}>
          <h2 className="font-semibold text-ink-900 mb-4">Jobs by status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={jobStatusData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card index={2}>
          <h2 className="font-semibold text-ink-900 mb-4">Application funnel</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={applicationStatusData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
              <Tooltip />
              <Bar dataKey="value" fill={CHART_COLORS[1]} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card index={3}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink-900 flex items-center gap-2">
            <ScrollText className="w-4.5 h-4.5 text-brand-500" />
            Recent activity
          </h2>
          <Link to="/admin/activity-log" className="text-sm font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {data.recentActivity.length === 0 ? (
          <EmptyState icon={ScrollText} title="No activity yet" description="Platform actions will appear here as they happen." />
        ) : (
          <ul className="divide-y divide-ink-100">
            {data.recentActivity.map((log) => (
              <li key={log.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900">{ACTIVITY_ACTION_LABELS[log.action] || log.action}</p>
                  <p className="text-xs text-ink-500 truncate">{log.description}</p>
                </div>
                <span className="text-xs text-ink-400 shrink-0">{formatRelativeTime(log.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
