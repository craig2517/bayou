import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChatCircle } from '@phosphor-icons/react'
import { isPhotoValid } from '@/lib/helpers'
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

  const photoValid = user.profilePicture ? isPhotoValid(user.profilePicture) : false

  return (
    <Card className="p-6 hover:shadow-2xl hover:border-primary/40 hover:-translate-y-1.5 transition-all duration-300 group border-2 bg-gradient-to-br from-card to-card/80">
      <div className="flex items-start gap-4">
        <Avatar 
          className="w-20 h-20 border-2 border-primary/20 cursor-pointer group-hover:scale-110 group-hover:border-primary/50 transition-all duration-300 shadow-md group-hover:shadow-xl"
          onClick={onViewProfile}
        >
          {photoValid && user.profilePicture && (
            <AvatarImage src={user.profilePicture.dataUrl} alt={user.name} />
          )}
          <AvatarFallback className="bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground font-bold text-xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2.5">
            <div>
              <h3 
                className="font-semibold text-lg text-foreground cursor-pointer hover:text-primary transition-colors leading-tight mb-1"
                onClick={onViewProfile}
              >
                {user.name}
              </h3>
              <p className="text-sm text-muted-foreground font-medium">{user.age} • {user.gender}</p>
            </div>
            {user.isActive && (
              <Badge variant="secondary" className="bg-accent/20 text-accent-foreground border-accent/40 shadow-sm font-medium">
                Active
              </Badge>
            )}
          </div>
          
          <div className="mt-3.5 flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs shadow-sm border-primary/30 bg-primary/5 font-medium">
              📍 {distance}
            </Badge>
            {!canMessage && (
              <Badge variant="secondary" className="text-xs bg-muted/80 font-medium">
                Not a match
              </Badge>
            )}
          </div>
          
          <Button
            onClick={onMessage}
            className="mt-5 w-full bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200 h-11 font-semibold"
            size="default"
            disabled={!canMessage}
          >
            <ChatCircle className="mr-2" size={18} weight="fill" />
            {canMessage ? 'Send Message' : 'Preferences Mismatch'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
