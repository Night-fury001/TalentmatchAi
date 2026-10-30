import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ScrollText } from 'lucide-react';
import { adminActivityService } from '../../services/adminActivityService';
import { getErrorMessage } from '../../utils/axiosInstance';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/Skeleton';
import { ACTIVITY_ACTION_LABELS } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';

const ACTION_OPTIONS = Object.entries(ACTIVITY_ACTION_LABELS).map(([value, label]) => ({ value, label }));

export default function ActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [action, setAction] = useState('');

  const fetchLogs = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      try {
        const params = { page, limit: 30 };
        if (action) params.action = action;
        const data = await adminActivityService.listActivityLogs(params);
        setLogs(data.logs);
        setPagination(data.pagination);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Could not load the activity log.'));
      } finally {
        setIsLoading(false);
      }
    },
    [action]
  );

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink-900">Activity log</h1>
        <p className="text-sm text-ink-500 mt-1">A complete audit trail of administrative and system actions.</p>
      </div>

      <Select placeholder="All actions" options={ACTION_OPTIONS} value={action} onChange={(e) => setAction(e.target.value)} containerClassName="w-64" />

      {isLoading ? (
        <SkeletonList count={5} />
      ) : logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No activity found" description="Try a different filter." />
      ) : (
        <>
          <div className="surface divide-y divide-ink-100">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="brand">{ACTIVITY_ACTION_LABELS[log.action] || log.action}</Badge>
                    {log.user && <span className="text-xs text-ink-400">{log.user.email}</span>}
                  </div>
                  <p className="text-sm text-ink-700 mt-1.5">{log.description}</p>
                </div>
                <span className="text-xs text-ink-400 shrink-0">{formatDateTime(log.createdAt)}</span>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: pagination.totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => fetchLogs(i + 1)}
                  className={`h-9 w-9 rounded-xl text-sm font-medium transition-colors ${
                    pagination.page === i + 1 ? 'bg-brand-600 text-white' : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
