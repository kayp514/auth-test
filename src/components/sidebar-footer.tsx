'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronUp, LogOut } from "lucide-react"
import { SignOutLink } from "@/app/providers/components/sign-out-link-construct-v2"
import { useAuth } from "@/app/providers/hooks/useAuth"
import { usePresence } from "@/app/providers/hooks/usePresence"
import type { PresenceUpdate, UserStatus } from "@/app/providers/utils/socket"

interface PresenceStatusConfig {
  status: UserStatus
  label: string
  color: string
}

const PRESENCE_STATUSES: PresenceStatusConfig[] = [
  { status: 'online', label: 'Online', color: 'bg-green-500' },
  { status: 'busy', label: 'Do not disturb', color: 'bg-red-500' },
  { status: 'away', label: 'Away', color: 'bg-yellow-500' },
  { status: 'offline', label: 'Offline', color: 'bg-gray-400' }
]

export function SidebarFooter() {
  const { user } = useAuth()
  const { updatePresence, presenceUpdates } = usePresence();
  

  const currentUserPresence = presenceUpdates.find(
    (update: PresenceUpdate) => update.clientId === user?.uid
  )?.presence;

  if (!user) return null

  return (
    <div className="p-4 border-t mt-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.photoURL || ''} />
              <AvatarFallback>
                {user.email ? user.email[0].toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
            <span 
              className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                currentUserPresence?.status === 'online' ? 'bg-green-500' : 
                currentUserPresence?.status === 'busy' ? 'bg-red-500' : 
                currentUserPresence?.status === 'away' ? 'bg-yellow-500' :
                currentUserPresence?.status === 'offline' ? 'bg-gray-400' :
                'bg-slate-300'
              }`} 
            />
          </div>
          <div className="flex flex-col space-y-0.5">
            <span className="text-base font-semibold leading-none">
              {user.displayName || ''}
            </span>
            <span className="text-sm text-muted-foreground">
              {user.email || ''}
            </span>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <ChevronUp className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {PRESENCE_STATUSES.map(({ status, label, color }) => (
              <DropdownMenuItem 
                key={status}
                onClick={() => updatePresence(status)}
              >
                <div className={`h-2 w-2 rounded-full ${color} mr-2`} />
                {label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <LogOut className="h-4 w-4 mr-2" />
              <SignOutLink />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}