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
import { MapPin, Camera, Trash } from '@phosphor-icons/react'
import { CameraCapture } from '@/components/CameraCapture'
import type { UserProfile } from '@/lib/types'

interface ProfileFormProps {
  profile: UserProfile | null
  onSave: (profile: Omit<UserProfile, 'id' | 'location' | 'isActive' | 'lastActive'>) => void
}

const GENDERS = ['Male', 'Female', 'Non-binary', 'Other']

export function ProfileForm({ profile, onSave }: ProfileFormProps) {
  const [name, setName] = useState(profile?.name || '')
  const [age, setAge] = useState(profile?.age?.toString() || '')
  const [gender, setGender] = useState(profile?.gender || '')
  const [receiveMessagesFrom, setReceiveMessagesFrom] = useState<string[]>(
    profile?.receiveMessagesFrom || ['Male', 'Female', 'Non-binary', 'Other']
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
        if (hoursSinceCapture >= 48) {
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
    if (!name || !age || !gender || receiveMessagesFrom.length === 0 || isNaN(parsedAge) || parsedAge < 18 || parsedAge > 100) {
      return
    }

    onSave({
      name,
      age: parsedAge,
      gender,
      receiveMessagesFrom,
      ageRangeMin: ageRange[0],
      ageRangeMax: ageRange[1],
      locationSharingEnabled,
      requireApproval,
      profilePicture
    })
  }

  const isValid = name && age && gender && receiveMessagesFrom.length > 0 && !isNaN(parseInt(age)) && parseInt(age) >= 18 && parseInt(age) <= 100

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
          <Label className="text-sm font-semibold">Profile Picture</Label>
          <div className="flex flex-col items-center gap-4">
            {profilePicture && !isExpired ? (
              <div className="relative">
                <img
                  src={profilePicture.dataUrl}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover border-4 border-primary/20 shadow-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 rounded-full h-8 w-8 shadow-md"
                  onClick={handleRemovePhoto}
                >
                  <Trash size={16} />
                </Button>
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center">
                <Camera size={40} className="text-muted-foreground" />
              </div>
            )}
            
            <div className="text-center space-y-2">
              {profilePicture && !isExpired && (
                <p className="text-xs text-muted-foreground bg-accent/10 border border-accent/20 px-3 py-1.5 rounded-full inline-block">
                  Expires in {getPhotoTimeRemaining()} hours
                </p>
              )}
              {isExpired && (
                <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 px-3 py-1.5 rounded-full inline-block">
                  Photo expired - take a new one
                </p>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCamera(true)}
                className="w-full"
              >
                <Camera className="mr-2" size={18} />
                {profilePicture && !isExpired ? 'Retake Photo' : 'Take Photo'}
              </Button>
              <p className="text-xs text-muted-foreground">
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
            className="h-11"
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
            className="h-11"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender" className="text-sm font-semibold">Gender</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger id="gender" className="h-11">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {GENDERS.map(g => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3 pt-2">
          <Label className="text-sm font-semibold">Receive Messages From</Label>
          <div className="grid grid-cols-2 gap-3">
            {GENDERS.map(genderOption => (
              <div key={genderOption} className="flex items-center space-x-2.5 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
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
          <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg">
            You'll receive messages from users aged {ageRange[0]} to {ageRange[1]}
          </p>
        </div>

        <div className="space-y-4 pt-4 border-t-2 border-border">
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-3 flex-1">
              <MapPin className="text-primary mt-1 flex-shrink-0" size={22} weight="fill" />
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
            <p className="text-sm text-muted-foreground bg-yellow-500/10 border border-yellow-500/20 p-3.5 rounded-lg">
              With this disabled, you won't appear in Discover searches, but your anonymized location will still contribute to the heat map.
            </p>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t-2 border-border">
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
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

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
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
