import Link from 'next/link';
import { LogoutButton } from '@/components/LogoutButton';
import type { UserRole } from '@/lib/types';

const navItems: Record<UserRole, { href: string; label: string }[]> = {
  patient: [
    { href: '/patient/dashboard', label: 'Dashboard' },
    { href: '/patient/appointments', label: 'Appointments' },
    { href: '/patient/records', label: 'Records' },
    { href: '/chat', label: 'Messages' },
    { href: '/patient/profile', label: 'Profile' },
  ],
  doctor: [
    { href: '/doctor/dashboard', label: 'Dashboard' },
    { href: '/doctor/appointments', label: 'Appointments' },
    { href: '/doctor/patients', label: 'Patients' },
    { href: '/chat', label: 'Messages' },
    { href: '/doctor/profile', label: 'Profile' },
  ],
  admin: [
    { href: '/admin/dashboard', label: 'Dashboard' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/appointments', label: 'Appointments' },
  ],
};

export function Navbar({
  role,
  userName,
}: {
  role: UserRole;
  userName: string;
}) {
  const items = navItems[role];
  const prefix = role === 'doctor' ? 'Dr. ' : '';

  return (
    <nav className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href={`/${role}/dashboard`} className="text-lg font-bold text-primary">
          Telehealth
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-secondary hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-slate-600 sm:inline">
            {prefix}{userName}
          </span>
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
}
