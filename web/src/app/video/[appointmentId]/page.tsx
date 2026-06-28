'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface JitsiApi {
  dispose: () => void;
  executeCommand: (cmd: string) => void;
  addEventListeners: (events: Record<string, () => void>) => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: new (domain: string, options: Record<string, unknown>) => JitsiApi;
  }
}

export default function VideoPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const jitsiRef = useRef<JitsiApi | null>(null);
  const [roomId, setRoomId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [role, setRole] = useState('patient');

  useEffect(() => {
    async function init() {
      const { appointmentId } = await params;
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const [{ data: profile }, { data: appointment }] = await Promise.all([
        supabase.from('profiles').select('full_name, role').eq('id', user.id).single(),
        supabase.from('appointments').select('jitsi_room_id').eq('id', appointmentId).single(),
      ]);

      if (!appointment?.jitsi_room_id) {
        setError('Appointment not found');
        return;
      }

      setRoomId(appointment.jitsi_room_id);
      setDisplayName(profile?.full_name ?? 'User');
      setRole(profile?.role ?? 'patient');

      if (!window.JitsiMeetExternalAPI) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://meet.jit.si/external_api.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load Jitsi'));
          document.head.appendChild(script);
        });
      }

      if (containerRef.current && window.JitsiMeetExternalAPI) {
        jitsiRef.current = new window.JitsiMeetExternalAPI('meet.jit.si', {
          roomName: appointment.jitsi_room_id,
          width: '100%',
          height: '100%',
          parentNode: containerRef.current,
          userInfo: { displayName: profile?.full_name ?? 'User' },
          configOverwrite: {
            prejoinPageEnabled: false,
            startWithAudioMuted: false,
            startWithVideoMuted: false,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
          },
        });

        jitsiRef.current.addEventListeners({
          readyToClose: () => handleClose(profile?.role ?? 'patient'),
          videoConferenceLeft: () => handleClose(profile?.role ?? 'patient'),
        });
      }
    }

    init();
    return () => { jitsiRef.current?.dispose(); };
  }, [params, router]);

  function handleClose(userRole: string) {
    jitsiRef.current?.dispose();
    router.push(`/${userRole}/dashboard`);
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <Link href={`/${role}/dashboard`} className="mt-4 text-primary">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <nav className="border-b bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="font-bold text-primary">Video Consultation</span>
          <div className="flex gap-3">
            <button
              onClick={() => jitsiRef.current?.executeCommand('hangup')}
              className="rounded-lg bg-red-500 px-3 py-1.5 text-sm text-white"
            >
              End Call
            </button>
            <Link href={`/${role}/dashboard`} className="rounded-lg border px-3 py-1.5 text-sm">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>
      <div className="mx-auto w-full max-w-6xl flex-1 p-4">
        <div className="mb-3 rounded-lg bg-blue-50 p-3 text-sm">
          <strong>Room:</strong> {roomId} · <strong>Participant:</strong> {displayName}
        </div>
        <div ref={containerRef} className="h-[calc(100vh-180px)] min-h-[400px] overflow-hidden rounded-xl bg-black" />
      </div>
    </div>
  );
}
