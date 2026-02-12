import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChatCircle } from '@phosphor-icons/react'
import type { UserProfile } from '@/lib/types'

interface UserCardProps {
  user: UserProfile
  distance: string
  onMessage: () => void
  onViewProfile?: () => void
}

export function UserCard({ user, distance, onMessage, onViewProfile }: UserCardProps) {
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()

  return (
    <Card className="p-4 hover:shadow-lg hover:border-accent/50 transition-all duration-200">
      <div className="flex items-start gap-4">
        <Avatar 
          className="w-16 h-16 border-2 border-primary/20 cursor-pointer hover:scale-105 transition-transform"
          onClick={onViewProfile}
        >
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold text-lg">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 
                className="font-semibold text-lg text-foreground cursor-pointer hover:text-primary transition-colors"
                onClick={onViewProfile}
              >
                {user.name}
              </h3>
              <p className="text-sm text-muted-foreground">{user.age} • {user.gender}</p>
            </div>
            {user.isActive && (
              <Badge variant="secondary" className="bg-accent/20 text-accent-foreground border-accent/30">
                Active
              </Badge>
            )}
          </div>
          
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {distance}
            </Badge>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{user.orientation}</span>
          </div>
          
          <Button
            onClick={onMessage}
            className="mt-3 w-full bg-primary hover:bg-primary/90"
            size="sm"
          >
            <ChatCircle className="mr-2" />
            Send Message
          </Button>
        </div>
      </div>
    </Card>
  )
}
