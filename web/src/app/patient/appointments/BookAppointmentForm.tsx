'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';

export function BookAppointmentForm({
  doctors,
  patientId,
}: {
  doctors: Profile[];
  patientId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [doctorId, setDoctorId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleBook(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const jitsiRoomId = `telehealth-${patientId}-${doctorId}-${Date.now()}`;

    const { error } = await supabase.from('appointments').insert({
      patient_id: patientId,
      doctor_id: doctorId,
      scheduled_at: new Date(scheduledAt).toISOString(),
      status: 'scheduled',
      jitsi_room_id: jitsiRoomId,
      notes: notes || null,
    });

    setLoading(false);
    if (!error) {
      setOpen(false);
      router.refresh();
    } else {
      alert(error.message);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark"
      >
        Book New Appointment
      </button>
    );
  }

  return (
    <form onSubmit={handleBook} className="rounded-xl bg-white p-4 shadow-sm">
      <h3 className="mb-3 font-semibold">Book Appointment</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <select
          required
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
          className="rounded-lg border px-3 py-2"
        >
          <option value="">Select doctor</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>{d.full_name} — {d.specialty}</option>
          ))}
        </select>
        <input
          type="datetime-local"
          required
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="rounded-lg border px-3 py-2"
        />
        <textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-lg border px-3 py-2 sm:col-span-2"
          rows={2}
        />
      </div>
      <div className="mt-3 flex gap-2">
        <button type="submit" disabled={loading} className="rounded-lg bg-primary px-4 py-2 text-sm text-white">
          {loading ? 'Booking...' : 'Confirm'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border px-4 py-2 text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}
