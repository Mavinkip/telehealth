import { redirect } from 'next/navigation';
import { getSessionProfile, dashboardPath } from '@/lib/auth';

export default async function HomePage() {
  const session = await getSessionProfile();
  if (session) redirect(dashboardPath(session.profile.role));
  redirect('/login');
}
