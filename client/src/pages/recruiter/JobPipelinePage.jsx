import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ArrowLeft, LayoutGrid, List, Users, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { pipelineService } from '../../services/pipelineService';
import { recruiterJobService } from '../../services/recruiterJobService';
import { getErrorMessage } from '../../utils/axiosInstance';
import CandidateDrawer from '../../components/recruiter/CandidateDrawer';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/Skeleton';
import { PIPELINE_COLUMNS, APPLICATION_STATUS_LABELS, matchScoreColor } from '../../utils/constants';
import { formatRelativeTime } from '../../utils/formatters';

function CandidateCard({ application, onOpen, isDragging }) {
  return (
    <motion.button
      layout
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', application.id)}
      onClick={() => onOpen(application.id)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'w-full rounded-2xl border border-ink-100 bg-white p-3.5 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-40'
      )}
    >
      <div className="flex items-center gap-2.5">
        <Avatar src={application.applicant.avatarUrl} name={application.applicant.fullName} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink-900 truncate">{application.applicant.fullName}</p>
          <p className="text-xs text-ink-400 truncate">{application.applicant.headline || 'No headline'}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2.5">
        <span className="text-xs text-ink-400">{formatRelativeTime(application.createdAt)}</span>
        {typeof application.matchScore === 'number' && (
          <span className={`text-xs font-semibold ${matchScoreColor(application.matchScore)}`}>
            {application.matchScore}%
          </span>
        )}
      </div>
    </motion.button>
  );
}

export default function JobPipelinePage() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('kanban');
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [jobData, appsData] = await Promise.all([
        recruiterJobService.getJobById(jobId),
        pipelineService.getJobApplications(jobId, { limit: 100, sortBy: 'match_score' }),
      ]);
      setJob(jobData.job);
      setApplications(appsData.applications);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not load the pipeline.'));
    } finally {
      setIsLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const applicationId = e.dataTransfer.getData('text/plain');
    const application = applications.find((a) => a.id === applicationId);
    if (!application || application.status === targetStatus) return;

    if (targetStatus === 'PENDING') {
      toast.error('Candidates cannot be moved back to "New".');
      return;
    }
    if (['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(application.status)) {
      toast.error('This application has reached a final status and cannot be moved.');
      return;
    }

    const previous = application.status;
    setApplications((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status: targetStatus } : a)));
    try {
      await pipelineService.updateApplicationStatus(applicationId, { status: targetStatus });
      toast.success(`Moved to ${APPLICATION_STATUS_LABELS[targetStatus]}.`);
    } catch (err) {
      setApplications((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status: previous } : a)));
      toast.error(getErrorMessage(err, 'Could not move this candidate.'));
    }
  };

  const handleStatusChangedFromDrawer = (applicationId, status) => {
    setApplications((prev) => prev.map((a) => (a.id === applicationId ? { ...a, status } : a)));
  };

  const columnApplications = (status) => applications.filter((a) => a.status === status);

  if (isLoading) return <SkeletonList count={3} />;

  return (
    <div className="space-y-6">
      <Link to="/recruiter/jobs" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800">
        <ArrowLeft className="w-4 h-4" /> Back to job postings
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink-900">{job?.title}</h1>
          <p className="text-sm text-ink-500 mt-1 inline-flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> {applications.length} candidates ·
            <Sparkles className="w-3.5 h-3.5 text-brand-500" /> ranked by AI match
          </p>
        </div>
        <div className="inline-flex rounded-2xl border border-ink-200 bg-white p-1">
          <button
            onClick={() => setView('kanban')}
            className={clsx(
              'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors',
              view === 'kanban' ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100'
            )}
          >
            <LayoutGrid className="w-4 h-4" /> Kanban
          </button>
          <button
            onClick={() => setView('table')}
            className={clsx(
              'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors',
              view === 'table' ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100'
            )}
          >
            <List className="w-4 h-4" /> Table
          </button>
        </div>
      </div>

      {applications.length === 0 ? (
        <EmptyState icon={Users} title="No applications yet" description="Candidates who apply to this role will appear here, ranked by AI match score." />
      ) : view === 'kanban' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {PIPELINE_COLUMNS.map((col) => (
            <div
              key={col.status}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverColumn(col.status);
              }}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => handleDrop(e, col.status)}
              className={clsx(
                'flex flex-col rounded-3xl border-t-4 bg-ink-50/70 p-3 min-h-[16rem] transition-colors',
                col.accent,
                dragOverColumn === col.status && 'bg-brand-50 ring-2 ring-brand-200'
              )}
            >
              <div className="flex items-center justify-between px-1 mb-3">
                <p className="text-sm font-semibold text-ink-800">{col.label}</p>
                <span className="text-xs font-medium text-ink-400">{columnApplications(col.status).length}</span>
              </div>
              <div className="space-y-2.5 flex-1">
                {columnApplications(col.status).map((app) => (
                  <CandidateCard key={app.id} application={app} onOpen={setSelectedId} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs font-medium text-ink-400 uppercase tracking-wide">
                <th className="px-5 py-3">Candidate</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Match</th>
                <th className="px-5 py-3">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {applications.map((app) => (
                <tr key={app.id} onClick={() => setSelectedId(app.id)} className="cursor-pointer hover:bg-ink-50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={app.applicant.avatarUrl} name={app.applicant.fullName} size="sm" />
                      <div className="min-w-0">
                        <p className="font-medium text-ink-900 truncate">{app.applicant.fullName}</p>
                        <p className="text-xs text-ink-400 truncate">{app.applicant.headline}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge>{APPLICATION_STATUS_LABELS[app.status]}</Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    {typeof app.matchScore === 'number' ? (
                      <span className={`font-semibold ${matchScoreColor(app.matchScore)}`}>{app.matchScore}%</span>
                    ) : (
                      <span className="text-ink-400">—</span>
                    )}
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
