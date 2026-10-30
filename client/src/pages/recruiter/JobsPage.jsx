import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Briefcase, Plus, Users, Pencil, Trash2 } from 'lucide-react';
import { recruiterJobService } from '../../services/recruiterJobService';
import { companyService } from '../../services/companyService';
import { getErrorMessage } from '../../utils/axiosInstance';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/Skeleton';
import { JOB_STATUS_LABELS, JOB_STATUS_COLORS } from '../../utils/constants';
import { formatSalaryRange, formatRelativeTime } from '../../utils/formatters';

const STATUS_OPTIONS = Object.entries(JOB_STATUS_LABELS).map(([value, label]) => ({ value, label }));

export default function JobsPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { limit: 50 };
      if (statusFilter) params.status = statusFilter;
      if (companyFilter) params.companyId = companyFilter;
      const data = await recruiterJobService.getMyJobs(params);
      setJobs(data.jobs);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not load job postings.'));
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, companyFilter]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    companyService
      .getMyCompanies()
      .then((data) => setCompanies(data.companies))
      .catch(() => {});
  }, []);

  const handleStatusChange = async (job, status) => {
    setUpdatingId(job.id);
    try {
      await recruiterJobService.updateJobStatus(job.id, status);
      toast.success(`Job status updated to ${JOB_STATUS_LABELS[status]}.`);
      setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status } : j)));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update job status.'));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (job) => {
    if (!window.confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    try {
      await recruiterJobService.deleteJob(job.id);
      toast.success('Job deleted.');
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete this job.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink-900">Job postings</h1>
          <p className="text-sm text-ink-500 mt-1">Manage your open roles and review candidates.</p>
        </div>
        <Link to="/recruiter/jobs/new">
          <Button icon={Plus}>Post a job</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          placeholder="All statuses"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          containerClassName="w-48"
        />
        <Select
          placeholder="All companies"
          options={companies.map((c) => ({ value: c.id, label: c.name }))}
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          containerClassName="w-56"
        />
      </div>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No job postings yet"
          description="Post your first role to start receiving AI-ranked applications."
          action={
            <Link to="/recruiter/jobs/new">
              <Button icon={Plus}>Post a job</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {jobs.map((job, i) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.3) }}
              className="surface p-5 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/recruiter/jobs/${job.id}/pipeline`)}
                    className="font-semibold text-ink-900 hover:text-brand-600 truncate text-left"
                  >
                    {job.title}
                  </button>
                  <Badge className={JOB_STATUS_COLORS[job.status]}>{JOB_STATUS_LABELS[job.status]}</Badge>
                </div>
                <p className="text-sm text-ink-500 mt-0.5 truncate">{job.company?.name}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-ink-400">
                  <span>{formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}</span>
                  <span>Posted {formatRelativeTime(job.createdAt)}</span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {job._count?.applications || 0} applicants
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {job.status === 'FLAG_REVIEW' ? (
                  <span className="text-xs text-rose-600 font-medium">Under admin review</span>
                ) : (
                  <Select
                    options={[
                      { value: 'DRAFT', label: 'Draft' },
                      { value: 'OPEN', label: 'Open' },
                      { value: 'CLOSED', label: 'Closed' },
                    ]}
                    value={job.status}
                    disabled={updatingId === job.id}
                    onChange={(e) => handleStatusChange(job, e.target.value)}
                    containerClassName="w-32"
                  />
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/recruiter/jobs/${job.id}/pipeline`)}
                  icon={Users}
                >
                  Pipeline
                </Button>
                <button
                  onClick={() => navigate(`/recruiter/jobs/${job.id}/edit`)}
                  className="rounded-full p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
                  aria-label="Edit job"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(job)}
                  className="rounded-full p-2 text-ink-400 hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Delete job"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
