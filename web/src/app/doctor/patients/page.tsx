import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { Card, PageHeader } from '@/components/ui';

export default async function DoctorPatientsPage() {
  const { user } = await requireProfile(['doctor']);
  const supabase = await createClient();

  const { data: appointments } = await supabase
    .from('appointments')
    .select('patient_id, patient:profiles!appointments_patient_id_fkey(id, full_name, email, phone)')
    .eq('doctor_id', user.id);

  const uniquePatients = new Map<string, { id: string; full_name: string; email: string; phone: string | null }>();
  appointments?.forEach((apt) => {
    const patient = Array.isArray(apt.patient) ? apt.patient[0] : apt.patient;
    if (patient && !uniquePatients.has(apt.patient_id)) {
      uniquePatients.set(apt.patient_id, patient);
    }
  });

  return (
    <>
      <PageHeader title="My Patients" />
      <Card>
        {uniquePatients.size ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Email</th>
                  <th className="pb-2">Phone</th>
                </tr>
              </thead>
              <tbody>
                {[...uniquePatients.values()].map((p) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">{p.full_name}</td>
                    <td className="py-3 pr-4">{p.email}</td>
                    <td className="py-3">{p.phone ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-slate-500">No patients yet.</p>
        )}
      </Card>
    </>
  );
}
