import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { Card, PageHeader } from '@/components/ui';

export default async function AdminUsersPage() {
  await requireProfile(['admin']);
  const supabase = await createClient();

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <>
      <PageHeader title="Users" />
      <Card>
        {users?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2 pr-4">Role</th>
                  <th className="pb-2">Specialty</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">{u.full_name}</td>
                    <td className="py-3 pr-4">{u.email}</td>
                    <td className="py-3 pr-4 capitalize">{u.role}</td>
                    <td className="py-3">{u.specialty ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500">No users found.</p>
        )}
      </Card>
    </>
  );
}
