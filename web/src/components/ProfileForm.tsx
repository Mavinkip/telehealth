'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/lib/types';
import { Card } from '@/components/ui';

export function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone: phone || null })
      .eq('id', profile.id);

    setLoading(false);
    setMessage(error ? error.message : 'Profile updated!');
    if (!error) router.refresh();
  }

  return (
    <Card className="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {message && (
          <p className={`text-sm ${message.includes('updated') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
        <div>
          <label className="text-sm font-medium">Full Name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input value={profile.email} disabled className="mt-1 w-full rounded-lg border bg-slate-50 px-3 py-2" />
        </div>
        <div>
          <label className="text-sm font-medium">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </div>
        {profile.specialty && (
          <div>
            <label className="text-sm font-medium">Specialty</label>
            <input value={profile.specialty} disabled className="mt-1 w-full rounded-lg border bg-slate-50 px-3 py-2" />
          </div>
        )}
        <button type="submit" disabled={loading} className="rounded-lg bg-primary px-4 py-2 text-white">
          {loading ? 'Saving...' : 'Update Profile'}
        </button>
      </form>
    </Card>
  );
}
