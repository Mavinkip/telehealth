import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { Card, PageHeader, StatusBadge } from '@/components/ui';

export default async function AdminAppointmentsPage() {
  await requireProfile(['admin']);
  const supabase = await createClient();

  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      *,
      patient:profiles!appointments_patient_id_fkey(full_name),
      doctor:profiles!appointments_doctor_id_fkey(full_name, specialty)
    `)
    .order('scheduled_at', { ascending: false });

  return (
    <>
      <PageHeader title="All Appointments" />
      <Card>
        {appointments?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="pb-2 pr-4">Patient</th>
                  <th className="pb-2 pr-4">Doctor</th>
                  <th className="pb-2 pr-4">Date</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => (
                  <tr key={apt.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">{apt.patient?.full_name}</td>
                    <td className="py-3 pr-4">{apt.doctor?.full_name}</td>
                    <td className="py-3 pr-4">{new Date(apt.scheduled_at).toLocaleString()}</td>
                    <td className="py-3"><StatusBadge status={apt.status} /></td>
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
