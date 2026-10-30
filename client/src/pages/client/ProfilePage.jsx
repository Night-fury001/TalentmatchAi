import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { User, FileText, GraduationCap, Briefcase, FolderGit2, Award, Wrench } from 'lucide-react';
import { profileService } from '../../services/profileService';
import { getErrorMessage } from '../../utils/axiosInstance';
import { SkeletonCard } from '../../components/ui/Skeleton';
import BasicsTab from './profile/BasicsTab';
import ResumeTab from './profile/ResumeTab';
import EducationTab from './profile/EducationTab';
import ExperienceTab from './profile/ExperienceTab';
import ProjectsTab from './profile/ProjectsTab';
import CertificationsTab from './profile/CertificationsTab';
import SkillsTab from './profile/SkillsTab';

const TABS = [
  { key: 'basics', label: 'Basics', icon: User, Component: BasicsTab },
  { key: 'resume', label: 'Resume & photo', icon: FileText, Component: ResumeTab },
  { key: 'education', label: 'Education', icon: GraduationCap, Component: EducationTab },
  { key: 'experience', label: 'Experience', icon: Briefcase, Component: ExperienceTab },
  { key: 'projects', label: 'Projects', icon: FolderGit2, Component: ProjectsTab },
  { key: 'certifications', label: 'Certifications', icon: Award, Component: CertificationsTab },
  { key: 'skills', label: 'Skills', icon: Wrench, Component: SkillsTab },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basics');

  const fetchProfile = async () => {
    try {
      const data = await profileService.getProfile();
      setProfile(data.profile);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not load your profile.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (isLoading) return <SkeletonCard />;
  if (!profile) return null;

  const ActiveComponent = TABS.find((t) => t.key === activeTab).Component;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-ink-900">Your profile</h1>
        <p className="text-sm text-ink-500 mt-1">
          A complete, specific profile is what our AI uses to find you better matches.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={clsx(
              'shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium border transition-colors',
              activeTab === tab.key
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-ink-600 border-ink-200 hover:border-ink-300'
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <ActiveComponent profile={profile} onRefresh={fetchProfile} />
    </div>
  );
}
