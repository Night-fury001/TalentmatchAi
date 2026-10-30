import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Building2, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { adminCompanyService } from '../../services/adminCompanyService';
import { getErrorMessage } from '../../utils/axiosInstance';
import { rejectCompanySchema } from '../../utils/schemas';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import TextArea from '../../components/ui/TextArea';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/Skeleton';
import { formatDate } from '../../utils/formatters';

const VERIFIED_OPTIONS = [
  { value: 'true', label: 'Verified' },
  { value: 'false', label: 'Pending' },
];

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [verified, setVerified] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(rejectCompanySchema) });

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { limit: 50 };
      if (verified) params.verified = verified;
      const data = await adminCompanyService.listCompanies(params);
      setCompanies(data.companies);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not load companies.'));
    } finally {
      setIsLoading(false);
    }
  }, [verified]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleVerify = async (company) => {
    setBusyId(company.id);
    try {
      await adminCompanyService.verifyCompany(company.id);
      toast.success(`${company.name} verified.`);
      setCompanies((prev) => prev.map((c) => (c.id === company.id ? { ...c, verifiedByAdmin: true } : c)));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not verify this company.'));
    } finally {
      setBusyId(null);
    }
  };

  const openReject = (company) => {
    setRejectTarget(company);
    reset({ verificationNote: '' });
  };

  const onRejectSubmit = async (data) => {
    setBusyId(rejectTarget.id);
    try {
      await adminCompanyService.rejectCompany(rejectTarget.id, data.verificationNote);
      toast.success(`${rejectTarget.name} verification declined.`);
      setCompanies((prev) =>
        prev.map((c) => (c.id === rejectTarget.id ? { ...c, verifiedByAdmin: false, verificationNote: data.verificationNote } : c))
      );
      setRejectTarget(null);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not reject this company.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink-900">Company verification</h1>
        <p className="text-sm text-ink-500 mt-1">Review new employer accounts before their jobs go public.</p>
      </div>

      <Select
        placeholder="All companies"
        options={VERIFIED_OPTIONS}
        value={verified}
        onChange={(e) => setVerified(e.target.value)}
        containerClassName="w-48"
      />

      {isLoading ? (
        <SkeletonList count={4} />
      ) : companies.length === 0 ? (
        <EmptyState icon={Building2} title="No companies found" description="Try a different filter." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {companies.map((company, i) => (
            <motion.div
              key={company.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
              className="surface p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar src={company.logo} name={company.name} size="lg" />
                  <div>
                    <h3 className="font-semibold text-ink-900">{company.name}</h3>
                    <p className="text-xs text-ink-500">{company.recruiter?.user?.email}</p>
                  </div>
                </div>
                {company.verifiedByAdmin ? (
                  <Badge variant="emerald">
                    <CheckCircle2 className="w-3 h-3" /> Verified
                  </Badge>
                ) : (
                  <Badge variant="amber">
                    <Clock className="w-3 h-3" /> Pending
                  </Badge>
                )}
              </div>

              <p className="text-sm text-ink-500 mt-3 line-clamp-2">{company.description || 'No description provided.'}</p>

              <div className="flex items-center justify-between mt-4 text-xs text-ink-400">
                <span>{company._count?.jobs || 0} job postings</span>
                <span>Joined {formatDate(company.createdAt)}</span>
              </div>

              {company.verificationNote && (
                <p className="mt-3 rounded-xl bg-rose-50 text-rose-700 text-xs p-2.5">Rejection note: {company.verificationNote}</p>
              )}

              {!company.verifiedByAdmin && (
                <div className="flex gap-2 mt-4">
                  <Button size="sm" className="flex-1" icon={CheckCircle2} isLoading={busyId === company.id} onClick={() => handleVerify(company)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="danger" className="flex-1" icon={XCircle} onClick={() => openReject(company)}>
                    Reject
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={Boolean(rejectTarget)} onClose={() => setRejectTarget(null)} title={`Reject ${rejectTarget?.name || ''}`}>
        <form onSubmit={handleSubmit(onRejectSubmit)} className="space-y-4">
          <TextArea
            label="Reason"
            rows={3}
            placeholder="Explain what needs to change before this company can be verified…"
            error={errors.verificationNote?.message}
            {...register('verificationNote')}
          />
          <Button type="submit" variant="danger" className="w-full" isLoading={busyId === rejectTarget?.id}>
            Decline verification
          </Button>
        </form>
      </Modal>
    </div>
  );
}
