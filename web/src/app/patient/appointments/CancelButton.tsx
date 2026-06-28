'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function CancelButton({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();

  async function handleCancel() {
    if (!confirm('Cancel this appointment?')) return;
    const supabase = createClient();
    await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', appointmentId);
    router.refresh();
  }

  return (
    <button onClick={handleCancel} className="rounded bg-red-500 px-2 py-1 text-xs text-white">
      Cancel
    </button>
  );
}
