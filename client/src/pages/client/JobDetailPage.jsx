import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  MapPin,
  Briefcase,
  Bookmark,
  BookmarkCheck,
  Building2,
  Sparkles,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { jobService } from '../../services/jobService';
import { aiService } from '../../services/aiService';
import { getErrorMessage } from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { applySchema } from '../../utils/schemas';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import TextArea from '../../components/ui/TextArea';
import ProgressBar from '../../components/ui/ProgressBar';
import { SkeletonCard } from '../../components/ui/Skeleton';
import {
  JOB_TYPE_LABELS,
  WORK_MODE_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  matchScoreColor,
  matchScoreBg,
} from '../../utils/constants';
import { formatSalaryRange, formatLocation, formatDate } from '../../utils/formatters';

export default function JobDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  const [job, setJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [match, setMatch] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [applied, setApplied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({ resolver: zodResolver(applySchema) });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const { job: fetched } = await jobService.getJobBySlug(slug);
        if (!cancelled) setJob(fetched);
      } catch (err) {
        toast.error(getErrorMessage(err, 'This job posting could not be found.'));
        navigate('/jobs');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug, navigate]);

  useEffect(() => {
    if (!job || !isAuthenticated || role !== 'CLIENT') return;
    let cancelled = false;
    setMatchLoading(true);
    aiService
      .getJobMatch(job.id)
      .then(({ analysis }) => {
        if (!cancelled) setMatch(analysis);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setMatchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [job, isAuthenticated, role]);

  const handleToggleSave = async () => {
    if (!isAuthenticated) {
      toast.error('Log in as a job seeker to save jobs.');
      return;
    }
    setIsSaving(true);
    try {
      if (job.isSaved) {
        await jobService.unsaveJob(job.id);
        toast.success('Removed from saved jobs.');
      } else {
        await jobService.saveJob(job.id);
        toast.success('Job saved.');
      }
      setJob((prev) => ({ ...prev, isSaved: !prev.isSaved }));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const openApply = () => {
    if (!isAuthenticated) {
      toast.error('Log in as a job seeker to apply.');
      navigate('/login');
      return;
    }
    if (role !== 'CLIENT') {
      toast.error('Only job seeker accounts can apply to jobs.');
      return;
    }
    setApplyOpen(true);
  };

  const onApply = async (data) => {
    setIsApplying(true);
    try {
      await jobService.applyToJob(job.id, data);
      toast.success('Application submitted!');
      setApplied(true);
      setApplyOpen(false);
      reset();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not submit your application.'));
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <SkeletonCard />
      </div>
    );
  }
  if (!job) return null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-6">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="surface p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-ink-100 border border-ink-200">
            {job.company?.logo ? (
              <img src={job.company.logo} alt={job.company.name} className="h-full w-full object-cover" />
            ) : (
              <Building2 className="w-6 h-6 text-ink-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-display font-bold text-ink-900">{job.title}</h1>
            <p className="text-ink-500 mt-1">{job.company?.name}</p>
          </div>
          <button
            onClick={handleToggleSave}
            disabled={isSaving}
            className="rounded-full p-2.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600 focus-ring disabled:opacity-50"
          >
            {job.isSaved ? <BookmarkCheck className="w-6 h-6 text-brand-500" /> : <Bookmark className="w-6 h-6" />}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-5 text-sm text-ink-500">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            {formatLocation(job.location)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            Posted {formatDate(job.createdAt)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Badge variant="brand">{JOB_TYPE_LABELS[job.jobType]}</Badge>
          <Badge>{WORK_MODE_LABELS[job.workMode]}</Badge>
          <Badge>{EXPERIENCE_LEVEL_LABELS[job.experienceLevel]}</Badge>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-2xl bg-ink-50 px-5 py-4">
          <span className="font-semibold text-ink-900">
            {formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}
          </span>
          {applied ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-glow-emerald">
              <CheckCircle2 className="w-4 h-4" />
              Applied
            </span>
          ) : (
            <Button onClick={openApply}>Apply now</Button>
          )}
        </div>
      </motion.div>

      {isAuthenticated && role === 'CLIENT' && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="surface p-7">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-brand-500" />
            <h2 className="font-semibold text-ink-900">Your AI match</h2>
          </div>
          {matchLoading ? (
            <div className="skeleton h-16 w-full" />
          ) : match ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-3xl font-display font-bold ${matchScoreColor(match.matchScore)}`}>
                  {match.matchScore}%
                </span>
                <span className="text-sm text-ink-500">match with your profile</span>
              </div>
              <ProgressBar value={match.matchScore} colorClassName={matchScoreBg(match.matchScore)} heightClassName="h-2.5" />

              {match.skillGaps?.length > 0 && (
                <div className="mt-5">
                  <p className="text-sm font-medium text-ink-700 mb-2">Skill gaps to close</p>
                  <div className="flex flex-wrap gap-1.5">
                    {match.skillGaps.map((skill) => (
                      <Badge key={skill} variant="amber">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {match.strengths?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-ink-700 mb-2">Your strengths for this role</p>
                  <div className="flex flex-wrap gap-1.5">
                    {match.strengths.map((skill) => (
                      <Badge key={skill} variant="emerald">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-ink-500">Match analysis is not available for this job right now.</p>
          )}
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="surface p-7 space-y-6">
        <section>
          <h2 className="font-semibold text-ink-900 mb-2">About the role</h2>
          <p className="text-sm text-ink-600 whitespace-pre-line leading-relaxed">{job.description}</p>
        </section>
        <section>
          <h2 className="font-semibold text-ink-900 mb-2">Requirements</h2>
          <p className="text-sm text-ink-600 whitespace-pre-line leading-relaxed">{job.requirements}</p>
        </section>
        {job.responsibilities && (
          <section>
            <h2 className="font-semibold text-ink-900 mb-2">Responsibilities</h2>
            <p className="text-sm text-ink-600 whitespace-pre-line leading-relaxed">{job.responsibilities}</p>
          </section>
        )}
        {job.benefits && (
          <section>
            <h2 className="font-semibold text-ink-900 mb-2">Benefits</h2>
            <p className="text-sm text-ink-600 whitespace-pre-line leading-relaxed">{job.benefits}</p>
          </section>
        )}
        {job.requiredSkills?.length > 0 && (
          <section>
            <h2 className="font-semibold text-ink-900 mb-2">Required skills</h2>
            <div className="flex flex-wrap gap-1.5">
              {job.requiredSkills.map((rs) => (
                <Badge key={rs.skill.id} variant="brand">
                  {rs.skill.name}
                </Badge>
              ))}
            </div>
          </section>
        )}
      </motion.div>

      <div className="text-center">
        <Link to="/jobs" className="text-sm font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1">
          <Briefcase className="w-4 h-4" /> Browse more roles
        </Link>
      </div>

      <Modal isOpen={applyOpen} onClose={() => setApplyOpen(false)} title={`Apply to ${job.title}`}>
        <form onSubmit={handleSubmit(onApply)} className="space-y-4">
          <p className="text-sm text-ink-500">
            We&apos;ll submit the resume already on your profile. Add a short note if you&apos;d like.
          </p>
          <TextArea
            label="Cover letter (optional)"
            rows={5}
            placeholder="Tell them why you're a great fit…"
            error={errors.coverLetter?.message}
            {...register('coverLetter')}
          />
          <Button type="submit" className="w-full" isLoading={isApplying}>
            Submit application
          </Button>
        </form>
      </Modal>
    </div>
  );
}
