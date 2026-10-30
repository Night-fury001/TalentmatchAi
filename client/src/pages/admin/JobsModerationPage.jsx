import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { ShieldAlert, Flag, CheckCircle2, XCircle, Search } from 'lucide-react';
import { adminJobService } from '../../services/adminJobService';
import { getErrorMessage } from '../../utils/axiosInstance';
import { flagJobSchema } from '../../utils/schemas';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import TextArea from '../../components/ui/TextArea';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/Skeleton';
import { JOB_STATUS_LABELS, JOB_STATUS_COLORS } from '../../utils/constants';
import { formatRelativeTime } from '../../utils/formatters';

const STATUS_OPTIONS = Object.entries(JOB_STATUS_LABELS).map(([value, label]) => ({ value, label }));

export default function JobsModerationPage() {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [flagTarget, setFlagTarget] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(flagJobSchema) });

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { limit: 50 };
      if (status) params.status = status;
      if (search) params.search = search;
      const data = await adminJobService.listJobs(params);
      setJobs(data.jobs);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not load jobs.'));
    } finally {
      setIsLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    const timeout = setTimeout(fetchJobs, 300);
    return () => clearTimeout(timeout);
  }, [fetchJobs]);

  const openFlag = (job) => {
    setFlagTarget(job);
    reset({ flagReason: '' });
  };

  const onFlagSubmit = async (data) => {
    setBusyId(flagTarget.id);
    try {
      await adminJobService.flagJob(flagTarget.id, data.flagReason);
      toast.success('Job flagged for review.');
      setJobs((prev) => prev.map((j) => (j.id === flagTarget.id ? { ...j, status: 'FLAG_REVIEW' } : j)));
      setFlagTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not flag this job.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleResolve = async (job, action) => {
    setBusyId(job.id);
    try {
      await adminJobService.resolveJobFlag(job.id, action);
      toast.success(action === 'APPROVE' ? 'Job restored.' : 'Job removed.');
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: action === 'APPROVE' ? 'OPEN' : 'CLOSED' } : j)));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not resolve this flag.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink-900">Job moderation</h1>
        <p className="text-sm text-ink-500 mt-1">Flag problematic postings and resolve existing reviews.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by job title…"
            className="w-full rounded-2xl border border-ink-200 bg-white py-2.5 pl-10 pr-4 text-sm focus-ring"
          />
        </div>
        <Select placeholder="All statuses" options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} containerClassName="w-44" />
      </div>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : jobs.length === 0 ? (
        <EmptyState icon={ShieldAlert} title="No jobs found" description="Try adjusting your search or filters." />
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs font-medium text-ink-400 uppercase tracking-wide">
                <th className="px-5 py-3">Job</th>
                <th className="px-5 py-3">Company</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Applicants</th>
                <th className="px-5 py-3">Posted</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="px-5 py-3.5 font-medium text-ink-900">{job.title}</td>
                  <td className="px-5 py-3.5 text-ink-500">{job.company?.name}</td>
                  <td className="px-5 py-3.5">
                    <Badge className={JOB_STATUS_COLORS[job.status]}>{JOB_STATUS_LABELS[job.status]}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-ink-500">{job._count?.applications || 0}</td>
                  <td className="px-5 py-3.5 text-ink-500">{formatRelativeTime(job.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      {job.status === 'FLAG_REVIEW' ? (
                        <>
                          <button
                            onClick={() => handleResolve(job, 'APPROVE')}
                            disabled={busyId === job.id}
                            className="rounded-full p-2 text-ink-400 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50"
                            aria-label="Restore job"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleResolve(job, 'REMOVE')}
                            disabled={busyId === job.id}
                            className="rounded-full p-2 text-ink-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                            aria-label="Remove job"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        job.status === 'OPEN' && (
                          <button
                            onClick={() => openFlag(job)}
                            className="rounded-full p-2 text-ink-400 hover:bg-amber-50 hover:text-amber-600"
                            aria-label="Flag job"
                          >
                            <Flag className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={Boolean(flagTarget)} onClose={() => setFlagTarget(null)} title={`Flag "${flagTarget?.title || ''}"`}>
        <form onSubmit={handleSubmit(onFlagSubmit)} className="space-y-4">
          <TextArea
            label="Reason for review"
            rows={3}
            placeholder="Why is this job being flagged?"
            error={errors.flagReason?.message}
            {...register('flagReason')}
          />
          <Button type="submit" variant="danger" className="w-full" isLoading={busyId === flagTarget?.id}>
            Flag for review
          </Button>
        </form>
      </Modal>
    </div>
  );
}
