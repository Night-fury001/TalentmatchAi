import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, SlidersHorizontal, Briefcase, ChevronLeft, ChevronRight } from 'lucide-react';
import { jobService } from '../../services/jobService';
import { taxonomyService } from '../../services/taxonomyService';
import { getErrorMessage } from '../../utils/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import JobCard from '../../components/JobCard';
import Drawer from '../../components/ui/Drawer';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/Skeleton';
import {
  EMPLOYMENT_TYPE_OPTIONS,
  WORK_MODE_OPTIONS,
  EXPERIENCE_LEVEL_OPTIONS,
} from '../../utils/constants';

export default function JobExplorerPage() {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [savingId, setSavingId] = useState(null);

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [filters, setFilters] = useState({
    categoryId: searchParams.get('categoryId') || '',
    locationId: searchParams.get('locationId') || '',
    jobType: searchParams.get('jobType') || '',
    workMode: searchParams.get('workMode') || '',
    experienceLevel: searchParams.get('experienceLevel') || '',
    salaryMin: searchParams.get('salaryMin') || '',
  });

  useEffect(() => {
    Promise.all([taxonomyService.getCategories(), taxonomyService.getLocations()])
      .then(([catData, locData]) => {
        setCategories(catData.categories);
        setLocations(locData.locations);
      })
      .catch(() => {});
  }, []);

  const fetchJobs = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      try {
        const params = { page, limit: 12 };
        if (keyword) params.keyword = keyword;
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params[key] = value;
        });
        const data = await jobService.searchJobs(params);
        setJobs(data.jobs);
        setPagination(data.pagination);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Could not load jobs.'));
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [keyword, JSON.stringify(filters)]
  );

  useEffect(() => {
    fetchJobs(1);
  }, [fetchJobs]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs(1);
  };

  const applyFilters = () => {
    setFiltersOpen(false);
    fetchJobs(1);
  };

  const clearFilters = () => {
    setFilters({ categoryId: '', locationId: '', jobType: '', workMode: '', experienceLevel: '', salaryMin: '' });
  };

  const handleToggleSave = async (jobId, isSaved) => {
    if (!isAuthenticated) {
      toast.error('Log in as a job seeker to save jobs.');
      return;
    }
    setSavingId(jobId);
    try {
      if (isSaved) {
        await jobService.unsaveJob(jobId);
        toast.success('Removed from saved jobs.');
      } else {
        await jobService.saveJob(jobId);
        toast.success('Job saved.');
      }
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, isSaved: !isSaved } : j)));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink-900">Explore open roles</h1>
        <p className="text-sm text-ink-500 mt-1">
          {pagination.total} open position{pagination.total === 1 ? '' : 's'} waiting to be found.
        </p>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search by title, company, or keyword…"
            className="w-full rounded-2xl border border-ink-200 bg-white pl-11 pr-4 py-2.5 text-sm focus-ring"
          />
        </div>
        <Button type="submit">Search</Button>
        <Button type="button" variant="secondary" icon={SlidersHorizontal} onClick={() => setFiltersOpen(true)}>
          Filters{activeFilterCount > 0 && ` (${activeFilterCount})`}
        </Button>
      </form>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description="Try a different search term or broaden your filters."
        />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job, i) => (
              <JobCard
                key={job.id}
                job={job}
                index={i}
                isSaved={job.isSaved}
                onToggleSave={handleToggleSave}
                saving={savingId === job.id}
              />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <Button
                variant="secondary"
                size="sm"
                icon={ChevronLeft}
                disabled={pagination.page <= 1}
                onClick={() => fetchJobs(pagination.page - 1)}
              >
                Prev
              </Button>
              <span className="text-sm text-ink-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchJobs(pagination.page + 1)}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      <Drawer isOpen={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filter jobs">
        <div className="space-y-4">
          <Select
            label="Category"
            placeholder="Any category"
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            value={filters.categoryId}
            onChange={(e) => setFilters((f) => ({ ...f, categoryId: e.target.value }))}
          />
          <Select
            label="Location"
            placeholder="Any location"
            options={locations.map((l) => ({ value: l.id, label: [l.city, l.country].filter(Boolean).join(', ') }))}
            value={filters.locationId}
            onChange={(e) => setFilters((f) => ({ ...f, locationId: e.target.value }))}
          />
          <Select
            label="Job type"
            placeholder="Any type"
            options={EMPLOYMENT_TYPE_OPTIONS}
            value={filters.jobType}
            onChange={(e) => setFilters((f) => ({ ...f, jobType: e.target.value }))}
          />
          <Select
            label="Work mode"
            placeholder="Any mode"
            options={WORK_MODE_OPTIONS}
            value={filters.workMode}
            onChange={(e) => setFilters((f) => ({ ...f, workMode: e.target.value }))}
          />
          <Select
            label="Experience level"
            placeholder="Any level"
            options={EXPERIENCE_LEVEL_OPTIONS}
            value={filters.experienceLevel}
            onChange={(e) => setFilters((f) => ({ ...f, experienceLevel: e.target.value }))}
          />
          <Input
            label="Minimum salary"
            type="number"
            placeholder="e.g. 80000"
            value={filters.salaryMin}
            onChange={(e) => setFilters((f) => ({ ...f, salaryMin: e.target.value }))}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={clearFilters}>
              Clear
            </Button>
            <Button className="flex-1" onClick={applyFilters}>
              Apply filters
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
