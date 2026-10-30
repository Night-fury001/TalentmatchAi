import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { ClipboardList, Video, Phone, MapPin as MapPinIcon } from 'lucide-react';
import { applicationService } from '../../services/applicationService';
import { getErrorMessage } from '../../utils/axiosInstance';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Drawer from '../../components/ui/Drawer';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/Skeleton';
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_STATUS_COLORS,
  APPLICATION_STATUS_STEPS,
} from '../../utils/constants';
import { formatDate, formatDateTime, formatSalaryRange } from '../../utils/formatters';

const TABS = [{ value: '', label: 'All' }, ...Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => ({ value, label }))];

const INTERVIEW_MODE_ICON = { VIDEO: Video, PHONE: Phone, ONSITE: MapPinIcon };

function StatusTracker({ status }) {
  if (status === 'REJECTED' || status === 'WITHDRAWN') {
    return (
      <Badge className={APPLICATION_STATUS_COLORS[status]}>{APPLICATION_STATUS_LABELS[status]}</Badge>
    );
  }
  const currentIndex = APPLICATION_STATUS_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-1.5">
      {APPLICATION_STATUS_STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-1.5">
          <div
            className={clsx(
              'h-2.5 w-2.5 rounded-full',
              i <= currentIndex ? 'bg-brand-500' : 'bg-ink-200'
            )}
            title={APPLICATION_STATUS_LABELS[step]}
          />
          {i < APPLICATION_STATUS_STEPS.length - 1 && (
            <div className={clsx('h-0.5 w-4', i < currentIndex ? 'bg-brand-500' : 'bg-ink-200')} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const fetchApplications = async (status) => {
    setIsLoading(true);
    try {
      const params = { limit: 50 };
      if (status) params.status = status;
      const data = await applicationService.getMyApplications(params);
      setApplications(data.applications);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not load your applications.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const openDetail = async (app) => {
    setSelected(app);
    setDetail(null);
    setDetailLoading(true);
    try {
      const { application } = await applicationService.getApplicationById(app.id);
      setDetail(application);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!selected) return;
    setWithdrawing(true);
    try {
      await applicationService.withdrawApplication(selected.id);
      toast.success('Application withdrawn.');
      setDetail((prev) => (prev ? { ...prev, status: 'WITHDRAWN' } : prev));
      setApplications((prev) => prev.map((a) => (a.id === selected.id ? { ...a, status: 'WITHDRAWN' } : a)));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink-900">Your applications</h1>
        <p className="text-sm text-ink-500 mt-1">Track every application from submission to offer.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={clsx(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium border transition-colors',
              statusFilter === tab.value
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No applications here"
          description="Apply to roles from the job explorer to start tracking them."
          action={
            <Link to="/jobs">
              <Button>Browse jobs</Button>
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {applications.map((app) => (
            <li key={app.id}>
              <button
                onClick={() => openDetail(app)}
                className="w-full surface p-5 flex flex-col sm:flex-row sm:items-center gap-3 text-left hover:-translate-y-0.5 transition-transform"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink-900 truncate">{app.job.title}</p>
                  <p className="text-sm text-ink-500 truncate">{app.job.company?.name}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs text-ink-400 hidden sm:block">{formatDate(app.createdAt)}</span>
                  <StatusTracker status={app.status} />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Drawer isOpen={Boolean(selected)} onClose={() => setSelected(null)} title="Application details">
        {detailLoading || !detail ? (
          <div className="space-y-3">
            <div className="skeleton h-6 w-2/3" />
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-24 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <Link to={`/jobs/${detail.job.slug}`} className="text-lg font-semibold text-ink-900 hover:text-brand-600">
                {detail.job.title}
              </Link>
              <p className="text-sm text-ink-500">{detail.job.company?.name}</p>
              <p className="text-sm text-ink-500 mt-1">
                {formatSalaryRange(detail.job.salaryMin, detail.job.salaryMax, detail.job.currency)}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-ink-700 mb-2">Status</p>
              <StatusTracker status={detail.status} />
            </div>

            {detail.matchScore !== null && detail.matchScore !== undefined && (
              <div>
                <p className="text-sm font-medium text-ink-700 mb-1">AI match score</p>
                <p className="text-2xl font-display font-bold text-brand-600">{detail.matchScore}%</p>
              </div>
            )}

            {detail.coverLetter && (
              <div>
                <p className="text-sm font-medium text-ink-700 mb-1">Your cover letter</p>
                <p className="text-sm text-ink-600 whitespace-pre-line">{detail.coverLetter}</p>
              </div>
            )}

            {detail.recruiterNote && (
              <div>
                <p className="text-sm font-medium text-ink-700 mb-1">Note from the employer</p>
                <p className="text-sm text-ink-600 whitespace-pre-line">{detail.recruiterNote}</p>
              </div>
            )}

            {detail.interviews?.length > 0 && (
              <div>
                <p className="text-sm font-medium text-ink-700 mb-2">Interviews</p>
                <ul className="space-y-2">
                  {detail.interviews.map((iv) => {
                    const Icon = INTERVIEW_MODE_ICON[iv.mode] || Video;
                    return (
                      <li key={iv.id} className="rounded-2xl border border-ink-100 p-3.5">
                        <div className="flex items-center gap-2 text-sm font-medium text-ink-800">
                          <Icon className="w-4 h-4 text-brand-500" />
                          {formatDateTime(iv.scheduledAt)}
                        </div>
                        <p className="text-xs text-ink-500 mt-1">
                          {iv.durationMinutes} min · {iv.status}
                        </p>
                        {iv.meetingLink && (
                          <a
                            href={iv.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-brand-600 hover:text-brand-700 mt-1 inline-block"
                          >
                            Join link
                          </a>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {!['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(detail.status) && (
              <Button variant="danger" className="w-full" isLoading={withdrawing} onClick={handleWithdraw}>
                Withdraw application
              </Button>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
