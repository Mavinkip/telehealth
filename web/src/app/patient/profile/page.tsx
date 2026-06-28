import { requireProfile } from '@/lib/auth';
import { PageHeader } from '@/components/ui';
import { ProfileForm } from '@/components/ProfileForm';

export default async function PatientProfilePage() {
  const { profile } = await requireProfile(['patient']);
  return (
    <>
      <PageHeader title="My Profile" />
      <ProfileForm profile={profile} />
    </>
  );
}
