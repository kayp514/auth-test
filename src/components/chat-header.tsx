import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { User } from '@/lib/db/types'
import { usePresence } from "@/app/providers/hooks/usePresence"

interface ChatHeaderProps {
  selectedUser: User | null
}

export function ChatHeader({ selectedUser }: ChatHeaderProps) {
  const { presenceUpdates } = usePresence()

  if (!selectedUser) {
    return (
      <div className="px-6 py-4 border-b">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Select a conversation
        </h2>
      </div>
    )
  }

  const userPresence = presenceUpdates.find(
    update => update.clientId === selectedUser.uid
  )?.presence

  return (
    <div className="px-6 py-4 border-b">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Avatar>
            <AvatarImage src={selectedUser.avatar} />
            <AvatarFallback>{selectedUser.name[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <span 
            className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background ${
              userPresence?.status === 'online' ? 'bg-green-500' : 
              userPresence?.status === 'busy' ? 'bg-red-500' : 
              userPresence?.status === 'away' ? 'bg-yellow-500' :
              userPresence?.status === 'offline' ? 'bg-gray-400' :
              'bg-slate-300'
            }`}
          />
        </div>
        <div>
          <h2 className="text-sm font-semibold">{selectedUser.name}</h2>
          <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
        </div>
      </div>
    </div>
  )
}