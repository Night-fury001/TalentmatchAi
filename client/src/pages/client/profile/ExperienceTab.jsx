import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Briefcase } from 'lucide-react';
import { profileService } from '../../../services/profileService';
import { getErrorMessage } from '../../../utils/axiosInstance';
import { experienceSchema } from '../../../utils/schemas';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import TextArea from '../../../components/ui/TextArea';
import Select from '../../../components/ui/Select';
import EmptyState from '../../../components/ui/EmptyState';
import { EMPLOYMENT_TYPE_OPTIONS, JOB_TYPE_LABELS } from '../../../utils/constants';
import { formatDate } from '../../../utils/formatters';

export default function ExperienceTab({ profile, onRefresh }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(experienceSchema) });

  const isCurrent = watch('isCurrent');

  const openAdd = () => {
    setEditing(null);
    reset({ company: '', title: '', employmentType: 'FULL_TIME', location: '', startDate: '', endDate: '', isCurrent: false, description: '' });
    setModalOpen(true);
  };

  const openEdit = (exp) => {
    setEditing(exp);
    reset({
      company: exp.company,
      title: exp.title,
      employmentType: exp.employmentType,
      location: exp.location || '',
      startDate: exp.startDate?.slice(0, 10) || '',
      endDate: exp.endDate?.slice(0, 10) || '',
      isCurrent: exp.isCurrent,
      description: exp.description || '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = { ...data, endDate: data.isCurrent ? null : data.endDate };
      if (editing) {
        await profileService.updateExperience(editing.id, payload);
        toast.success('Experience updated.');
      } else {
        await profileService.addExperience(payload);
        toast.success('Experience added.');
      }
      setModalOpen(false);
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save this entry.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await profileService.deleteExperience(id);
      toast.success('Removed.');
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <Card animate={false}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-ink-900">Work experience</h2>
        <Button size="sm" icon={Plus} onClick={openAdd}>
          Add
        </Button>
      </div>

      {profile.experiences?.length === 0 ? (
        <EmptyState icon={Briefcase} title="No experience added yet" description="Add roles that show off your background." />
      ) : (
        <ul className="space-y-3">
          {profile.experiences.map((exp) => (
            <li key={exp.id} className="flex items-start justify-between gap-3 rounded-2xl border border-ink-100 p-4">
              <div>
                <p className="font-medium text-ink-900">{exp.title}</p>
                <p className="text-sm text-ink-500">
                  {exp.company} · {JOB_TYPE_LABELS[exp.employmentType]}
                </p>
                <p className="text-xs text-ink-400 mt-1">
                  {formatDate(exp.startDate)} – {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                </p>
                {exp.description && <p className="text-sm text-ink-600 mt-2 whitespace-pre-line">{exp.description}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(exp)} className="p-1.5 text-ink-400 hover:text-brand-600">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(exp.id)} className="p-1.5 text-ink-400 hover:text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit experience' : 'Add experience'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Job title" error={errors.title?.message} {...register('title')} />
            <Input label="Company" error={errors.company?.message} {...register('company')} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Select label="Employment type" options={EMPLOYMENT_TYPE_OPTIONS} error={errors.employmentType?.message} {...register('employmentType')} />
            <Input label="Location" error={errors.location?.message} {...register('location')} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Start date" type="date" error={errors.startDate?.message} {...register('startDate')} />
            <Input label="End date" type="date" disabled={isCurrent} error={errors.endDate?.message} {...register('endDate')} />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" className="rounded border-ink-300" {...register('isCurrent')} />
            I currently work here
          </label>
          <TextArea label="Description (optional)" rows={3} error={errors.description?.message} {...register('description')} />
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            {editing ? 'Save changes' : 'Add experience'}
          </Button>
        </form>
      </Modal>
    </Card>
  );
}
