import { createClient } from '@/lib/supabase/server';
import { requireProfile } from '@/lib/auth';
import { Card, PageHeader } from '@/components/ui';

export default async function PatientRecordsPage() {
  const { user } = await requireProfile(['patient']);
  const supabase = await createClient();

  const { data: records } = await supabase
    .from('medical_records')
    .select(`
      *,
      doctor:profiles!medical_records_doctor_id_fkey(full_name, specialty),
      prescriptions(*)
    `)
    .eq('patient_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <>
      <PageHeader title="Medical Records" />
      {records?.length ? records.map((record) => (
        <Card key={record.id} title={`${record.doctor?.full_name} — ${record.doctor?.specialty}`} className="mb-4">
          <p className="text-sm text-slate-500">{new Date(record.created_at).toLocaleString()}</p>
          <h4 className="mt-3 font-medium">SOAP Notes</h4>
          <p className="mt-1 text-slate-700">{record.soap_notes || 'No notes'}</p>
          {record.prescriptions?.length > 0 && (
            <>
              <h4 className="mt-4 font-medium">Prescriptions</h4>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {record.prescriptions.map((rx: { id: string; medication: string; dosage: string; instructions: string | null }) => (
                  <li key={rx.id}>
                    <strong>{rx.medication}</strong> — {rx.dosage}
                    {rx.instructions && <span className="text-slate-500"> ({rx.instructions})</span>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      )) : (
        <Card><p className="text-slate-500">No medical records found.</p></Card>
      )}
    </>
  );
}
