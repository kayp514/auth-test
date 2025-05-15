import { SocketProvider } from '@/app/providers/internal/SocketProvider'
import { createSocketConfig } from '../providers/utils/socketSessionConfig'
import { auth } from '@/app/providers/server/auth'
import { Inter } from 'next/font/google'
import { Toaster } from "@/components/ui/sonner"

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

  const socketConfig = createSocketConfig(
    user?.uid || "", 
    API_KEY ?? 'fake_undeployed_key',
    { 
      storageType: 'localStorage',
      storageKey: 'app_socket_session'
    }
  );
  

  if (!user) return null;  

  return (
    <div className={`${inter.variable} font-sans antialiased`}>
    <SocketProvider config={socketConfig}>
      {children}
    </SocketProvider>
    </div>
  );
}