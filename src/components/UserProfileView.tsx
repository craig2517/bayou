import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { MapPin, User as UserIcon, Heart, Calendar } from '@phosphor-icons/react'
import type { UserProfile } from '@/lib/types'

interface UserProfileViewProps {
  user: UserProfile
  distance?: string
}

export function UserProfileView({ user, distance }: UserProfileViewProps) {
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()

  const lastActiveText = () => {
    const now = Date.now()
    const diff = now - user.lastActive
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Active now'
    if (minutes < 60) return `Active ${minutes}m ago`
    if (hours < 24) return `Active ${hours}h ago`
    return `Active ${days}d ago`
  }

  return (
    <Card className="p-6">
      <div className="flex flex-col items-center text-center space-y-4">
        <Avatar className="w-24 h-24 border-4 border-primary/20">
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-3xl">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
          {user.isActive && (
            <Badge variant="secondary" className="bg-accent/20 text-accent-foreground border-accent/30">
              {lastActiveText()}
            </Badge>
          )}
        </div>

        {distance && (
          <Badge variant="outline" className="text-sm flex items-center gap-1.5">
            <MapPin size={14} />
            {distance}
          </Badge>
        )}

        <Separator className="my-4" />

        <div className="w-full space-y-3 text-left">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="text-primary" size={20} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Age</p>
              <p className="font-semibold text-foreground">{user.age} years old</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
              <UserIcon className="text-secondary" size={20} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gender</p>
              <p className="font-semibold text-foreground">{user.gender}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Heart className="text-accent" size={20} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Orientation</p>
              <p className="font-semibold text-foreground">{user.orientation}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
