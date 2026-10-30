import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Users } from 'lucide-react';
import { pipelineService } from '../../services/pipelineService';
import { companyService } from '../../services/companyService';
import { recruiterJobService } from '../../services/recruiterJobService';
import { getErrorMessage } from '../../utils/axiosInstance';
import CandidateDrawer from '../../components/recruiter/CandidateDrawer';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Select from '../../components/ui/Select';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/Skeleton';
import { APPLICATION_STATUS_LABELS, matchScoreColor } from '../../utils/constants';
import { formatRelativeTime } from '../../utils/formatters';

const STATUS_OPTIONS = Object.entries(APPLICATION_STATUS_LABELS).map(([value, label]) => ({ value, label }));

export default function ApplicationsOverviewPage() {
  const [applications, setApplications] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [filters, setFilters] = useState({ companyId: '', jobId: '', status: '' });

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { limit: 50 };
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const data = await pipelineService.getAllApplications(params);
      setApplications(data.applications);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not load applications.'));
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  useEffect(() => {
    companyService.getMyCompanies().then((d) => setCompanies(d.companies)).catch(() => {});
    recruiterJobService.getMyJobs({ limit: 100 }).then((d) => setJobs(d.jobs)).catch(() => {});
  }, []);

  const updateFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));

  const handleStatusChangedFromDrawer = (applicationId, status) => {
    setApplications((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status } : a)));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink-900">All applications</h1>
        <p className="text-sm text-ink-500 mt-1">Every candidate across every job posting, in one place.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select
          placeholder="All companies"
          options={companies.map((c) => ({ value: c.id, label: c.name }))}
          value={filters.companyId}
          onChange={(e) => updateFilter('companyId', e.target.value)}
          containerClassName="w-52"
        />
        <Select
          placeholder="All jobs"
          options={jobs.map((j) => ({ value: j.id, label: j.title }))}
          value={filters.jobId}
          onChange={(e) => updateFilter('jobId', e.target.value)}
          containerClassName="w-52"
        />
        <Select
          placeholder="All statuses"
          options={STATUS_OPTIONS}
          value={filters.status}
          onChange={(e) => updateFilter('status', e.target.value)}
          containerClassName="w-48"
        />
      </div>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : applications.length === 0 ? (
        <EmptyState icon={Users} title="No applications found" description="Try adjusting your filters." />
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs font-medium text-ink-400 uppercase tracking-wide">
                <th className="px-5 py-3">Candidate</th>
                <th className="px-5 py-3">Job</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {applications.map((app) => (
                <tr key={app.id} onClick={() => setSelectedId(app.id)} className="cursor-pointer hover:bg-ink-50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={app.applicant.avatarUrl} name={app.applicant.fullName} size="sm" />
                      <p className="font-medium text-ink-900 truncate">{app.applicant.fullName}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Link
                      to={`/recruiter/jobs/${app.job.id}/pipeline`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-ink-700 hover:text-brand-600"
                    >
                      {app.job.title}
                    </Link>
                    <p className="text-xs text-ink-400">{app.job.company?.name}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge>{APPLICATION_STATUS_LABELS[app.status]}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-ink-500">{formatRelativeTime(app.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CandidateDrawer
        applicationId={selectedId}
        isOpen={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        onStatusChanged={handleStatusChangedFromDrawer}
      />
    </div>
  );
}
