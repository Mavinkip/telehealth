import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Telehealth Communication System',
  description: 'Book appointments, chat, and video consultations',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
