import { SocketProvider } from '@/app/providers/internal/SocketProvider';
import { useAuth } from '@/app/providers/hooks/useAuth';
import { Header } from '@/components/header'

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const  { user }  = useAuth();

  if (!user) return null;  

  return (
    <SocketProvider
    clientId={user?.uid || ""}
    apiKey="testapikey">
      {children}
      <Header userData={user} />
    </SocketProvider>
  );
}