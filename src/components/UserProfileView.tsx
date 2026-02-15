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
        <Avatar className="w-32 h-32 border-4 border-primary/30 shadow-xl ring-4 ring-primary/10">
          {photoValid && user.profilePicture && (
            <AvatarImage src={user.profilePicture.dataUrl} alt={user.name} />
          )}
          <AvatarFallback className="bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground font-bold text-4xl">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="space-y-2.5">
          <h2 className="text-3xl font-bold text-foreground">{user.name}</h2>
          {user.isActive && (
            <Badge variant="secondary" className="bg-accent/20 text-accent-foreground border-accent/40 shadow-sm px-4 py-1.5 font-semibold">
              {lastActiveText()}
            </Badge>
          )}
        </div>

        {distance && (
          <Badge variant="outline" className="text-sm flex items-center gap-2 shadow-sm px-4 py-2 border-primary/30 bg-primary/5 font-medium">
            <MapPin size={16} weight="fill" />
            {distance}
          </Badge>
        )}

        <Separator className="my-2" />

        <div className="w-full space-y-4 text-left">
          <div className="flex items-center gap-4 p-5 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/15 shadow-sm hover:shadow-md transition-all">
            <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center shadow-sm">
              <Calendar className="text-primary" size={24} weight="duotone" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Age</p>
              <p className="font-bold text-foreground text-xl mt-1">{user.age} years old</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 rounded-xl bg-gradient-to-r from-secondary/10 to-secondary/5 border-2 border-secondary/15 shadow-sm hover:shadow-md transition-all">
            <div className="w-14 h-14 rounded-full bg-secondary/15 flex items-center justify-center shadow-sm">
              <UserIcon className="text-secondary" size={24} weight="duotone" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Gender</p>
              <p className="font-bold text-foreground text-xl mt-1">{user.gender}</p>
            </div>
          </div>

          {user.isSingle !== undefined && (
            <div className="flex items-center gap-4 p-5 rounded-xl bg-gradient-to-r from-accent/10 to-accent/5 border-2 border-accent/15 shadow-sm hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-full bg-accent/15 flex items-center justify-center shadow-sm">
                <Heart className="text-accent" size={24} weight="duotone" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Status</p>
                <p className="font-bold text-foreground text-xl mt-1">{user.isSingle ? 'Single' : 'Not Single'}</p>
              </div>
            </div>
          )}

          {user.showReceiveMessagesFrom !== false && (
            <div className="flex items-center gap-4 p-5 rounded-xl bg-gradient-to-r from-accent/10 to-accent/5 border-2 border-accent/15 shadow-sm hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-full bg-accent/15 flex items-center justify-center shadow-sm">
                <Heart className="text-accent" size={24} weight="duotone" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Looking For</p>
                <p className="font-bold text-foreground text-xl mt-1">{user.receiveMessagesFrom?.join(', ') || 'Not specified'}</p>
              </div>
            </div>
          )}

          {user.showAgeRange !== false && (
            <div className="flex items-center gap-4 p-5 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/15 shadow-sm hover:shadow-md transition-all">
              <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center shadow-sm">
                <Calendar className="text-primary" size={24} weight="duotone" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Age Preference</p>
                <p className="font-bold text-foreground text-xl mt-1">{user.ageRangeMin} - {user.ageRangeMax} years</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
