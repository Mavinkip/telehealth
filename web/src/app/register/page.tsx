'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const SPECIALTIES = [
  'General Practice', 'Cardiology', 'Dermatology', 'Pediatrics',
  'Orthopedics', 'Neurology', 'Psychiatry',
];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    role: '', phone: '', specialty: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.fullName, role: form.role } },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: form.fullName,
        email: form.email,
        role: form.role,
        phone: form.phone || null,
        specialty: form.role === 'doctor' ? form.specialty : null,
      });
    }

    router.push('/login');
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-primary">Create Account</h1>
          <p className="mt-1 text-slate-500">Join the Telehealth System</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          <input
            placeholder="Full Name"
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
          />
          <input
            type="email"
            placeholder="Email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
          />
          <input
            type="password"
            placeholder="Password (min 6 chars)"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            required
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
          />
          <select
            required
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
          >
            <option value="">Select role</option>
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
          </select>
          {form.role === 'doctor' && (
            <select
              required
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
            >
              <option value="">Select specialty</option>
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
          <input
            type="tel"
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2.5 font-medium text-white hover:bg-primary-dark disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
