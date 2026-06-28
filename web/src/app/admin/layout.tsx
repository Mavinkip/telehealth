import { Navbar } from '@/components/Navbar';
import { requireProfile } from '@/lib/auth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile(['admin']);
  return (
    <>
      <Navbar role="admin" userName={profile.full_name} />
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </>
  );
}
