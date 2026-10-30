import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { FileText, Upload, Trash2, Camera } from 'lucide-react';
import { profileService } from '../../../services/profileService';
import { getErrorMessage } from '../../../utils/axiosInstance';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Avatar from '../../../components/ui/Avatar';
import ProgressBar from '../../../components/ui/ProgressBar';

export default function ResumeTab({ profile, onRefresh }) {
  const resumeInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const [resumeProgress, setResumeProgress] = useState(0);
  const [avatarProgress, setAvatarProgress] = useState(0);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleResumeSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingResume(true);
    setResumeProgress(0);
    try {
      await profileService.uploadResume(file, (evt) => {
        setResumeProgress(Math.round((evt.loaded / evt.total) * 100));
      });
      toast.success('Resume uploaded.');
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not upload your resume.'));
    } finally {
      setUploadingResume(false);
      e.target.value = '';
    }
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setAvatarProgress(0);
    try {
      await profileService.uploadAvatar(file, (evt) => {
        setAvatarProgress(Math.round((evt.loaded / evt.total) * 100));
      });
      toast.success('Profile photo updated.');
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not upload your photo.'));
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  const handleDeleteResume = async () => {
    try {
      await profileService.deleteResume();
      toast.success('Resume removed.');
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      await profileService.deleteAvatar();
      toast.success('Profile photo removed.');
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Card animate={false}>
        <h2 className="font-semibold text-ink-900 mb-1">Resume</h2>
        <p className="text-sm text-ink-500 mb-4">PDF or DOCX, up to 5MB. Used for one-click applications and AI matching.</p>

        {profile.resumeUrl ? (
          <div className="flex items-center gap-3 rounded-2xl border border-ink-100 p-4 mb-4">
            <FileText className="w-6 h-6 text-brand-500 shrink-0" />
            <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand-600 hover:text-brand-700 truncate">
              View current resume
            </a>
            <button onClick={handleDeleteResume} className="ml-auto text-ink-400 hover:text-rose-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="text-sm text-ink-400 mb-4">No resume uploaded yet.</p>
        )}

        {uploadingResume && <ProgressBar value={resumeProgress} className="mb-3" />}

        <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleResumeSelect} className="hidden" />
        <Button variant="secondary" icon={Upload} isLoading={uploadingResume} onClick={() => resumeInputRef.current?.click()}>
          {profile.resumeUrl ? 'Replace resume' : 'Upload resume'}
        </Button>
      </Card>

      <Card animate={false}>
        <h2 className="font-semibold text-ink-900 mb-1">Profile photo</h2>
        <p className="text-sm text-ink-500 mb-4">JPG, PNG, or WEBP, up to 2MB.</p>

        <div className="flex items-center gap-4 mb-4">
          <Avatar src={profile.avatarUrl} name={profile.fullName} size="xl" />
          {profile.avatarUrl && (
            <button onClick={handleDeleteAvatar} className="text-ink-400 hover:text-rose-600 text-sm inline-flex items-center gap-1">
              <Trash2 className="w-4 h-4" /> Remove
            </button>
          )}
        </div>

        {uploadingAvatar && <ProgressBar value={avatarProgress} className="mb-3" />}

        <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarSelect} className="hidden" />
        <Button variant="secondary" icon={Camera} isLoading={uploadingAvatar} onClick={() => avatarInputRef.current?.click()}>
          {profile.avatarUrl ? 'Change photo' : 'Upload photo'}
        </Button>
      </Card>
    </div>
  );
}
