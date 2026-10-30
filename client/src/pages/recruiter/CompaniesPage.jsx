import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Building2, Plus, CheckCircle2, Clock, Upload } from 'lucide-react';
import { companyService } from '../../services/companyService';
import { taxonomyService } from '../../services/taxonomyService';
import { getErrorMessage } from '../../utils/axiosInstance';
import { companySchema } from '../../utils/schemas';
import Drawer from '../../components/ui/Drawer';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/Skeleton';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [locations, setLocations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(companySchema) });

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const data = await companyService.getMyCompanies();
      setCompanies(data.companies);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not load your companies.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
    taxonomyService
      .getLocations()
      .then((data) => setLocations(data.locations))
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', website: '', description: '', industry: '', size: '', foundedYear: '', headquartersId: '' });
    setDrawerOpen(true);
  };

  const openEdit = (company) => {
    setEditing(company);
    reset({
      name: company.name,
      website: company.website || '',
      description: company.description || '',
      industry: company.industry || '',
      size: company.size || '',
      foundedYear: company.foundedYear || '',
      headquartersId: company.headquartersId || '',
    });
    setDrawerOpen(true);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    const payload = {
      ...data,
      foundedYear: data.foundedYear === '' ? undefined : Number(data.foundedYear),
      headquartersId: data.headquartersId || undefined,
    };
    try {
      if (editing) {
        await companyService.updateCompany(editing.id, payload);
        toast.success('Company updated.');
      } else {
        await companyService.createCompany(payload);
        toast.success('Company created — pending admin verification.');
      }
      setDrawerOpen(false);
      fetchCompanies();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save this company.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploadingLogo(true);
    try {
      const result = await companyService.uploadLogo(editing.id, file);
      setEditing((prev) => ({ ...prev, logo: result.logo }));
      toast.success('Logo updated.');
      fetchCompanies();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not upload logo.'));
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink-900">Companies</h1>
          <p className="text-sm text-ink-500 mt-1">Manage the employer brands you post jobs under.</p>
        </div>
        <Button icon={Plus} onClick={openCreate}>
          New company
        </Button>
      </div>

      {isLoading ? (
        <SkeletonList count={3} />
      ) : companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies yet"
          description="Create a company profile before posting your first job."
          action={
            <Button icon={Plus} onClick={openCreate}>
              Create a company
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company, i) => (
            <motion.button
              key={company.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
              onClick={() => openEdit(company)}
              className="surface p-5 text-left hover:-translate-y-0.5 transition-transform"
            >
              <div className="flex items-start justify-between">
                <Avatar src={company.logo} name={company.name} size="lg" />
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
              <h3 className="font-semibold text-ink-900 mt-3">{company.name}</h3>
              <p className="text-sm text-ink-500 mt-0.5">{company.industry || 'Industry not set'}</p>
              <p className="text-xs text-ink-400 mt-3">{company._count?.jobs || 0} job postings</p>
            </motion.button>
          ))}
        </div>
      )}

      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title={editing ? 'Edit company' : 'New company'}>
        {editing && (
          <div className="mb-6 flex items-center gap-4">
            <Avatar src={editing.logo} name={editing.name} size="xl" />
            <div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={Upload}
                isLoading={uploadingLogo}
                onClick={() => fileInputRef.current?.click()}
              >
                Upload logo
              </Button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleLogoSelect} />
              <p className="text-xs text-ink-400 mt-1.5">JPG, PNG, or WEBP · up to 2MB</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Company name" error={errors.name?.message} {...register('name')} />
          <Input label="Website" placeholder="https://" error={errors.website?.message} {...register('website')} />
          <TextArea label="Description" rows={4} error={errors.description?.message} {...register('description')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Industry" error={errors.industry?.message} {...register('industry')} />
            <Input label="Company size" placeholder="e.g. 51-200" error={errors.size?.message} {...register('size')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Founded year" type="number" error={errors.foundedYear?.message} {...register('foundedYear')} />
            <Select
              label="Headquarters"
              options={locations.map((l) => ({ value: l.id, label: [l.city, l.country].filter(Boolean).join(', ') }))}
              error={errors.headquartersId?.message}
              {...register('headquartersId')}
            />
          </div>
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            {editing ? 'Save changes' : 'Create company'}
          </Button>
        </form>
      </Drawer>
    </div>
  );
}
