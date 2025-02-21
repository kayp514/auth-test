import { SocketProvider } from '@/app/providers/internal/SocketProvider';
import { auth } from '@/app/providers/server/auth';
import { Inter } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const API_KEY = process.env.TERNSECURE_REALTIME_KEY

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const  { user }  = await auth();

  if (!user) return null;  

  return (
    <div className={`${inter.variable} font-sans antialiased`}>
    <SocketProvider
    clientId={user?.uid || ""}
    apiKey={API_KEY ?? ''}>
      {children}
    </SocketProvider>
    </div>
  );
}