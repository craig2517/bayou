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
  const [locationSharingEnabled, setLocationSharingEnabled] = useState(profile?.locationSharingEnabled ?? true)
  const [requireApproval, setRequireApproval] = useState(profile?.requireApproval ?? true)

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
      locationSharingEnabled,
      requireApproval
    })
  }

  const isValid = name && age && gender && receiveMessagesFrom.length > 0 && parseInt(age) >= 18 && parseInt(age) <= 100

  return (
    <Card className="p-6 border-0 shadow-none">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
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
            onValueChange={setAgeRange}
            min={18}
            max={100}
            step={1}
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
    </Card>
  )
}
