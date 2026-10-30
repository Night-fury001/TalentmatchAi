import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Award, ExternalLink } from 'lucide-react';
import { profileService } from '../../../services/profileService';
import { getErrorMessage } from '../../../utils/axiosInstance';
import { certificationSchema } from '../../../utils/schemas';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import EmptyState from '../../../components/ui/EmptyState';
import { formatDate } from '../../../utils/formatters';

export default function CertificationsTab({ profile, onRefresh }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(certificationSchema) });

  const openAdd = () => {
    setEditing(null);
    reset({ name: '', issuer: '', issueDate: '', expiryDate: '', credentialId: '', credentialUrl: '' });
    setModalOpen(true);
  };

  const openEdit = (cert) => {
    setEditing(cert);
    reset({
      name: cert.name,
      issuer: cert.issuer,
      issueDate: cert.issueDate?.slice(0, 10) || '',
      expiryDate: cert.expiryDate?.slice(0, 10) || '',
      credentialId: cert.credentialId || '',
      credentialUrl: cert.credentialUrl || '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (editing) {
        await profileService.updateCertification(editing.id, data);
        toast.success('Certification updated.');
      } else {
        await profileService.addCertification(data);
        toast.success('Certification added.');
      }
      setModalOpen(false);
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save this certification.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await profileService.deleteCertification(id);
      toast.success('Removed.');
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <Card animate={false}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-ink-900">Certifications</h2>
        <Button size="sm" icon={Plus} onClick={openAdd}>
          Add
        </Button>
      </div>

      {profile.certifications?.length === 0 ? (
        <EmptyState icon={Award} title="No certifications added yet" description="Add credentials that back up your skills." />
      ) : (
        <ul className="space-y-3">
          {profile.certifications.map((cert) => (
            <li key={cert.id} className="flex items-start justify-between gap-3 rounded-2xl border border-ink-100 p-4">
              <div>
                <p className="font-medium text-ink-900">{cert.name}</p>
                <p className="text-sm text-ink-500">{cert.issuer}</p>
                {cert.issueDate && <p className="text-xs text-ink-400 mt-1">Issued {formatDate(cert.issueDate)}</p>}
                {cert.credentialUrl && (
                  <a href={cert.credentialUrl} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand-600 hover:text-brand-700 inline-flex items-center gap-1 mt-1">
                    View credential <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(cert)} className="p-1.5 text-ink-400 hover:text-brand-600">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(cert.id)} className="p-1.5 text-ink-400 hover:text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit certification' : 'Add certification'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Certification name" error={errors.name?.message} {...register('name')} />
          <Input label="Issuing organization" error={errors.issuer?.message} {...register('issuer')} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Issue date" type="date" error={errors.issueDate?.message} {...register('issueDate')} />
            <Input label="Expiry date" type="date" error={errors.expiryDate?.message} {...register('expiryDate')} />
          </div>
          <Input label="Credential ID (optional)" error={errors.credentialId?.message} {...register('credentialId')} />
          <Input label="Credential URL (optional)" error={errors.credentialUrl?.message} {...register('credentialUrl')} />
          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            {editing ? 'Save changes' : 'Add certification'}
          </Button>
        </form>
      </Modal>
    </Card>
  );
}
