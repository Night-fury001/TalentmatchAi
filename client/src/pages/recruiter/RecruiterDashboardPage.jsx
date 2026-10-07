import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Building2, Briefcase, Users, CalendarClock, ArrowRight, Video, Phone, MapPin } from 'lucide-react';
import { recruiterDashboardService } from '../../services/recruiterDashboardService';
import { getErrorMessage } from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/Skeleton';
import { APPLICATION_STATUS_LABELS, JOB_STATUS_LABELS } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';

const INTERVIEW_ICON = { VIDEO: Video, PHONE: Phone, ONSITE: MapPin };

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

  const statCards = [
    { label: 'Companies', value: data.totalCompanies, sub: `${data.verifiedCompanies} verified`, icon: Building2 },
    {
      label: 'Open roles',
      value: data.jobsByStatus.OPEN || 0,
      sub: `${data.jobsByStatus.DRAFT || 0} drafts`,
      icon: Briefcase,
    },
    { label: 'Applications', value: data.totalApplications, sub: 'across all jobs', icon: Users },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-forest-50 text-forest-600 border border-forest-200 text-xs font-medium px-2.5 py-0.5 rounded-full">
            Recruiter
          </span>
        </div>
        <p className="font-display text-xl font-semibold text-rust-500">
          Good morning, {user?.recruiterProfile?.fullName || 'Recruiter'}
        </p>
        <p className="text-sm text-ink-400 mt-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="text-2xl font-display font-bold text-ink-900 mt-2">Dashboard</h1>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06 }}
            className="bg-white border border-cream-200 rounded-2xl p-5 shadow-soft"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-forest-50 text-forest-600">
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

      {/* AI Pipeline Feed */}
      <div className="bg-white border border-cream-200 rounded-2xl p-5 shadow-soft">
        <h2 className="font-semibold text-ink-900 mb-4">AI Pipeline</h2>
        <div className="flex flex-wrap items-center gap-2">
          {Object.entries(APPLICATION_STATUS_LABELS)
            .filter(([key]) => key !== 'WITHDRAWN')
            .map(([key, label], idx, arr) => (
              <div key={key} className="flex items-center gap-2">
                <div className="flex flex-col items-center rounded-full border border-forest-200 bg-forest-50 px-4 py-2">
                  <span className="text-lg font-display font-bold text-forest-700">{data.applicationsByStatus[key] || 0}</span>
                  <span className="text-xs text-forest-600 whitespace-nowrap">{label}</span>
                </div>
                {idx < arr.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-cream-300 shrink-0" />
                )}
              </div>
            ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" index={0}>
          <h2 className="font-semibold text-ink-900 mb-4">Application funnel</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(APPLICATION_STATUS_LABELS)
              .filter(([key]) => key !== 'WITHDRAWN')
              .map(([key, label]) => (
                <div key={key} className="rounded-2xl border border-cream-200 bg-cream-50 p-3.5">
                  <p className="text-2xl font-display font-bold text-ink-900">{data.applicationsByStatus[key] || 0}</p>
                  <p className="text-xs text-ink-500 mt-0.5">{label}</p>
                </div>
              ))}
          </div>
        </Card>

        <Card index={1}>
          <h2 className="font-semibold text-ink-900 mb-4">Jobs by status</h2>
          <div className="space-y-2.5">
            {Object.entries(JOB_STATUS_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-ink-600">{label}</span>
                <span className="font-semibold text-ink-900">{data.jobsByStatus[key] || 0}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card index={2}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink-900 flex items-center gap-2">
            <CalendarClock className="w-4.5 h-4.5 text-forest-500" />
            Upcoming interviews
          </h2>
        </div>
        {data.upcomingInterviews.length === 0 ? (
          <EmptyState icon={CalendarClock} title="No interviews scheduled" description="Scheduled interviews will appear here." />
        ) : (
          <ul className="divide-y divide-cream-200">
            {data.upcomingInterviews.map((iv) => {
              const Icon = INTERVIEW_ICON[iv.mode] || Video;
              return (
                <li key={iv.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-50 text-forest-600 shrink-0">
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-ink-900 truncate">{iv.application.applicant.fullName}</p>
                      <p className="text-sm text-ink-500 truncate">{iv.application.job.title}</p>
                    </div>
                  </div>
                  <span className="text-xs text-ink-500 shrink-0">{formatDateTime(iv.scheduledAt)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card index={3}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink-900">Recent applications</h2>
          <Link to="/recruiter/applications" className="text-sm font-medium text-forest-600 hover:text-forest-700 inline-flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {data.recentApplications.length === 0 ? (
          <EmptyState icon={Users} title="No applications yet" description="Applications to your job postings will show up here." />
        ) : (
          <ul className="divide-y divide-cream-200">
            {data.recentApplications.map((app) => (
              <li key={app.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-ink-900 truncate">{app.applicant.fullName}</p>
                  <p className="text-sm text-ink-500 truncate">{app.job.title}</p>
                </div>
                <Badge>{APPLICATION_STATUS_LABELS[app.status]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
