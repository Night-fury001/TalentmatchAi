import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { recruiterJobService } from '../../services/recruiterJobService';
import { companyService } from '../../services/companyService';
import { taxonomyService } from '../../services/taxonomyService';
import { getErrorMessage } from '../../utils/axiosInstance';
import { jobFormSchema } from '../../utils/schemas';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import TextArea from '../../components/ui/TextArea';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { EMPLOYMENT_TYPE_OPTIONS, WORK_MODE_OPTIONS, EXPERIENCE_LEVEL_OPTIONS } from '../../utils/constants';

function toDateInputValue(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toISOString().slice(0, 10);
}

export default function JobFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [skillCatalog, setSkillCatalog] = useState([]);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      companyId: '',
      title: '',
      description: '',
      requirements: '',
      responsibilities: '',
      benefits: '',
      categoryId: '',
      locationId: '',
      jobType: 'FULL_TIME',
      workMode: 'ONSITE',
      experienceLevel: 'MID',
      salaryMin: '',
      salaryMax: '',
      currency: 'USD',
      vacancies: 1,
      applicationDeadline: '',
      skillIds: [],
    },
  });

  const selectedSkillIds = watch('skillIds') || [];

  useEffect(() => {
    Promise.all([companyService.getMyCompanies(), taxonomyService.getCategories(), taxonomyService.getSkills(), taxonomyService.getLocations()])
      .then(([companyData, catData, skillData, locData]) => {
        setCompanies(companyData.companies);
        setCategories(catData.categories);
        setSkillCatalog(skillData.skills);
        setLocations(locData.locations);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    async function loadJob() {
      try {
        const { job } = await recruiterJobService.getJobById(id);
        if (cancelled) return;
        reset({
          companyId: job.companyId,
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          responsibilities: job.responsibilities || '',
          benefits: job.benefits || '',
          categoryId: job.categoryId,
          locationId: job.locationId,
          jobType: job.jobType,
          workMode: job.workMode,
          experienceLevel: job.experienceLevel,
          salaryMin: job.salaryMin ?? '',
          salaryMax: job.salaryMax ?? '',
          currency: job.currency,
          vacancies: job.vacancies,
          applicationDeadline: toDateInputValue(job.applicationDeadline),
          skillIds: (job.requiredSkills || []).map((rs) => rs.skill.id),
        });
      } catch (err) {
        toast.error(getErrorMessage(err, 'Could not load this job.'));
        navigate('/recruiter/jobs');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    loadJob();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, reset, navigate]);

  const toggleSkill = (skillId) => {
    const current = selectedSkillIds;
    if (current.includes(skillId)) {
      setValue('skillIds', current.filter((s) => s !== skillId));
    } else if (current.length < 30) {
      setValue('skillIds', [...current, skillId]);
    }
  };

  const performSubmit = async (data, explicitStatus) => {
    setIsSubmitting(true);
    const payload = {
      ...data,
      salaryMin: data.salaryMin === '' ? undefined : Number(data.salaryMin),
      salaryMax: data.salaryMax === '' ? undefined : Number(data.salaryMax),
      vacancies: Number(data.vacancies),
      applicationDeadline: data.applicationDeadline || undefined,
    };
    if (!isEdit && explicitStatus) payload.status = explicitStatus;

    try {
      if (isEdit) {
        await recruiterJobService.updateJob(id, payload);
        toast.success('Job updated.');
      } else {
        await recruiterJobService.createJob(payload);
        toast.success(explicitStatus === 'OPEN' ? 'Job published!' : 'Job saved as draft.');
      }
      navigate('/recruiter/jobs');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save this job.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveDraft = handleSubmit((data) => performSubmit(data, 'DRAFT'));
  const publish = handleSubmit((data) => performSubmit(data, 'OPEN'));
  const saveEdit = handleSubmit((data) => performSubmit(data));

  if (isLoading) return <SkeletonCard />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to="/recruiter/jobs" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-800">
        <ArrowLeft className="w-4 h-4" /> Back to job postings
      </Link>

      <div>
        <h1 className="text-2xl font-display font-bold text-ink-900">{isEdit ? 'Edit job posting' : 'Post a new job'}</h1>
        <p className="text-sm text-ink-500 mt-1">Fields marked required help our AI match candidates accurately.</p>
      </div>

      <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6" onSubmit={(e) => e.preventDefault()}>
        <Card animate={false} className="space-y-4">
          <Select
            label="Company"
            options={companies.map((c) => ({ value: c.id, label: c.name }))}
            disabled={isEdit}
            error={errors.companyId?.message}
            {...register('companyId')}
          />
          <Input label="Job title" error={errors.title?.message} {...register('title')} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Category" options={categories.map((c) => ({ value: c.id, label: c.name }))} error={errors.categoryId?.message} {...register('categoryId')} />
            <Select
              label="Location"
              options={locations.map((l) => ({ value: l.id, label: [l.city, l.country].filter(Boolean).join(', ') }))}
              error={errors.locationId?.message}
              {...register('locationId')}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Select label="Job type" options={EMPLOYMENT_TYPE_OPTIONS} error={errors.jobType?.message} {...register('jobType')} />
            <Select label="Work mode" options={WORK_MODE_OPTIONS} error={errors.workMode?.message} {...register('workMode')} />
            <Select label="Experience" options={EXPERIENCE_LEVEL_OPTIONS} error={errors.experienceLevel?.message} {...register('experienceLevel')} />
          </div>
        </Card>

        <Card animate={false} className="space-y-4">
          <TextArea label="Description" rows={6} error={errors.description?.message} {...register('description')} />
          <TextArea label="Requirements" rows={4} error={errors.requirements?.message} {...register('requirements')} />
          <TextArea label="Responsibilities (optional)" rows={4} error={errors.responsibilities?.message} {...register('responsibilities')} />
          <TextArea label="Benefits (optional)" rows={3} error={errors.benefits?.message} {...register('benefits')} />
        </Card>

        <Card animate={false} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Salary min (optional)" type="number" error={errors.salaryMin?.message} {...register('salaryMin')} />
            <Input label="Salary max (optional)" type="number" error={errors.salaryMax?.message} {...register('salaryMax')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Vacancies" type="number" min={1} error={errors.vacancies?.message} {...register('vacancies')} />
            <Input label="Application deadline (optional)" type="date" error={errors.applicationDeadline?.message} {...register('applicationDeadline')} />
          </div>
        </Card>

        <Card animate={false}>
          <p className="text-sm font-medium text-ink-700 mb-3">Required skills</p>
          <Controller
            name="skillIds"
            control={control}
            render={() => (
              <div className="flex flex-wrap gap-2">
                {skillCatalog.map((skill) => {
                  const active = selectedSkillIds.includes(skill.id);
                  return (
                    <button
                      type="button"
                      key={skill.id}
                      onClick={() => toggleSkill(skill.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        active ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-ink-200 text-ink-600 hover:border-ink-300'
                      }`}
                    >
                      {skill.name}
                      {active && <X className="w-3 h-3 inline ml-1" />}
                    </button>
                  );
                })}
              </div>
            )}
          />
          {selectedSkillIds.length > 0 && (
            <p className="text-xs text-ink-400 mt-3">{selectedSkillIds.length} skill(s) selected</p>
          )}
        </Card>

        <div className="flex items-center gap-3 justify-end">
          {!isEdit && (
            <Button type="button" variant="secondary" isLoading={isSubmitting} onClick={saveDraft}>
              Save as draft
            </Button>
          )}
          <Button type="button" isLoading={isSubmitting} onClick={isEdit ? saveEdit : publish}>
            {isEdit ? 'Save changes' : 'Publish job'}
          </Button>
        </div>
      </motion.form>
    </div>
  );
}
