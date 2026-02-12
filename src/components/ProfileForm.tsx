import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { UserProfile } from '@/lib/types'

interface ProfileFormProps {
  profile: UserProfile | null
  onSave: (profile: Omit<UserProfile, 'id' | 'location' | 'isActive' | 'lastActive'>) => void
}

const GENDERS = ['Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say']
const ORIENTATIONS = ['Straight', 'Gay', 'Lesbian', 'Bisexual', 'Pansexual', 'Queer', 'Asexual', 'Other']

export function ProfileForm({ profile, onSave }: ProfileFormProps) {
  const [name, setName] = useState(profile?.name || '')
  const [age, setAge] = useState(profile?.age?.toString() || '')
  const [gender, setGender] = useState(profile?.gender || '')
  const [orientation, setOrientation] = useState(profile?.orientation || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !age || !gender || !orientation) {
      return
    }

    onSave({
      name,
      age: parseInt(age),
      gender,
      orientation
    })
  }

  const isValid = name && age && gender && orientation && parseInt(age) >= 18 && parseInt(age) <= 100

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

        <div className="space-y-2">
          <Label htmlFor="orientation">Sexual Orientation</Label>
          <Select value={orientation} onValueChange={setOrientation}>
            <SelectTrigger id="orientation">
              <SelectValue placeholder="Select orientation" />
            </SelectTrigger>
            <SelectContent>
              {ORIENTATIONS.map(o => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
