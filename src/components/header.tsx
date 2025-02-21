'use client'
import { Bell, User2, LogOut } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SignOutLink } from "@/app/providers/components/sign-out-link-construct-v2"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/app/providers/hooks/useAuth"


import type { UserStatus, TernSecureUser} from "@/app/providers/utils/types"
import type { PresenceUpdate} from "@/app/providers/utils/socket"
import { usePresence } from "@/app/providers/hooks/usePresence"

interface HeaderProps {
  userData: TernSecureUser;
  userStatus: UserStatus;
}


export function Header() {
  const { user } = useAuth();
  const { updatePresence, presenceUpdates } = usePresence();

  console.log('All presenceUpdates:', presenceUpdates); // Debug log
  console.log('Current user ID:', user?.uid); 

  const currentUserPresence = presenceUpdates.find(
    (update: PresenceUpdate) => update.clientId === user?.uid
  )?.presence;

  console.log('Found currentUserPresence:', currentUserPresence);


  return (
    <div className="flex h-full items-center justify-between px-4">
      <div className="flex-1" />
      <div className="flex items-center gap-10">
      <div className="flex items-center gap-4">
        <button className="rounded-full p-2 hover:bg-accent">
          <Bell className="h-5 w-5" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg hover:bg-accent px-2 py-1">
            <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.photoURL || ''} />
              <AvatarFallback>{user?.email ? user.email[0].toUpperCase() : 'U'}</AvatarFallback>
            </Avatar>
            <span 
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                currentUserPresence?.status === 'online' ? 'bg-green-500' : 
                currentUserPresence?.status === 'busy' ? 'bg-red-500' : 
                currentUserPresence?.status === 'away' ? 'bg-yellow-500' :
                currentUserPresence?.status === 'offline' ? 'bg-gray-400' :
                'bg-slate-300' // for 'unknown' status
              }`}
            />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
            <DropdownMenuItem onClick={() => updatePresence('online')}>
            <div className="h-2 w-2 rounded-full bg-green-500 mr-2" />
            Online
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updatePresence('busy')}>
            <div className="h-2 w-2 rounded-full bg-red-500 mr-2" />
            Do not disturb
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updatePresence('away')}>
            <div className="h-2 w-2 rounded-full bg-yellow-500 mr-2" />
            Away
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => updatePresence('offline')}>
            <div className="h-2 w-2 rounded-full bg-gray-400 mr-2" />
            Offline
          </DropdownMenuItem>
              <DropdownMenuItem>
                <User2 className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <SignOutLink />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

