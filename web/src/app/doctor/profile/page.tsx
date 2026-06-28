import { requireProfile } from '@/lib/auth';
import { PageHeader } from '@/components/ui';
import { ProfileForm } from '@/components/ProfileForm';

export default async function DoctorProfilePage() {
  const { profile } = await requireProfile(['doctor']);
  return (
    <>
      <PageHeader title="My Profile" />
      <ProfileForm profile={profile} />
    </>
  );
}
