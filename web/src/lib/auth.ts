import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Profile, UserRole } from '@/lib/types';
import { dashboardPath } from '@/lib/utils';

export { dashboardPath };

export async function getSessionProfile(): Promise<{
  user: { id: string; email?: string };
  profile: Profile;
} | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) return null;
  return { user: { id: user.id, email: user.email }, profile: profile as Profile };
}

export async function requireProfile(allowedRoles?: UserRole[]) {
  const session = await getSessionProfile();
  if (!session) redirect('/login');
  if (allowedRoles && !allowedRoles.includes(session.profile.role)) {
    redirect(`/${session.profile.role}/dashboard`);
  }
  return session;
}

export async function logActivity(userId: string, action: string, details: string) {
  const supabase = await createClient();
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action,
    details,
    timestamp: new Date().toISOString(),
  });
}
