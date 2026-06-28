import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { Card, PageHeader, StatusBadge } from '@/components/ui';
import { ConsultationForm } from './ConsultationForm';

export default async function DoctorAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ consult?: string }>;
}) {
  const { user } = await requireProfile(['doctor']);
  const { consult } = await searchParams;
  const supabase = await createClient();

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*, patient:profiles!appointments_patient_id_fkey(full_name, email)')
    .eq('doctor_id', user.id)
    .order('scheduled_at', { ascending: false });

  const consultAppt = consult ? appointments?.find((a) => a.id === consult) : null;

  return (
    <>
      <PageHeader title="Appointments" />
      {consultAppt && (
        <ConsultationForm
          appointmentId={consultAppt.id}
          patientId={consultAppt.patient_id}
          doctorId={user.id}
          patientName={consultAppt.patient?.full_name ?? 'Patient'}
        />
      )}
      <Card className={consultAppt ? 'mt-6' : ''}>
        {appointments?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="pb-2 pr-4">Patient</th>
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">{apt.patient?.full_name}</td>
                    <td className="py-3 pr-4">{new Date(apt.scheduled_at).toLocaleString()}</td>
                    <td className="py-3 pr-4"><StatusBadge status={apt.status} /></td>
                    <td className="py-3">
                      {apt.status === 'scheduled' && (
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/video/${apt.id}`} className="rounded bg-primary px-2 py-1 text-xs text-white">Call</Link>
                          <Link href={`/doctor/appointments?consult=${apt.id}`} className="rounded bg-slate-600 px-2 py-1 text-xs text-white">Consult</Link>
                          <Link href={`/chat?appointment=${apt.id}`} className="rounded bg-slate-500 px-2 py-1 text-xs text-white">Chat</Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500">No appointments.</p>
        )}
      </Card>
    </>
  );
}
