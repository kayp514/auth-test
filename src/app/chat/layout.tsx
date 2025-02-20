import { SocketProvider } from '@/app/providers/internal/SocketProvider';
import { auth } from '@/app/providers/server/auth';
import { Header } from '@/components/header'

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const  { user }  = await auth();

  if (!user) return null;  

  return (
    <SocketProvider
    clientId={user?.uid || ""}
    apiKey="testapikey">
      {children}
      <Header />
    </SocketProvider>
  );
}