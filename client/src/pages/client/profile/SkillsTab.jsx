import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Plus, X, Wrench } from 'lucide-react';
import { profileService } from '../../../services/profileService';
import { taxonomyService } from '../../../services/taxonomyService';
import { getErrorMessage } from '../../../utils/axiosInstance';
import { addSkillSchema } from '../../../utils/schemas';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import Badge from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';
import { SKILL_LEVEL_OPTIONS, SKILL_LEVEL_LABELS } from '../../../utils/constants';

export default function SkillsTab({ profile, onRefresh }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [catalog, setCatalog] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(addSkillSchema), defaultValues: { level: 'INTERMEDIATE' } });

  useEffect(() => {
    taxonomyService
      .getSkills()
      .then((data) => setCatalog(data.skills))
      .catch(() => {});
  }, []);

  const alreadyAddedIds = new Set((profile.skills || []).map((s) => s.skill.id));
  const availableOptions = catalog
    .filter((s) => !alreadyAddedIds.has(s.id))
    .map((s) => ({ value: s.id, label: s.name }));

  const openAdd = () => {
    reset({ skillId: '', level: 'INTERMEDIATE', yearsUsed: '' });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await profileService.addSkill({
        ...data,
        yearsUsed: data.yearsUsed === '' ? undefined : Number(data.yearsUsed),
      });
      toast.success('Skill added.');
      setModalOpen(false);
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not add this skill.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      await profileService.removeSkill(id);
      toast.success('Skill removed.');
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <Card animate={false}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-ink-900">Skills</h2>
        <Button size="sm" icon={Plus} onClick={openAdd}>
          Add skill
        </Button>
      </div>

      {profile.skills?.length === 0 ? (
        <EmptyState icon={Wrench} title="No skills added yet" description="Skills are the biggest driver of your AI match score." />
      ) : (
        <div className="flex flex-wrap gap-2">
          {profile.skills.map((us) => (
            <Badge key={us.id} variant="brand" className="pr-1.5">
              {us.skill.name}
              <span className="text-brand-400">· {SKILL_LEVEL_LABELS[us.level]}</span>
              <button onClick={() => handleRemove(us.id)} className="ml-1 rounded-full p-0.5 hover:bg-brand-100">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add a skill">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select label="Skill" options={availableOptions} error={errors.skillId?.message} {...register('skillId')} />
          <Select label="Proficiency" options={SKILL_LEVEL_OPTIONS} error={errors.level?.message} {...register('level')} />
          <Input label="Years used (optional)" type="number" error={errors.yearsUsed?.message} {...register('yearsUsed')} />
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Add skill
          </Button>
        </form>
      </Modal>
    </Card>
  );
}
