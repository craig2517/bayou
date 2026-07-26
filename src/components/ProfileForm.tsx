import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MapPin, Camera, Trash, ProhibitInset } from '@phosphor-icons/react'
import { CameraCapture } from '@/components/CameraCapture'
import { isPhotoValid } from '@/lib/helpers'
import type { UserProfile } from '@/lib/types'

interface ProfileFormProps {
  profile: UserProfile | null
  onSave: (profile: Omit<UserProfile, 'id' | 'location' | 'isActive' | 'lastActive'>) => void
  blockedUsers?: UserProfile[]
  onUnblockUser?: (userId: string) => void
}

const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say']
const GENDERS_SELECTABLE = ['Male', 'Female', 'Non-binary', 'Prefer not to say']
const RELATIONSHIP_STATUSES = ['Single', 'Not Single', 'Prefer not to say']

export function ProfileForm({ profile, onSave, blockedUsers, onUnblockUser }: ProfileFormProps) {
  const [name, setName] = useState(profile?.name || '')
  const [age, setAge] = useState(profile?.age?.toString() || '')
  const [gender, setGender] = useState(profile?.gender || '')
  const [receiveMessagesFrom, setReceiveMessagesFrom] = useState<string[]>(
    profile?.receiveMessagesFrom || ['Male', 'Female', 'Non-binary']
  )
  const [relationshipStatusPreference, setRelationshipStatusPreference] = useState<string[]>(
    profile?.relationshipStatusPreference || ['Single', 'Not Single', 'Prefer not to say']
  )
  const [ageRange, setAgeRange] = useState([
    profile?.ageRangeMin || 18,
    profile?.ageRangeMax || 100
  ])

  const handleAgeRangeChange = (values: number[]) => {
    if (values.length === 2 && values[0] <= values[1]) {
      setAgeRange(values)
    }
  }
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(profile?.locationSharingEnabled ?? true)
  const [requireApproval, setRequireApproval] = useState(profile?.requireApproval ?? true)
  const [isSingle, setIsSingle] = useState<boolean | undefined>(profile?.isSingle)
  const [showReceiveMessagesFrom, setShowReceiveMessagesFrom] = useState(profile?.showReceiveMessagesFrom ?? true)
  const [showAgeRange, setShowAgeRange] = useState(profile?.showAgeRange ?? true)
  const [profilePicture, setProfilePicture] = useState<{ dataUrl: string; capturedAt: number } | undefined>(
    profile?.profilePicture
  )
  const [showCamera, setShowCamera] = useState(false)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    let mounted = true
    
    if (profilePicture) {
      const checkExpiration = () => {
        if (!mounted) return
        
        const now = Date.now()
        const hoursSinceCapture = (now - profilePicture.capturedAt) / (1000 * 60 * 60)
        if (hoursSinceCapture >= 24) {
          setIsExpired(true)
          setProfilePicture(undefined)
        }
      }
      
      checkExpiration()
      
      const interval = setInterval(checkExpiration, 60000)
      
      return () => {
        mounted = false
        clearInterval(interval)
      }
    }
  }, [profilePicture])

  const handleGenderCheckbox = (genderOption: string, checked: boolean) => {
    if (checked) {
      setReceiveMessagesFrom(prev => [...prev, genderOption])
    } else {
      setReceiveMessagesFrom(prev => prev.filter(g => g !== genderOption))
    }
  }

  const handleRelationshipStatusCheckbox = (status: string, checked: boolean) => {
    if (checked) {
      setRelationshipStatusPreference(prev => [...prev, status])
    } else {
      setRelationshipStatusPreference(prev => prev.filter(s => s !== status))
    }
  }

  const handleCapturePhoto = (dataUrl: string) => {
    setProfilePicture({
      dataUrl,
      capturedAt: Date.now()
    })
    setIsExpired(false)
  }

  const handleRemovePhoto = () => {
    setProfilePicture(undefined)
    setIsExpired(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const parsedAge = parseInt(age)
    if (!name || !age || !gender || receiveMessagesFrom.length === 0 || relationshipStatusPreference.length === 0 || isNaN(parsedAge) || parsedAge < 18 || parsedAge > 100) {
      return
    }

    onSave({
      name,
      age: parsedAge,
      gender,
      receiveMessagesFrom,
      relationshipStatusPreference,
      ageRangeMin: ageRange[0],
      ageRangeMax: ageRange[1],
      locationSharingEnabled,
      requireApproval,
      blockedUsers: profile?.blockedUsers || [],
      isSingle,
      showReceiveMessagesFrom,
      showAgeRange,
      profilePicture
    })
  }

  const isValid = name && age && gender && receiveMessagesFrom.length > 0 && relationshipStatusPreference.length > 0 && !isNaN(parseInt(age)) && parseInt(age) >= 18 && parseInt(age) <= 100

  const getPhotoTimeRemaining = () => {
    if (!profilePicture) return null
    const now = Date.now()
    const hoursSinceCapture = (now - profilePicture.capturedAt) / (1000 * 60 * 60)
    const hoursRemaining = Math.max(0, 24 - hoursSinceCapture)
    return Math.floor(hoursRemaining)
  }

  return (
    <Card className="p-6 border-0 shadow-none">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-3">
          <Label className="text-sm font-semibold text-base">Profile Picture</Label>
          <div className="flex flex-col items-center gap-4">
            {profilePicture && !isExpired ? (
              <div className="relative group">
                <img
                  src={profilePicture.dataUrl}
                  alt="Profile"
                  className="w-36 h-36 rounded-full object-cover border-4 border-primary/30 shadow-xl group-hover:border-primary/50 transition-all duration-200"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 rounded-full h-9 w-9 shadow-lg hover:shadow-xl transition-all"
                  onClick={handleRemovePhoto}
                >
                  <Trash size={16} weight="bold" />
                </Button>
              </div>
            ) : (
              <div className="w-36 h-36 rounded-full bg-muted/50 border-2 border-dashed border-border flex items-center justify-center hover:bg-muted/70 transition-colors">
                <Camera size={48} className="text-muted-foreground" weight="duotone" />
              </div>
            )}
            
            <div className="text-center space-y-2.5">
              {profilePicture && !isExpired && (
                <p className="text-xs text-muted-foreground bg-accent/10 border border-accent/20 px-3 py-2 rounded-full inline-block font-medium">
                  ⏱ Expires in {getPhotoTimeRemaining()} hours
                </p>
              )}
              {isExpired && (
                <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-full inline-block font-medium">
                  ⚠️ Photo expired - take a new one
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCamera(true)}
                className="w-full shadow-sm hover:shadow-md transition-all h-11"
              >
                <Camera className="mr-2" size={18} weight="duotone" />
                {profilePicture && !isExpired ? 'Retake Photo' : 'Take Photo'}
              </Button>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Live camera capture only • Photo expires after 24h
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t-2 border-border">
          <Label htmlFor="name" className="text-sm font-semibold">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="h-11 border-border/60 focus:border-primary transition-colors"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="age" className="text-sm font-semibold">Age</Label>
          <Input
            id="age"
            type="number"
            min="18"
            max="100"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Enter your age"
            className="h-11 border-border/60 focus:border-primary transition-colors"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender" className="text-sm font-semibold">Gender</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger id="gender" className="h-11 border-border/60 focus:border-primary transition-colors">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {GENDERS_SELECTABLE.map(g => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="relationship-status" className="text-sm font-semibold">Relationship Status (Optional)</Label>
          <Select 
            value={isSingle === undefined ? 'unspecified' : isSingle ? 'single' : 'not-single'} 
            onValueChange={(value) => {
              if (value === 'unspecified') {
                setIsSingle(undefined)
              } else if (value === 'single') {
                setIsSingle(true)
              } else if (value === 'not-single') {
                setIsSingle(false)
              }
            }}
          >
            <SelectTrigger id="relationship-status" className="h-11 border-border/60 focus:border-primary transition-colors">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unspecified">Prefer not to say</SelectItem>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="not-single">Not Single</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg leading-relaxed border border-border/30">
            This will be visible to other users viewing your profile
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Label className="text-sm font-semibold">Be Seen By and Receive Messages From:</Label>
          <div className="grid grid-cols-2 gap-3">
            {GENDERS.filter(g => g !== 'Prefer not to say').map(genderOption => (
              <div key={genderOption} className="flex items-center space-x-2.5 p-3.5 rounded-lg border-2 border-border hover:bg-muted/40 hover:border-primary/20 transition-all">
                <Checkbox
                  id={`receive-${genderOption}`}
                  checked={receiveMessagesFrom.includes(genderOption)}
                  onCheckedChange={(checked) => handleGenderCheckbox(genderOption, checked as boolean)}
                />
                <Label
                  htmlFor={`receive-${genderOption}`}
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {genderOption}
                </Label>
              </div>
            ))}
          </div>
          <div className="flex items-center space-x-2.5 p-3.5 rounded-lg border-2 border-border bg-muted/30">
            <Checkbox
              id="show-receive-messages"
              checked={showReceiveMessagesFrom}
              onCheckedChange={(checked) => setShowReceiveMessagesFrom(checked as boolean)}
            />
            <Label
              htmlFor="show-receive-messages"
              className="text-sm font-normal cursor-pointer flex-1"
            >
              Display this on my profile for others to see
            </Label>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <Label className="text-sm font-semibold">Age Range: {ageRange[0]} - {ageRange[1]}</Label>
          <Slider
            value={ageRange}
            onValueChange={handleAgeRangeChange}
            min={18}
            max={100}
            step={1}
            minStepsBetweenThumbs={1}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg leading-relaxed border border-border/30">
            You'll be seen by and receive messages from users aged {ageRange[0]} to {ageRange[1]}
          </p>
          <div className="flex items-center space-x-2.5 p-3.5 rounded-lg border-2 border-border bg-muted/30">
            <Checkbox
              id="show-age-range"
              checked={showAgeRange}
              onCheckedChange={(checked) => setShowAgeRange(checked as boolean)}
            />
            <Label
              htmlFor="show-age-range"
              className="text-sm font-normal cursor-pointer flex-1"
            >
              Display this on my profile for others to see
            </Label>
          </div>
        </div>

        <div className="space-y-3 pt-2 border-t-2 border-border">
          <Label className="text-sm font-semibold">Relationship Status Preference</Label>
          <p className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg leading-relaxed border border-border/30">
            You'll be seen by and receive messages from users with these relationship statuses
          </p>
          <div className="grid grid-cols-2 gap-3">
            {RELATIONSHIP_STATUSES.map(status => (
              <div key={status} className="flex items-center space-x-2.5 p-3.5 rounded-lg border-2 border-border hover:bg-muted/40 hover:border-primary/20 transition-all">
                <Checkbox
                  id={`relationship-${status}`}
                  checked={relationshipStatusPreference.includes(status)}
                  onCheckedChange={(checked) => handleRelationshipStatusCheckbox(status, checked as boolean)}
                />
                <Label
                  htmlFor={`relationship-${status}`}
                  className="text-sm font-normal cursor-pointer flex-1"
                >
                  {status}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t-2 border-border">
          <div className="flex items-start justify-between gap-4 p-5 rounded-xl bg-gradient-to-br from-muted/40 to-muted/20 hover:from-muted/60 hover:to-muted/30 transition-all border-2 border-border">
            <div className="flex items-start gap-3 flex-1">
              <MapPin className="text-primary mt-1 flex-shrink-0" size={24} weight="fill" />
              <div className="space-y-1">
                <Label htmlFor="location-sharing" className="cursor-pointer font-semibold text-base">
                  Appear in Discover
                </Label>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Allow others to discover you in nearby searches. You can disable this at any time.
                </p>
              </div>
            </div>
            <Switch
              id="location-sharing"
              checked={locationSharingEnabled}
              onCheckedChange={setLocationSharingEnabled}
            />
          </div>
          {!locationSharingEnabled && (
            <p className="text-sm text-muted-foreground bg-amber-50 border-2 border-amber-200 p-4 rounded-lg leading-relaxed">
              With this disabled, you won't appear in Discover searches, but your anonymized location will still contribute to the heat map.
            </p>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t-2 border-border">
          <div className="flex items-start justify-between gap-4 p-5 rounded-xl bg-gradient-to-br from-muted/40 to-muted/20 hover:from-muted/60 hover:to-muted/30 transition-all border-2 border-border">
            <div className="flex-1">
              <Label htmlFor="require-approval" className="cursor-pointer font-semibold text-base">
                Require Approval for Messages
              </Label>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                When enabled, you'll review and approve chat requests before receiving messages. When disabled, matching users can message you directly.
              </p>
            </div>
            <Switch
              id="require-approval"
              checked={requireApproval}
              onCheckedChange={setRequireApproval}
              className="mt-1"
            />
          </div>
        </div>

        {blockedUsers && blockedUsers.length > 0 && (
          <div className="space-y-4 pt-4 border-t-2 border-border">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ProhibitInset size={20} className="text-destructive" weight="duotone" />
                <Label className="text-sm font-semibold">Blocked Users ({blockedUsers.length})</Label>
              </div>
              <p className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-lg leading-relaxed border border-border/30">
                Blocked users cannot message you or see you in Discover
              </p>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {blockedUsers.map(user => {
                const photoValid = user.profilePicture ? isPhotoValid(user.profilePicture) : false
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-card rounded-xl border-2 border-border hover:border-destructive/20 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 border-2 border-destructive/30">
                        {photoValid && user.profilePicture && (
                          <AvatarImage src={user.profilePicture.dataUrl} alt={user.name} />
                        )}
                        <AvatarFallback className="bg-gradient-to-br from-destructive/20 to-destructive/10 text-destructive font-semibold">
                          {user.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.age} • {user.gender}
                        </p>
                      </div>
                    </div>
                    {onUnblockUser && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onUnblockUser(user.id)}
                        className="border-accent/50 hover:border-accent text-accent hover:bg-accent/10"
                      >
                        Unblock
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          disabled={!isValid}
        >
          Save Profile
        </Button>
      </form>

      <Dialog open={showCamera} onOpenChange={setShowCamera}>
        <DialogContent className="max-w-2xl p-0 gap-0">
          <CameraCapture
            onCapture={handleCapturePhoto}
            onClose={() => setShowCamera(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  )
}
