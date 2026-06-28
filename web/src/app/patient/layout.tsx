import { Navbar } from '@/components/Navbar';
import { requireProfile } from '@/lib/auth';

export default async function PatientLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile(['patient']);
  return (
    <>
      <Navbar role="patient" userName={profile.full_name} />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </>
  );
}
