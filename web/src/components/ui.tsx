export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-secondary">{title}</h1>
      {subtitle && <p className="mt-1 text-slate-500">{subtitle}</p>}
    </div>
  );
}

export function Card({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-xl bg-white shadow-sm ${className}`}>
      {title && (
        <div className="bg-primary px-4 py-3 text-white">
          <h2 className="font-semibold">{title}</h2>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

export function StatCard({
  icon,
  value,
  label,
  href,
}: {
  icon: string;
  value: string | number;
  label: string;
  href?: string;
}) {
  const content = (
    <div className="rounded-xl bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="text-3xl">{icon}</div>
      <div className="mt-2 text-2xl font-bold text-secondary">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }
  return content;
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    scheduled: 'bg-green-100 text-green-800',
    completed: 'bg-slate-100 text-slate-700',
    cancelled: 'bg-red-100 text-red-800',
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-slate-100'}`}>
      {status}
    </span>
  );
}
