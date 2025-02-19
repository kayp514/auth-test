import { SocketProvider } from '@/app/providers/internal/SocketProvider';
import { auth } from '@/app/providers/server/auth';

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const  { user } = await auth();
  console.log(user?.uid);

  return (
    <SocketProvider
    clientId={user?.uid || ""}
    apiKey="testapikey">
      {children}
    </SocketProvider>
  );
}