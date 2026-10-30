import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, FolderGit2, ExternalLink } from 'lucide-react';
import { profileService } from '../../../services/profileService';
import { getErrorMessage } from '../../../utils/axiosInstance';
import { projectSchema } from '../../../utils/schemas';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import TextArea from '../../../components/ui/TextArea';
import EmptyState from '../../../components/ui/EmptyState';

export default function ProjectsTab({ profile, onRefresh }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(projectSchema) });

  const openAdd = () => {
    setEditing(null);
    reset({ title: '', description: '', projectUrl: '', repoUrl: '', techStack: '', startDate: '', endDate: '' });
    setModalOpen(true);
  };

  const openEdit = (proj) => {
    setEditing(proj);
    reset({
      title: proj.title,
      description: proj.description || '',
      projectUrl: proj.projectUrl || '',
      repoUrl: proj.repoUrl || '',
      techStack: proj.techStack || '',
      startDate: proj.startDate?.slice(0, 10) || '',
      endDate: proj.endDate?.slice(0, 10) || '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (editing) {
        await profileService.updateProject(editing.id, data);
        toast.success('Project updated.');
      } else {
        await profileService.addProject(data);
        toast.success('Project added.');
      }
      setModalOpen(false);
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save this project.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await profileService.deleteProject(id);
      toast.success('Removed.');
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <Card animate={false}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-ink-900">Projects</h2>
        <Button size="sm" icon={Plus} onClick={openAdd}>
          Add
        </Button>
      </div>

      {profile.projects?.length === 0 ? (
        <EmptyState icon={FolderGit2} title="No projects added yet" description="Showcase things you've built." />
      ) : (
        <ul className="space-y-3">
          {profile.projects.map((proj) => (
            <li key={proj.id} className="flex items-start justify-between gap-3 rounded-2xl border border-ink-100 p-4">
              <div>
                <p className="font-medium text-ink-900">{proj.title}</p>
                {proj.techStack && <p className="text-xs text-ink-400 mt-0.5">{proj.techStack}</p>}
                {proj.description && <p className="text-sm text-ink-600 mt-2 whitespace-pre-line">{proj.description}</p>}
                <div className="flex gap-3 mt-2">
                  {proj.projectUrl && (
                    <a href={proj.projectUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1">
                      Live <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {proj.repoUrl && (
                    <a href={proj.repoUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1">
                      Repo <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(proj)} className="p-1.5 text-ink-400 hover:text-brand-600">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(proj.id)} className="p-1.5 text-ink-400 hover:text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit project' : 'Add project'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Title" error={errors.title?.message} {...register('title')} />
          <TextArea label="Description" rows={3} error={errors.description?.message} {...register('description')} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Live URL" error={errors.projectUrl?.message} {...register('projectUrl')} />
            <Input label="Repo URL" error={errors.repoUrl?.message} {...register('repoUrl')} />
          </div>
          <Input label="Tech stack" placeholder="React, Node.js, PostgreSQL" error={errors.techStack?.message} {...register('techStack')} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Start date" type="date" error={errors.startDate?.message} {...register('startDate')} />
            <Input label="End date" type="date" error={errors.endDate?.message} {...register('endDate')} />
          </div>
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            {editing ? 'Save changes' : 'Add project'}
          </Button>
        </form>
      </Modal>
    </Card>
  );
}
