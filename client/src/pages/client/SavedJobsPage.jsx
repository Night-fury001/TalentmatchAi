import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bookmark } from 'lucide-react';
import { jobService } from '../../services/jobService';
import { getErrorMessage } from '../../utils/axiosInstance';
import JobCard from '../../components/JobCard';
import EmptyState from '../../components/ui/EmptyState';
import Button from '../../components/ui/Button';
import { SkeletonList } from '../../components/ui/Skeleton';

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  const fetchSavedJobs = async () => {
    setIsLoading(true);
    try {
      const data = await jobService.getSavedJobs({ limit: 50 });
      setSavedJobs(data.savedJobs);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not load saved jobs.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const handleUnsave = async (jobId) => {
    setRemovingId(jobId);
    try {
      await jobService.unsaveJob(jobId);
      setSavedJobs((prev) => prev.filter((s) => s.job.id !== jobId));
      toast.success('Removed from saved jobs.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink-900">Saved jobs</h1>
        <p className="text-sm text-ink-500 mt-1">Roles you&apos;ve bookmarked for later.</p>
      </div>

      {isLoading ? (
        <SkeletonList count={3} />
      ) : savedJobs.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="Nothing saved yet"
          description="Tap the bookmark icon on any job to save it here."
          action={
            <Link to="/jobs">
              <Button>Browse jobs</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {savedJobs.map((saved, i) => (
            <JobCard
              key={saved.id}
              job={saved.job}
              index={i}
              isSaved
              onToggleSave={() => handleUnsave(saved.job.id)}
              saving={removingId === saved.job.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
