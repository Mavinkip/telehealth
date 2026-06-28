'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui';

export function ConsultationForm({
  appointmentId,
  patientId,
  doctorId,
  patientName,
}: {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  patientName: string;
}) {
  const router = useRouter();
  const [soapNotes, setSoapNotes] = useState('');
  const [medication, setMedication] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [markComplete, setMarkComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    const { error: recordError } = await supabase.from('medical_records').insert({
      patient_id: patientId,
      doctor_id: doctorId,
      appointment_id: appointmentId,
      soap_notes: soapNotes,
    });

    if (recordError) {
      alert(recordError.message);
      setLoading(false);
      return;
    }

    if (medication && dosage) {
      await supabase.from('prescriptions').insert({
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_id: appointmentId,
        medication,
        dosage,
        instructions: instructions || null,
      });
    }

    if (markComplete) {
      await supabase.from('appointments').update({ status: 'completed' }).eq('id', appointmentId);
    }

    setLoading(false);
    router.push('/doctor/appointments');
    router.refresh();
  }

  return (
    <Card title={`Consultation — ${patientName}`}>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="text-sm font-medium">SOAP Notes</label>
          <textarea
            required
            value={soapNotes}
            onChange={(e) => setSoapNotes(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
            rows={5}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <input placeholder="Medication" value={medication} onChange={(e) => setMedication(e.target.value)} className="rounded-lg border px-3 py-2" />
          <input placeholder="Dosage" value={dosage} onChange={(e) => setDosage(e.target.value)} className="rounded-lg border px-3 py-2" />
          <input placeholder="Instructions" value={instructions} onChange={(e) => setInstructions(e.target.value)} className="rounded-lg border px-3 py-2" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={markComplete} onChange={(e) => setMarkComplete(e.target.checked)} />
          Mark appointment as completed
        </label>
        <button type="submit" disabled={loading} className="rounded-lg bg-primary px-4 py-2 text-white">
          {loading ? 'Saving...' : 'Save Consultation'}
        </button>
      </form>
    </Card>
  );
}
