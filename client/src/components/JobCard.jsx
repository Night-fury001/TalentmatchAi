import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Bookmark, BookmarkCheck, MapPin, Briefcase, Clock } from 'lucide-react';
import Badge from './ui/Badge';
import { formatSalaryRange, formatLocation, formatRelativeTime } from '../utils/formatters';
import { JOB_TYPE_LABELS, WORK_MODE_LABELS, matchScoreColor } from '../utils/constants';

export default function JobCard({ job, index = 0, isSaved, onToggleSave, matchScore, saving }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4), ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className="surface p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-3">
        <Link to={`/jobs/${job.slug}`} className="flex items-start gap-3 min-w-0 group">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-ink-100 border border-ink-200">
            {job.company?.logo ? (
              <img src={job.company.logo} alt={job.company.name} className="h-full w-full object-cover" />
            ) : (
              <Briefcase className="w-5 h-5 text-ink-400" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-ink-900 group-hover:text-brand-600 transition-colors truncate">
              {job.title}
            </h3>
            <p className="text-sm text-ink-500 truncate">{job.company?.name}</p>
          </div>
        </Link>

        {onToggleSave && (
          <button
            onClick={() => onToggleSave(job.id, isSaved)}
            disabled={saving}
            className="shrink-0 rounded-full p-2 text-ink-400 hover:bg-ink-100 hover:text-brand-600 focus-ring disabled:opacity-50"
            aria-label={isSaved ? 'Unsave job' : 'Save job'}
          >
            {isSaved ? <BookmarkCheck className="w-5 h-5 text-brand-500" /> : <Bookmark className="w-5 h-5" />}
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
        <span className="inline-flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          {formatLocation(job.location)}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {formatRelativeTime(job.createdAt)}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge variant="brand">{JOB_TYPE_LABELS[job.jobType]}</Badge>
        <Badge>{WORK_MODE_LABELS[job.workMode]}</Badge>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-sm font-medium text-ink-800">
          {formatSalaryRange(job.salaryMin, job.salaryMax, job.currency)}
        </span>
        {typeof matchScore === 'number' && (
          <span className={`text-sm font-semibold ${matchScoreColor(matchScore)}`}>{matchScore}% match</span>
        )}
      </div>
    </motion.div>
  );
}
