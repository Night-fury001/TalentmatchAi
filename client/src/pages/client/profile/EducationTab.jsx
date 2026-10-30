import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, GraduationCap } from 'lucide-react';
import { profileService } from '../../../services/profileService';
import { getErrorMessage } from '../../../utils/axiosInstance';
import { educationSchema } from '../../../utils/schemas';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import TextArea from '../../../components/ui/TextArea';
import EmptyState from '../../../components/ui/EmptyState';
import { formatDate } from '../../../utils/formatters';

export default function EducationTab({ profile, onRefresh }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(educationSchema) });

  const isCurrent = watch('isCurrent');

  const openAdd = () => {
    setEditing(null);
    reset({ institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', isCurrent: false, grade: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (edu) => {
    setEditing(edu);
    reset({
      institution: edu.institution,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy || '',
      startDate: edu.startDate?.slice(0, 10) || '',
      endDate: edu.endDate?.slice(0, 10) || '',
      isCurrent: edu.isCurrent,
      grade: edu.grade || '',
      description: edu.description || '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = { ...data, endDate: data.isCurrent ? null : data.endDate };
      if (editing) {
        await profileService.updateEducation(editing.id, payload);
        toast.success('Education updated.');
      } else {
        await profileService.addEducation(payload);
        toast.success('Education added.');
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
      await profileService.deleteEducation(id);
      toast.success('Removed.');
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <Card animate={false}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-ink-900">Education</h2>
        <Button size="sm" icon={Plus} onClick={openAdd}>
          Add
        </Button>
      </div>

      {profile.educations?.length === 0 ? (
        <EmptyState icon={GraduationCap} title="No education added yet" description="Add your degrees and certifications." />
      ) : (
        <ul className="space-y-3">
          {profile.educations.map((edu) => (
            <li key={edu.id} className="flex items-start justify-between gap-3 rounded-2xl border border-ink-100 p-4">
              <div>
                <p className="font-medium text-ink-900">{edu.degree}{edu.fieldOfStudy ? `, ${edu.fieldOfStudy}` : ''}</p>
                <p className="text-sm text-ink-500">{edu.institution}</p>
                <p className="text-xs text-ink-400 mt-1">
                  {formatDate(edu.startDate)} – {edu.isCurrent ? 'Present' : formatDate(edu.endDate)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(edu)} className="p-1.5 text-ink-400 hover:text-brand-600">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(edu.id)} className="p-1.5 text-ink-400 hover:text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit education' : 'Add education'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Institution" error={errors.institution?.message} {...register('institution')} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Degree" error={errors.degree?.message} {...register('degree')} />
            <Input label="Field of study" error={errors.fieldOfStudy?.message} {...register('fieldOfStudy')} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Start date" type="date" error={errors.startDate?.message} {...register('startDate')} />
            <Input label="End date" type="date" disabled={isCurrent} error={errors.endDate?.message} {...register('endDate')} />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" className="rounded border-ink-300" {...register('isCurrent')} />
            I&apos;m currently studying here
          </label>
          <Input label="Grade (optional)" error={errors.grade?.message} {...register('grade')} />
          <TextArea label="Description (optional)" rows={3} error={errors.description?.message} {...register('description')} />
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            {editing ? 'Save changes' : 'Add education'}
          </Button>
        </form>
      </Modal>
    </Card>
  );
}
