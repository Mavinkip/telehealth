import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { Card, PageHeader, StatCard } from '@/components/ui';

export default async function PatientDashboard() {
  const { user } = await requireProfile(['patient']);
  const supabase = await createClient();

  const { data: upcoming } = await supabase
    .from('appointments')
    .select('*, doctor:profiles!appointments_doctor_id_fkey(full_name, specialty)')
    .eq('patient_id', user.id)
    .eq('status', 'scheduled')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at')
    .limit(3);

  const { data: records } = await supabase
    .from('medical_records')
    .select('*, doctor:profiles!medical_records_doctor_id_fkey(full_name)')
    .eq('patient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3);

  return (
    <>
      <PageHeader title="Patient Dashboard" subtitle="Welcome to your telehealth portal" />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon="📅" value="Book" label="Schedule a consultation" href="/patient/appointments" />
        <StatCard icon="📋" value="Records" label="View health history" href="/patient/records" />
        <StatCard icon="💬" value="Chat" label="Message your doctor" href="/chat" />
        <StatCard icon="👤" value="Profile" label="Manage account" href="/patient/profile" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Upcoming Appointments">
          {upcoming?.length ? upcoming.map((apt) => (
            <div key={apt.id} className="mb-3 rounded-lg border-l-4 border-primary bg-slate-50 p-3">
              <p className="font-medium">{apt.doctor?.full_name} — {apt.doctor?.specialty}</p>
              <p className="text-sm text-slate-500">{new Date(apt.scheduled_at).toLocaleString()}</p>
              <div className="mt-2 flex gap-2">
                <Link href={`/video/${apt.id}`} className="rounded bg-primary px-3 py-1 text-xs text-white">Video</Link>
                <Link href={`/chat?appointment=${apt.id}`} className="rounded bg-slate-600 px-3 py-1 text-xs text-white">Chat</Link>
              </div>
            </div>
          )) : <p className="text-slate-500">No upcoming appointments</p>}
        </Card>
        <Card title="Recent Medical Records">
          {records?.length ? records.map((r) => (
            <div key={r.id} className="mb-3 rounded-lg bg-slate-50 p-3">
              <p className="font-medium">{r.doctor?.full_name}</p>
              <p className="text-sm text-slate-500">{new Date(r.created_at).toLocaleDateString()}</p>
              <p className="mt-1 text-sm text-slate-600">{r.soap_notes?.slice(0, 100)}...</p>
            </div>
          )) : <p className="text-slate-500">No recent records</p>}
        </Card>
      </div>
    </>
  );
}
