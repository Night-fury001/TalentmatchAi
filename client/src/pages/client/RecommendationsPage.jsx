import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Sparkles, MapPin } from 'lucide-react';
import { aiService } from '../../services/aiService';
import { getErrorMessage } from '../../utils/axiosInstance';
import Badge from '../../components/ui/Badge';
import ProgressBar from '../../components/ui/ProgressBar';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/Skeleton';
import { matchScoreColor, matchScoreBg } from '../../utils/constants';
import { formatSalaryRange, formatLocation } from '../../utils/formatters';

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await aiService.getRecommendations({ limit: 10 });
        if (!cancelled) setRecommendations(data.recommendations);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Could not load your recommendations.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-500" />
          <h1 className="text-2xl font-display font-bold text-ink-900">Your AI matches</h1>
        </div>
        <p className="text-sm text-ink-500 mt-1">
          Ranked by how well your profile fits each open role — updated as you build out your profile.
        </p>
      </div>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : !recommendations || recommendations.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No matches yet"
          description="Complete your profile with skills and experience to get personalized recommendations."
        />
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, i) => (
            <motion.div
              key={rec.job.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.06, 0.4), ease: [0.16, 1, 0.3, 1] }}
              className="surface p-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <Link to={`/jobs/${rec.job.slug}`} className="font-semibold text-ink-900 hover:text-brand-600">
                    {rec.job.title}
                  </Link>
                  <p className="text-sm text-ink-500">{rec.job.company?.name}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-ink-500">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {formatLocation(rec.job.location)}
                    </span>
                    <span>{formatSalaryRange(rec.job.salaryMin, rec.job.salaryMax, rec.job.currency)}</span>
                  </div>
                  {rec.skillGaps?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {rec.skillGaps.slice(0, 4).map((skill) => (
                        <Badge key={skill} variant="amber">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="sm:w-40 shrink-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xl font-display font-bold ${matchScoreColor(rec.matchScore)}`}>
                      {rec.matchScore}%
                    </span>
                    <span className="text-xs text-ink-400">match</span>
                  </div>
                  <ProgressBar value={rec.matchScore} colorClassName={matchScoreBg(rec.matchScore)} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
