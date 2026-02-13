import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { MapPin, User as UserIcon, Heart, Calendar } from '@phosphor-icons/react'
import { isPhotoValid } from '@/lib/helpers'
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

  const photoValid = user.profilePicture ? isPhotoValid(user.profilePicture) : false

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
    <Card className="p-6 border-0 shadow-none">
      <div className="flex flex-col items-center text-center space-y-6">
        <Avatar className="w-28 h-28 border-4 border-primary/20 shadow-lg">
          {photoValid && user.profilePicture && (
            <AvatarImage src={user.profilePicture.dataUrl} alt={user.name} />
          )}
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-4xl">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-foreground">{user.name}</h2>
          {user.isActive && (
            <Badge variant="secondary" className="bg-accent/20 text-accent-foreground border-accent/30 shadow-sm px-3 py-1">
              {lastActiveText()}
            </Badge>
          )}
        </div>

        {distance && (
          <Badge variant="outline" className="text-sm flex items-center gap-1.5 shadow-sm px-3 py-1.5">
            <MapPin size={16} weight="fill" />
            {distance}
          </Badge>
        )}

        <Separator className="my-2" />

        <div className="w-full space-y-3.5 text-left">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="text-primary" size={22} weight="duotone" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Age</p>
              <p className="font-semibold text-foreground text-lg mt-0.5">{user.age} years old</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-secondary/5 to-secondary/10 border border-secondary/10">
            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
              <UserIcon className="text-secondary" size={22} weight="duotone" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Gender</p>
              <p className="font-semibold text-foreground text-lg mt-0.5">{user.gender}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-accent/5 to-accent/10 border border-accent/10">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
              <Heart className="text-accent" size={22} weight="duotone" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Looking For</p>
              <p className="font-semibold text-foreground text-lg mt-0.5">{user.receiveMessagesFrom?.join(', ') || 'Not specified'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/10">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="text-primary" size={22} weight="duotone" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Age Preference</p>
              <p className="font-semibold text-foreground text-lg mt-0.5">{user.ageRangeMin} - {user.ageRangeMax} years</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
