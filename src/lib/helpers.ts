import type { UserProfile, HeatMapPoint } from './types'

const CENTER_LAT = 40.7580
const CENTER_LNG = -73.9855

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn',
  'Sage', 'River', 'Sky', 'Ember', 'Phoenix', 'Dakota', 'Rowan', 'Blair'
]

const GENDERS = ['Male', 'Female', 'Non-binary', 'Other']
const ORIENTATIONS = ['Straight', 'Gay', 'Lesbian', 'Bisexual', 'Pansexual', 'Queer', 'Asexual']

export function generateDemoUsers(count: number = 50): UserProfile[] {
  const users: UserProfile[] = []
  
  for (let i = 0; i < count; i++) {
    const lat = CENTER_LAT + (Math.random() - 0.5) * 0.05
    const lng = CENTER_LNG + (Math.random() - 0.5) * 0.05
    
    users.push({
      id: `user-${i + 1}`,
      name: FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)],
      age: Math.floor(Math.random() * 30) + 20,
      gender: GENDERS[Math.floor(Math.random() * GENDERS.length)],
      orientation: ORIENTATIONS[Math.floor(Math.random() * ORIENTATIONS.length)],
      location: { lat, lng },
      isActive: Math.random() > 0.3,
      lastActive: Date.now() - Math.floor(Math.random() * 3600000),
      locationSharingEnabled: Math.random() > 0.2
    })
  }
  
  return users
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function fuzzLocation(lat: number, lng: number, radiusKm: number = 0.5): { lat: number; lng: number } {
  const angle = Math.random() * 2 * Math.PI
  const distance = Math.random() * radiusKm
  
  const latOffset = (distance / 111) * Math.cos(angle)
  const lngOffset = (distance / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle)
  
  return {
    lat: lat + latOffset,
    lng: lng + lngOffset
  }
}

export function generateHeatMapData(users: UserProfile[]): HeatMapPoint[] {
  const heatPoints: HeatMapPoint[] = []
  
  users.forEach(user => {
    if (user.isActive && user.locationSharingEnabled) {
      const fuzzed = fuzzLocation(user.location.lat, user.location.lng, 1)
      heatPoints.push({
        lat: fuzzed.lat,
        lng: fuzzed.lng,
        intensity: Math.random() * 0.5 + 0.5
      })
    }
  })
  
  return heatPoints
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m away`
  } else if (km < 10) {
    return `${km.toFixed(1)}km away`
  } else {
    return `${Math.round(km)}km away`
  }
}

export function getApproximateDistance(km: number): string {
  if (km < 0.5) return 'Very close'
  if (km < 2) return 'Less than 2km'
  if (km < 5) return 'Within 5km'
  if (km < 10) return 'Within 10km'
  return 'Far away'
}
