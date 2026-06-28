import { Suspense } from 'react';
import ChatClient from './ChatClient';

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <ChatClient />
    </Suspense>
  );
}
