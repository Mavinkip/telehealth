'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Message, Profile, UserRole } from '@/lib/types';
import { LogoutButton } from '@/components/LogoutButton';

interface Conversation {
  id: string;
  partner: { id: string; full_name: string; specialty?: string };
}

export default function ChatClient() {
  const searchParams = useSearchParams();
  const initialAppointment = searchParams.get('appointment');

  const [profile, setProfile] = useState<Profile | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialAppointment);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const selectConversation = useCallback(async (appointmentId: string, pId: string, pName: string) => {
    setSelectedId(appointmentId);
    setPartnerId(pId);
    setPartnerName(pName);

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('sent_at');

    setMessages((data as Message[]) ?? []);
  }, [supabase]);

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (data) setProfile(data as Profile);
  }, [supabase]);

  const loadConversations = useCallback(async (role: UserRole, userId: string) => {
    const query = role === 'patient'
      ? supabase.from('appointments').select('id, doctor:profiles!appointments_doctor_id_fkey(id, full_name, specialty)').eq('patient_id', userId)
      : supabase.from('appointments').select('id, patient:profiles!appointments_patient_id_fkey(id, full_name)').eq('doctor_id', userId);

    const { data } = await query;
    if (!data) return;

    const convs: Conversation[] = data.map((row) => {
      const r = row as Record<string, unknown>;
      const partner = role === 'patient'
        ? (r.doctor as { id: string; full_name: string; specialty: string })
        : (r.patient as { id: string; full_name: string });
      return { id: r.id as string, partner };
    });
    setConversations(convs);

    if (initialAppointment) {
      const match = convs.find((c) => c.id === initialAppointment);
      if (match) await selectConversation(match.id, match.partner.id, match.partner.full_name);
    }
  }, [supabase, initialAppointment, selectConversation]);

  useEffect(() => {
    loadProfile().then(() => setLoading(false));
  }, [loadProfile]);

  useEffect(() => {
    if (profile) loadConversations(profile.role, profile.id);
  }, [profile, loadConversations]);

  useEffect(() => {
    if (!selectedId) return;

    const channel = supabase
      .channel(`messages:${selectedId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `appointment_id=eq.${selectedId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedId, supabase]);

  async function sendMessage() {
    if (!input.trim() || !selectedId || !partnerId || !profile) return;

    await supabase.from('messages').insert({
      sender_id: profile.id,
      receiver_id: partnerId,
      appointment_id: selectedId,
      content: input.trim(),
    });
    setInput('');
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">Loading chat...</div>;
  }

  const dashPath = profile ? `/${profile.role}/dashboard` : '/login';

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href={dashPath} className="font-bold text-primary">← Dashboard</Link>
          <div className="flex items-center gap-3">
            <span className="text-sm">{profile?.full_name}</span>
            <LogoutButton />
          </div>
        </div>
      </nav>
      <div className="mx-auto grid max-w-6xl gap-4 p-4 lg:grid-cols-3">
        <div className="rounded-xl bg-white shadow-sm">
          <div className="border-b bg-primary px-4 py-3 font-semibold text-white">Conversations</div>
          <div className="max-h-[500px] overflow-y-auto">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => selectConversation(c.id, c.partner.id, c.partner.full_name)}
                className={`w-full border-b p-3 text-left hover:bg-slate-50 ${selectedId === c.id ? 'bg-slate-100' : ''}`}
              >
                <p className="font-medium">{c.partner.full_name}</p>
                <p className="text-xs text-slate-500">{c.partner.specialty ?? 'Patient'}</p>
              </button>
            ))}
            {!conversations.length && <p className="p-4 text-slate-500">No conversations</p>}
          </div>
        </div>
        <div className="rounded-xl bg-white shadow-sm lg:col-span-2">
          <div className="border-b bg-primary px-4 py-3 font-semibold text-white">
            {partnerName || 'Select a conversation'}
          </div>
          <div className="flex h-[400px] flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`mb-2 max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.sender_id === profile?.id
                      ? 'ml-auto bg-primary text-white'
                      : 'bg-slate-100 text-secondary'
                  }`}
                >
                  {msg.content}
                  <div className="mt-1 text-xs opacity-70">
                    {new Date(msg.sent_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
            {selectedId && (
              <div className="flex gap-2 border-t p-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg border px-3 py-2 text-sm"
                />
                <button onClick={sendMessage} className="rounded-lg bg-primary px-4 py-2 text-sm text-white">
                  Send
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
