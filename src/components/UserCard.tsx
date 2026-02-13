import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChatCircle } from '@phosphor-icons/react'
import type { UserProfile } from '@/lib/types'

interface UserCardProps {
  user: UserProfile
  distance: string
  canMessage?: boolean
  onMessage: () => void
  onViewProfile?: () => void
}

export function UserCard({ user, distance, canMessage = true, onMessage, onViewProfile }: UserCardProps) {
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()

  return (
    <Card className="p-5 hover:shadow-xl hover:border-primary/30 transition-all duration-300 group">
      <div className="flex items-start gap-4">
        <Avatar 
          className="w-16 h-16 border-2 border-primary/20 cursor-pointer group-hover:scale-105 group-hover:border-primary/40 transition-all duration-300 shadow-sm"
          onClick={onViewProfile}
        >
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold text-lg">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 
                className="font-semibold text-lg text-foreground cursor-pointer hover:text-primary transition-colors leading-tight"
                onClick={onViewProfile}
              >
                {user.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{user.age} • {user.gender}</p>
            </div>
            {user.isActive && (
              <Badge variant="secondary" className="bg-accent/20 text-accent-foreground border-accent/30 shadow-sm">
                Active
              </Badge>
            )}
          </div>
          
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs shadow-sm">
              📍 {distance}
            </Badge>
            {!canMessage && (
              <Badge variant="secondary" className="text-xs bg-muted/80">
                Not a match
              </Badge>
            )}
          </div>
          
          <Button
            onClick={onMessage}
            className="mt-4 w-full bg-primary hover:bg-primary/90 shadow-sm hover:shadow-md transition-all"
            size="default"
            disabled={!canMessage}
          >
            <ChatCircle className="mr-2" size={18} />
            {canMessage ? 'Send Message' : 'Preferences Mismatch'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
