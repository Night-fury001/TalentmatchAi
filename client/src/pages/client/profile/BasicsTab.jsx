import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { profileService } from '../../../services/profileService';
import { taxonomyService } from '../../../services/taxonomyService';
import { getErrorMessage } from '../../../utils/axiosInstance';
import { profileBasicsSchema } from '../../../utils/schemas';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import TextArea from '../../../components/ui/TextArea';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';

export default function BasicsTab({ profile, onRefresh }) {
  const [locations, setLocations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileBasicsSchema),
    defaultValues: {
      fullName: profile.fullName || '',
      headline: profile.headline || '',
      bio: profile.bio || '',
      phone: profile.phone || '',
      portfolioUrl: profile.portfolioUrl || '',
      linkedinUrl: profile.linkedinUrl || '',
      githubUrl: profile.githubUrl || '',
      locationId: profile.locationId || '',
      openToRemote: profile.openToRemote ?? true,
      expectedSalaryMin: profile.expectedSalaryMin || '',
      expectedSalaryMax: profile.expectedSalaryMax || '',
      yearsExperience: profile.yearsExperience || 0,
    },
  });

  useEffect(() => {
    taxonomyService
      .getLocations()
      .then((data) => setLocations(data.locations))
      .catch(() => {});
  }, []);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...data,
        locationId: data.locationId || null,
        expectedSalaryMin: data.expectedSalaryMin === '' ? null : Number(data.expectedSalaryMin),
        expectedSalaryMax: data.expectedSalaryMax === '' ? null : Number(data.expectedSalaryMax),
      };
      await profileService.updateProfile(payload);
      toast.success('Profile updated.');
      onRefresh();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update your profile.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card animate={false}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Full name" error={errors.fullName?.message} {...register('fullName')} />
          <Input label="Headline" placeholder="e.g. Senior Frontend Engineer" error={errors.headline?.message} {...register('headline')} />
        </div>
        <TextArea label="Bio" rows={4} placeholder="A short summary of who you are…" error={errors.bio?.message} {...register('bio')} />
        <div className="grid sm:grid-cols-2 gap-4">
          <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
          <Select
            label="Location"
            placeholder="Select a location"
            options={locations.map((l) => ({ value: l.id, label: [l.city, l.country].filter(Boolean).join(', ') }))}
            error={errors.locationId?.message}
            {...register('locationId')}
          />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Input label="Portfolio URL" error={errors.portfolioUrl?.message} {...register('portfolioUrl')} />
          <Input label="LinkedIn URL" error={errors.linkedinUrl?.message} {...register('linkedinUrl')} />
          <Input label="GitHub URL" error={errors.githubUrl?.message} {...register('githubUrl')} />
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <Input label="Min. expected salary" type="number" error={errors.expectedSalaryMin?.message} {...register('expectedSalaryMin')} />
          <Input label="Max. expected salary" type="number" error={errors.expectedSalaryMax?.message} {...register('expectedSalaryMax')} />
          <Input label="Years of experience" type="number" error={errors.yearsExperience?.message} {...register('yearsExperience')} />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" className="rounded border-ink-300" {...register('openToRemote')} />
          Open to remote roles
        </label>
        <Button type="submit" isLoading={isSubmitting}>
          Save changes
        </Button>
      </form>
    </Card>
  );
}
