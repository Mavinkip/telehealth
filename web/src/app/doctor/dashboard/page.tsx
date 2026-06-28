import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { Card, PageHeader, StatCard } from '@/components/ui';

export default async function DoctorDashboard() {
  const { user, profile } = await requireProfile(['doctor']);
  const supabase = await createClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const thisMonth = new Date();
  thisMonth.setDate(1);

  const [{ data: todayAppts }, { count: totalAppts }, { count: completed }] = await Promise.all([
    supabase
      .from('appointments')
      .select('*, patient:profiles!appointments_patient_id_fkey(full_name)')
      .eq('doctor_id', user.id)
      .eq('status', 'scheduled')
      .gte('scheduled_at', today.toISOString())
      .lt('scheduled_at', tomorrow.toISOString())
      .order('scheduled_at'),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('doctor_id', user.id),
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('doctor_id', user.id)
      .eq('status', 'completed')
      .gte('scheduled_at', thisMonth.toISOString()),
  ]);

  return (
    <>
      <PageHeader title="Doctor Dashboard" subtitle={`Welcome, Dr. ${profile.full_name}`} />
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard icon="📅" value={todayAppts?.length ?? 0} label="Today's Appointments" />
        <StatCard icon="👥" value={totalAppts ?? 0} label="Total Appointments" />
        <StatCard icon="✅" value={completed ?? 0} label="Completed This Month" />
      </div>
      <Card title="Today's Schedule">
        {todayAppts?.length ? todayAppts.map((apt) => (
          <div key={apt.id} className="mb-3 flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <div>
              <p className="font-medium">{apt.patient?.full_name}</p>
              <p className="text-sm text-slate-500">{new Date(apt.scheduled_at).toLocaleTimeString()}</p>
            </div>
            <div className="flex gap-2">
              <Link href={`/video/${apt.id}`} className="rounded bg-primary px-3 py-1 text-xs text-white">Start Call</Link>
              <Link href={`/doctor/appointments?consult=${apt.id}`} className="rounded bg-slate-600 px-3 py-1 text-xs text-white">Consult</Link>
            </div>
          </div>
        )) : <p className="text-slate-500">No appointments today</p>}
      </Card>
    </>
  );
}
