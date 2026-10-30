import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import {
  FileText,
  MapPin,
  Sparkles,
  RefreshCw,
  CalendarPlus,
  Video,
  Phone,
  GraduationCap,
  Briefcase,
} from 'lucide-react';
import { pipelineService } from '../../services/pipelineService';
import { getErrorMessage } from '../../utils/axiosInstance';
import { scheduleInterviewSchema, applicationStatusSchema } from '../../utils/schemas';
import Drawer from '../ui/Drawer';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Input from '../ui/Input';
import TextArea from '../ui/TextArea';
import ProgressBar from '../ui/ProgressBar';
import Avatar from '../ui/Avatar';
import {
  APPLICATION_STATUS_LABELS,
  SKILL_LEVEL_LABELS,
  INTERVIEW_MODE_LABELS,
  matchScoreColor,
  matchScoreBg,
} from '../../utils/constants';
import { formatDate, formatDateTime, formatLocation } from '../../utils/formatters';

const INTERVIEW_ICON = { VIDEO: Video, PHONE: Phone, ONSITE: MapPin };

const NEXT_STATUS_OPTIONS = {
  PENDING: ['SHORTLISTED', 'REJECTED'],
  SHORTLISTED: ['INTERVIEWING', 'REJECTED'],
  INTERVIEWING: ['OFFERED', 'REJECTED'],
  OFFERED: ['ACCEPTED', 'REJECTED'],
};

export default function CandidateDrawer({ applicationId, isOpen, onClose, onStatusChanged }) {
  const [detail, setDetail] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [schedulingLoading, setSchedulingLoading] = useState(false);

  const {
    register: registerInterview,
    handleSubmit: handleSubmitInterview,
    reset: resetInterview,
    formState: { errors: interviewErrors },
  } = useForm({ resolver: zodResolver(scheduleInterviewSchema), defaultValues: { mode: 'VIDEO', durationMinutes: 30 } });

  const {
    register: registerStatus,
    handleSubmit: handleSubmitStatus,
    reset: resetStatus,
    watch: watchStatus,
    formState: { errors: statusErrors },
  } = useForm({ resolver: zodResolver(applicationStatusSchema) });

  const load = async () => {
    setIsLoading(true);
    setAnalysisLoading(true);
    try {
      const { application } = await pipelineService.getApplicationDetail(applicationId);
      setDetail(application);
      resetStatus({ status: NEXT_STATUS_OPTIONS[application.status]?.[0] || 'SHORTLISTED', recruiterNote: application.recruiterNote || '' });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not load this candidate.'));
    } finally {
      setIsLoading(false);
    }

    try {
      const { analysis: result } = await pipelineService.getApplicationAnalysis(applicationId);
      setAnalysis(result);
    } catch (err) {
      // AI analysis may not be available yet — not fatal.
    } finally {
      setAnalysisLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && applicationId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, applicationId]);

  const handleRefreshAnalysis = async () => {
    setRefreshing(true);
    try {
      const { analysis: result } = await pipelineService.refreshApplicationAnalysis(applicationId);
      setAnalysis(result);
      toast.success('Analysis refreshed.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not refresh analysis.'));
    } finally {
      setRefreshing(false);
    }
  };

  const onStatusSubmit = async (data) => {
    setStatusSaving(true);
    try {
      await pipelineService.updateApplicationStatus(applicationId, data);
      toast.success(`Moved to ${APPLICATION_STATUS_LABELS[data.status]}.`);
      setDetail((prev) => ({ ...prev, status: data.status, recruiterNote: data.recruiterNote }));
      onStatusChanged?.(applicationId, data.status);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update status.'));
    } finally {
      setStatusSaving(false);
    }
  };

  const onScheduleSubmit = async (data) => {
    setSchedulingLoading(true);
    try {
      const payload = { ...data, scheduledAt: new Date(data.scheduledAt).toISOString() };
      await pipelineService.scheduleInterview(applicationId, payload);
      toast.success('Interview scheduled.');
      setShowScheduler(false);
      resetInterview({ mode: 'VIDEO', durationMinutes: 30 });
      load();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not schedule interview.'));
    } finally {
      setSchedulingLoading(false);
    }
  };

  const availableNextStatuses = detail ? NEXT_STATUS_OPTIONS[detail.status] || [] : [];
  const selectedNextStatus = watchStatus('status');

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Candidate profile" widthClassName="max-w-xl">
      {isLoading || !detail ? (
        <div className="space-y-4">
          <div className="skeleton h-16 w-full" />
          <div className="skeleton h-32 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar src={detail.applicant.avatarUrl} name={detail.applicant.fullName} size="lg" />
            <div className="min-w-0">
              <h3 className="font-semibold text-ink-900 truncate">{detail.applicant.fullName}</h3>
              <p className="text-sm text-ink-500 truncate">{detail.applicant.headline || 'No headline set'}</p>
              <p className="text-xs text-ink-400 inline-flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3" /> {formatLocation(detail.applicant.location)}
              </p>
            </div>
          </div>

          {detail.resumeUrl && (
            <a
              href={detail.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-ink-200 px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-ink-50"
            >
              <FileText className="w-4 h-4" /> View resume
            </a>
          )}

          {/* AI Match Analysis */}
          <div className="rounded-3xl border border-ink-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-brand-500" />
                <h4 className="font-semibold text-ink-900">AI match analysis</h4>
              </div>
              <button
                onClick={handleRefreshAnalysis}
                disabled={refreshing}
                className="rounded-full p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600 disabled:opacity-50"
                aria-label="Refresh analysis"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {analysisLoading ? (
              <div className="skeleton h-14 w-full" />
            ) : analysis ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-2xl font-display font-bold ${matchScoreColor(analysis.matchScore)}`}>
                    {analysis.matchScore}%
                  </span>
                  <span className="text-xs text-ink-500">match score</span>
                </div>
                <ProgressBar value={analysis.matchScore} colorClassName={matchScoreBg(analysis.matchScore)} />

                {analysis.strengths?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-medium text-ink-600 mb-1.5">Strengths</p>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.strengths.map((s) => (
                        <Badge key={s} variant="emerald">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {analysis.skillGaps?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-ink-600 mb-1.5">Skill gaps</p>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.skillGaps.map((s) => (
                        <Badge key={s} variant="amber">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-ink-500">Analysis not available yet.</p>
            )}
          </div>

          {/* Skills */}
          {detail.applicant.skills?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-ink-700 mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {detail.applicant.skills.map((s) => (
                  <Badge key={s.id}>
                    {s.skill.name} · {SKILL_LEVEL_LABELS[s.level]}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {detail.applicant.experiences?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-ink-700 mb-2 inline-flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> Experience
              </p>
              <ul className="space-y-2">
                {detail.applicant.experiences.map((exp) => (
                  <li key={exp.id} className="rounded-2xl border border-ink-100 p-3.5">
                    <p className="text-sm font-medium text-ink-900">
                      {exp.title} · {exp.company}
                    </p>
                    <p className="text-xs text-ink-400 mt-0.5">
                      {formatDate(exp.startDate)} – {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Education */}
          {detail.applicant.educations?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-ink-700 mb-2 inline-flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" /> Education
              </p>
              <ul className="space-y-2">
                {detail.applicant.educations.map((edu) => (
                  <li key={edu.id} className="rounded-2xl border border-ink-100 p-3.5">
                    <p className="text-sm font-medium text-ink-900">
                      {edu.degree}, {edu.institution}
                    </p>
                    <p className="text-xs text-ink-400 mt-0.5">
                      {formatDate(edu.startDate)} – {edu.isCurrent ? 'Present' : formatDate(edu.endDate)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Interviews */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-ink-700">Interviews</p>
              <Button size="sm" variant="secondary" icon={CalendarPlus} onClick={() => setShowScheduler((v) => !v)}>
                Schedule
              </Button>
            </div>

            {detail.interviews?.length > 0 && (
              <ul className="space-y-2 mb-3">
                {detail.interviews.map((iv) => {
                  const Icon = INTERVIEW_ICON[iv.mode] || Video;
                  return (
                    <li key={iv.id} className="rounded-2xl border border-ink-100 p-3.5 flex items-center gap-2">
                      <Icon className="w-4 h-4 text-brand-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink-900">{formatDateTime(iv.scheduledAt)}</p>
                        <p className="text-xs text-ink-400">
                          {INTERVIEW_MODE_LABELS[iv.mode]} · {iv.status}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {showScheduler && (
              <form onSubmit={handleSubmitInterview(onScheduleSubmit)} className="space-y-3 rounded-2xl bg-ink-50 p-4">
                <Input
                  label="Date & time"
                  type="datetime-local"
                  error={interviewErrors.scheduledAt?.message}
                  {...registerInterview('scheduledAt')}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Mode"
                    options={Object.entries(INTERVIEW_MODE_LABELS).map(([value, label]) => ({ value, label }))}
                    error={interviewErrors.mode?.message}
                    {...registerInterview('mode')}
                  />
                  <Input
                    label="Duration (min)"
                    type="number"
                    error={interviewErrors.durationMinutes?.message}
                    {...registerInterview('durationMinutes')}
                  />
                </div>
                <Input label="Meeting link / location" error={interviewErrors.meetingLink?.message} {...registerInterview('meetingLink')} />
                <Input label="Interviewer name" error={interviewErrors.interviewerName?.message} {...registerInterview('interviewerName')} />
                <TextArea label="Notes (optional)" rows={2} {...registerInterview('notes')} />
                <Button type="submit" size="sm" className="w-full" isLoading={schedulingLoading}>
                  Confirm interview
                </Button>
              </form>
            )}
          </div>

          {/* Status transition */}
          {availableNextStatuses.length > 0 && (
            <form onSubmit={handleSubmitStatus(onStatusSubmit)} className="space-y-3 rounded-3xl border border-ink-100 p-5">
              <p className="text-sm font-medium text-ink-700">Move candidate</p>
              <Select
                options={availableNextStatuses.map((s) => ({ value: s, label: APPLICATION_STATUS_LABELS[s] }))}
                error={statusErrors.status?.message}
                {...registerStatus('status')}
              />
              <TextArea label="Note (optional)" rows={2} {...registerStatus('recruiterNote')} />
              <Button
                type="submit"
                className="w-full"
                variant={selectedNextStatus === 'REJECTED' ? 'danger' : 'primary'}
                isLoading={statusSaving}
              >
                {selectedNextStatus ? `Move to ${APPLICATION_STATUS_LABELS[selectedNextStatus]}` : 'Update status'}
              </Button>
            </form>
          )}
        </div>
      )}
    </Drawer>
  );
}
