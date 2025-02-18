import { SocketProvider } from '@/app/providers/internal/SocketProvider';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SocketProvider>
      {children}
    </SocketProvider>
  );
}