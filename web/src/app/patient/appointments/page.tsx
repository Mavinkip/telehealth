import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { Card, PageHeader, StatusBadge } from '@/components/ui';
import { BookAppointmentForm } from './BookAppointmentForm';
import { CancelButton } from './CancelButton';

export default async function PatientAppointmentsPage() {
  const { user } = await requireProfile(['patient']);
  const supabase = await createClient();

  const [{ data: appointments }, { data: doctors }] = await Promise.all([
    supabase
      .from('appointments')
      .select('*, doctor:profiles!appointments_doctor_id_fkey(full_name, specialty)')
      .eq('patient_id', user.id)
      .order('scheduled_at', { ascending: false }),
    supabase.from('profiles').select('*').eq('role', 'doctor'),
  ]);

  return (
    <>
      <PageHeader title="My Appointments" />
      <BookAppointmentForm doctors={doctors ?? []} patientId={user.id} />
      <Card className="mt-6">
        {appointments?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="pb-2 pr-4">Doctor</th>
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">
                      <div>{apt.doctor?.full_name}</div>
                      <div className="text-xs text-slate-500">{apt.doctor?.specialty}</div>
                    </td>
                    <td className="py-3 pr-4">{new Date(apt.scheduled_at).toLocaleString()}</td>
                    <td className="py-3 pr-4"><StatusBadge status={apt.status} /></td>
                    <td className="py-3">
                      {apt.status === 'scheduled' && (
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/video/${apt.id}`} className="rounded bg-primary px-2 py-1 text-xs text-white">Video</Link>
                          <Link href={`/chat?appointment=${apt.id}`} className="rounded bg-slate-600 px-2 py-1 text-xs text-white">Chat</Link>
                          <CancelButton appointmentId={apt.id} />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500">No appointments yet.</p>
        )}
      </Card>
    </>
  );
}
