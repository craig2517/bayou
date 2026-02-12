import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { MapPin } from '@phosphor-icons/react'
import type { UserProfile } from '@/lib/types'

interface ProfileFormProps {
  profile: UserProfile | null
  onSave: (profile: Omit<UserProfile, 'id' | 'location' | 'isActive' | 'lastActive'>) => void
}

const GENDERS = ['Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say']

export function ProfileForm({ profile, onSave }: ProfileFormProps) {
  const [name, setName] = useState(profile?.name || '')
  const [age, setAge] = useState(profile?.age?.toString() || '')
  const [gender, setGender] = useState(profile?.gender || '')
  const [receiveMessagesFrom, setReceiveMessagesFrom] = useState<string[]>(
    profile?.receiveMessagesFrom || ['Male', 'Female', 'Non-binary', 'Other']
  )
  const [ageRange, setAgeRange] = useState([
    profile?.ageRangeMin || 18,
    profile?.ageRangeMax || 50
  ])
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(profile?.locationSharingEnabled ?? true)

  const handleGenderCheckbox = (genderOption: string, checked: boolean) => {
    if (checked) {
      setReceiveMessagesFrom(prev => [...prev, genderOption])
    } else {
      setReceiveMessagesFrom(prev => prev.filter(g => g !== genderOption))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !age || !gender || receiveMessagesFrom.length === 0) {
      return
    }

    onSave({
      name,
      age: parseInt(age),
      gender,
      receiveMessagesFrom,
      ageRangeMin: ageRange[0],
      ageRangeMax: ageRange[1],
      locationSharingEnabled
    })
  }

  const isValid = name && age && gender && receiveMessagesFrom.length > 0 && parseInt(age) >= 18 && parseInt(age) <= 100

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            min="18"
            max="100"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="Enter your age"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger id="gender">
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

        <div className="space-y-3">
          <Label>Receive Messages From</Label>
          <div className="grid grid-cols-2 gap-3">
            {GENDERS.filter(g => g !== 'Prefer not to say').map(genderOption => (
              <div key={genderOption} className="flex items-center space-x-2">
                <Checkbox
                  id={`receive-${genderOption}`}
                  checked={receiveMessagesFrom.includes(genderOption)}
                  onCheckedChange={(checked) => handleGenderCheckbox(genderOption, checked as boolean)}
                />
                <Label
                  htmlFor={`receive-${genderOption}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {genderOption}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <Label>Age Range to Receive Messages From: {ageRange[0]} - {ageRange[1]}</Label>
          <Slider
            value={ageRange}
            onValueChange={setAgeRange}
            min={18}
            max={80}
            step={1}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            You'll receive messages from users aged {ageRange[0]} to {ageRange[1]}
          </p>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <MapPin className="text-primary mt-1 flex-shrink-0" size={20} weight="fill" />
              <div className="space-y-1">
                <Label htmlFor="location-sharing" className="cursor-pointer font-semibold">
                  Real-Time Location Sharing
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow others to see your approximate location and discover you nearby. You can disable this at any time.
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
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              With location sharing disabled, you won't appear in discovery searches and won't be visible on the heat map.
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90"
          disabled={!isValid}
        >
          Save Profile
        </Button>
      </form>
    </Card>
  )
}
