import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Users, Search, Ban, CheckCircle2, Trash2 } from 'lucide-react';
import { adminUserService } from '../../services/adminUserService';
import { getErrorMessage } from '../../utils/axiosInstance';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/Skeleton';
import { ROLE_LABELS, ROLE_COLORS } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';

const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }));
const STATUS_OPTIONS = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Deactivated' },
];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState('');
  const [busyId, setBusyId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { limit: 50 };
      if (search) params.search = search;
      if (role) params.role = role;
      if (isActive) params.isActive = isActive;
      const data = await adminUserService.listUsers(params);
      setUsers(data.users);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not load users.'));
    } finally {
      setIsLoading(false);
    }
  }, [search, role, isActive]);

  useEffect(() => {
    const timeout = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timeout);
  }, [fetchUsers]);

  const handleToggle = async (user) => {
    setBusyId(user.id);
    try {
      await adminUserService.toggleUserActive(user.id, !user.isActive);
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}.`);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u)));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update this user.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Permanently delete ${user.email}? This cannot be undone.`)) return;
    setBusyId(user.id);
    try {
      await adminUserService.deleteUser(user.id);
      toast.success('User deleted.');
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete this user.'));
    } finally {
      setBusyId(null);
    }
  };

  const displayName = (user) => user.jobSeekerProfile?.fullName || user.recruiterProfile?.fullName || user.email;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink-900">Users</h1>
        <p className="text-sm text-ink-500 mt-1">Manage every account on the platform.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email…"
            className="w-full rounded-2xl border border-ink-200 bg-white py-2.5 pl-10 pr-4 text-sm focus-ring"
          />
        </div>
        <Select placeholder="All roles" options={ROLE_OPTIONS} value={role} onChange={(e) => setRole(e.target.value)} containerClassName="w-40" />
        <Select
          placeholder="All statuses"
          options={STATUS_OPTIONS}
          value={isActive}
          onChange={(e) => setIsActive(e.target.value)}
          containerClassName="w-40"
        />
      </div>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try adjusting your search or filters." />
      ) : (
        <div className="surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-xs font-medium text-ink-400 uppercase tracking-wide">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {users.map((user, i) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.2) }}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={displayName(user)} size="sm" />
                      <div className="min-w-0">
                        <p className="font-medium text-ink-900 truncate">{displayName(user)}</p>
                        <p className="text-xs text-ink-400 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge className={ROLE_COLORS[user.role]}>{ROLE_LABELS[user.role]}</Badge>
                  </td>
                  <td className="px-5 py-3.5">
                    {user.isActive ? <Badge variant="emerald">Active</Badge> : <Badge variant="rose">Deactivated</Badge>}
                  </td>
                  <td className="px-5 py-3.5 text-ink-500">{formatDate(user.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    {user.role !== 'ADMIN' && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggle(user)}
                          disabled={busyId === user.id}
                          className={`rounded-full p-2 disabled:opacity-50 ${
                            user.isActive ? 'text-ink-400 hover:bg-rose-50 hover:text-rose-600' : 'text-ink-400 hover:bg-emerald-50 hover:text-emerald-600'
                          }`}
                          aria-label={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {user.isActive ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          disabled={busyId === user.id}
                          className="rounded-full p-2 text-ink-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
