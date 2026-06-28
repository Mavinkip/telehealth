import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { Card, PageHeader, StatCard } from '@/components/ui';

export default async function AdminDashboard() {
  await requireProfile(['admin']);
  const supabase = await createClient();

  const [
    { count: patients },
    { count: doctors },
    { count: appointments },
    { count: completed },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'doctor'),
    supabase.from('appointments').select('*', { count: 'exact', head: true }),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
  ]);

  return (
    <>
      <PageHeader title="Admin Dashboard" subtitle="System overview" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon="🧑" value={patients ?? 0} label="Patients" />
        <StatCard icon="👨‍⚕️" value={doctors ?? 0} label="Doctors" />
        <StatCard icon="📅" value={appointments ?? 0} label="Appointments" />
        <StatCard icon="✅" value={completed ?? 0} label="Completed" />
      </div>
      <Card title="System Status" className="mt-6">
        <p className="text-green-600">All systems operational</p>
      </Card>
    </>
  );
}
