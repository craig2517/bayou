import type { UserProfile, HeatMapPoint } from './types'

const CENTER_LAT = 38.2545
const CENTER_LNG = -85.7145

const FIRST_NAMES = [
  'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn',
  'Sage', 'River', 'Sky', 'Ember', 'Phoenix', 'Dakota', 'Rowan', 'Blair',
  'Cameron', 'Drew', 'Hayden', 'Kendall', 'Logan', 'Parker', 'Reese', 'Sawyer',
  'Blake', 'Charlie', 'Finley', 'Harley', 'Jamie', 'Jesse', 'Kai', 'Lane',
  'Micah', 'Nova', 'Oakley', 'Payton', 'Remy', 'Skylar', 'Spencer', 'Winter',
  'Adrian', 'Bailey', 'Camden', 'Dylan', 'Ellis', 'Frankie', 'Gray', 'Hunter',
  'Indigo', 'Justice', 'Kennedy', 'Lee', 'Milan', 'Nico', 'Ocean', 'Perry',
  'Quincy', 'Rain', 'Skyler', 'Tatum', 'Val', 'Wren', 'Zion', 'Ash',
  'Brooklyn', 'Devon', 'Emerson', 'Flynn', 'Harper', 'Indiana', 'Jordan', 'Lennox',
  'Marley', 'Arden', 'Peyton', 'Reign', 'Sutton', 'Tyler', 'Eden', 'Jules',
  'Max', 'Sam', 'Chris', 'Stevie', 'Dallas', 'Austin', 'Angel', 'Robin'
]

const GENDERS = ['Male', 'Female', 'Non-binary', 'Other']

function getRandomGenderPreferences(): string[] {
  return [...GENDERS]
}

export function generateDemoUsers(count: number = 50): UserProfile[] {
  const users: UserProfile[] = []
  
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * 2 * Math.PI
    const rand = Math.random()
    let radiusKm: number
    
    if (rand < 0.95) {
      radiusKm = Math.random() * 0.3
    } else {
      radiusKm = 0.3 + Math.random() * 0.3
    }
    
    const latOffset = (radiusKm / 111) * Math.cos(angle)
    const lngOffset = (radiusKm / (111 * Math.cos((CENTER_LAT * Math.PI) / 180))) * Math.sin(angle)
    
    const lat = CENTER_LAT + latOffset
    const lng = CENTER_LNG + lngOffset
    const age = 20 + Math.floor(Math.random() * 40)
    
    users.push({
      id: `user-${i + 1}`,
      name: FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)],
      age,
      gender: GENDERS[Math.floor(Math.random() * GENDERS.length)],
      receiveMessagesFrom: [...GENDERS],
      ageRangeMin: 18,
      ageRangeMax: 80,
      location: { lat, lng },
      isActive: true,
      lastActive: Date.now() - Math.floor(Math.random() * 3600000),
      locationSharingEnabled: true,
      requireApproval: Math.random() > 0.4
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
  const activeUsers = users.filter(u => u.isActive)
  
  const locationClusters: Map<string, { lat: number; lng: number; count: number }> = new Map()
  
  activeUsers.forEach(user => {
    const fuzzed = fuzzLocation(user.location.lat, user.location.lng, 0.3)
    const clusterKey = `${Math.round(fuzzed.lat * 1000)},${Math.round(fuzzed.lng * 1000)}`
    
    const existing = locationClusters.get(clusterKey)
    if (existing) {
      existing.count++
      existing.lat = (existing.lat * (existing.count - 1) + fuzzed.lat) / existing.count
      existing.lng = (existing.lng * (existing.count - 1) + fuzzed.lng) / existing.count
    } else {
      locationClusters.set(clusterKey, { lat: fuzzed.lat, lng: fuzzed.lng, count: 1 })
    }
  })
  
  const maxCount = Math.max(...Array.from(locationClusters.values()).map(c => c.count))
  
  locationClusters.forEach(cluster => {
    const normalizedIntensity = cluster.count / maxCount
    heatPoints.push({
      lat: cluster.lat,
      lng: cluster.lng,
      intensity: Math.min(normalizedIntensity * 1.2 + 0.3, 1)
    })
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

export function generateInitialChatRequests(
  myProfile: UserProfile,
  demoUsers: UserProfile[],
  count: number = 8
) {
  const eligibleUsers = demoUsers.filter(user => {
    if (!user.isActive || !user.locationSharingEnabled) return false
    
    const distance = calculateDistance(
      myProfile.location.lat,
      myProfile.location.lng,
      user.location.lat,
      user.location.lng
    )
    
    if (distance > 1) return false
    
    const canMessage = 
      user.receiveMessagesFrom?.includes(myProfile.gender) &&
      user.ageRangeMin <= myProfile.age &&
      user.ageRangeMax >= myProfile.age &&
      myProfile.receiveMessagesFrom?.includes(user.gender) &&
      myProfile.ageRangeMin <= user.age &&
      myProfile.ageRangeMax >= user.age
    
    return canMessage
  })
  
  const numRequests = Math.min(count, Math.max(2, Math.floor(eligibleUsers.length * 0.15)))
  
  const selectedUsers = eligibleUsers
    .sort(() => Math.random() - 0.5)
    .slice(0, numRequests)
  
  return selectedUsers.map((user, index) => ({
    id: `initial-req-${Date.now()}-${index}`,
    fromUserId: user.id,
    toUserId: myProfile.id,
    status: 'pending' as const,
    timestamp: Date.now() - Math.floor(Math.random() * 3600000)
  }))
}
