import type { UserProfile, HeatMapPoint } from './types'

export const CENTER_LAT = 40.7128
export const CENTER_LNG = -74.0060

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

export function generateDemoAvatar(name: string, gender: string, age: number, seed: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = 200
  canvas.height = 200
  const ctx = canvas.getContext('2d')
  
  if (!ctx) return ''
  
  const hue = (seed * 137.508) % 360
  const saturation = 60 + (seed % 20)
  const lightness = 45 + (seed % 15)
  
  const gradient = ctx.createLinearGradient(0, 0, 200, 200)
  gradient.addColorStop(0, `hsl(${hue}, ${saturation}%, ${lightness}%)`)
  gradient.addColorStop(1, `hsl(${(hue + 30) % 360}, ${saturation}%, ${lightness - 10}%)`)
  
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 200, 200)
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.font = 'bold 80px Space Grotesk, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(name[0].toUpperCase(), 100, 100)
  
  const ageGroup = age < 30 ? 'young' : age < 50 ? 'middle' : 'senior'
  const shapeVariant = (seed % 3)
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
  ctx.beginPath()
  
  if (shapeVariant === 0) {
    ctx.arc(50, 50, 25, 0, Math.PI * 2)
  } else if (shapeVariant === 1) {
    ctx.arc(150, 150, 30, 0, Math.PI * 2)
  } else {
    ctx.arc(150, 50, 20, 0, Math.PI * 2)
    ctx.arc(50, 150, 20, 0, Math.PI * 2)
  }
  
  ctx.fill()
  
  return canvas.toDataURL('image/png')
}

export function generateDemoUsers(count: number = 50): UserProfile[] {
  const users: UserProfile[] = []
  const timestamp = Date.now()
  
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * 2 * Math.PI
    const radiusKm = Math.random() * 0.5
    
    const latOffset = (radiusKm / 111) * Math.cos(angle)
    const lngOffset = (radiusKm / (111 * Math.cos((CENTER_LAT * Math.PI) / 180))) * Math.sin(angle)
    
    const lat = CENTER_LAT + latOffset
    const lng = CENTER_LNG + lngOffset
    const age = 18 + Math.floor(Math.random() * 83)
    const gender = GENDERS[Math.floor(Math.random() * GENDERS.length)]
    const name = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
    
    const capturedAt = Date.now() - Math.floor(Math.random() * 20 * 60 * 60 * 1000)
    
    users.push({
      id: `user-demo-${i + 1}-${timestamp}`,
      name,
      age,
      gender,
      receiveMessagesFrom: ['Male', 'Female', 'Non-binary', 'Other'],
      ageRangeMin: 18,
      ageRangeMax: 100,
      location: { lat, lng },
      isActive: true,
      lastActive: Date.now() - Math.floor(Math.random() * 3600000),
      locationSharingEnabled: true,
      requireApproval: Math.random() > 0.3,
      profilePicture: {
        dataUrl: generateDemoAvatar(name, gender, age, i),
        capturedAt
      }
    })
  }
  
  const distancesFromCenter = users.map(u => {
    const dist = calculateDistance(CENTER_LAT, CENTER_LNG, u.location.lat, u.location.lng)
    return { name: u.name, distance: dist }
  })
  
  console.log('🎲 GENERATED DEMO USERS:', {
    count: users.length,
    center: { lat: CENTER_LAT, lng: CENTER_LNG },
    within100m: distancesFromCenter.filter(d => d.distance <= 0.1).length,
    within300m: distancesFromCenter.filter(d => d.distance <= 0.3).length,
    within500m: distancesFromCenter.filter(d => d.distance <= 0.5).length,
    within800m: distancesFromCenter.filter(d => d.distance <= 0.8).length,
    within1km: distancesFromCenter.filter(d => d.distance <= 1).length,
    closestUsers: distancesFromCenter.sort((a, b) => a.distance - b.distance).slice(0, 10),
    sampleUsers: users.slice(0, 3).map(u => ({
      id: u.id,
      name: u.name,
      age: u.age,
      gender: u.gender,
      location: u.location,
      distance: calculateDistance(CENTER_LAT, CENTER_LNG, u.location.lat, u.location.lng).toFixed(4) + 'km',
      receiveFrom: u.receiveMessagesFrom,
      ageRange: [u.ageRangeMin, u.ageRangeMax],
      isActive: u.isActive,
      locationSharingEnabled: u.locationSharingEnabled
    }))
  })
  
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

export function getRandomLocationNearCenter(): { lat: number; lng: number } {
  return {
    lat: CENTER_LAT,
    lng: CENTER_LNG
  }
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
    
    const userReceivesList = user.receiveMessagesFrom || []
    const myReceivesList = myProfile.receiveMessagesFrom || []
    
    const canMessage = 
      userReceivesList.includes(myProfile.gender) &&
      user.ageRangeMin <= myProfile.age &&
      user.ageRangeMax >= myProfile.age &&
      myReceivesList.includes(user.gender) &&
      myProfile.ageRangeMin <= user.age &&
      myProfile.ageRangeMax >= user.age
    
    return canMessage
  })
  
  const numRequests = Math.min(count, Math.max(3, Math.floor(eligibleUsers.length * 0.2)))
  
  const selectedUsers = eligibleUsers
    .sort(() => Math.random() - 0.5)
    .slice(0, numRequests)
  
  console.log('🔔 GENERATING INITIAL REQUESTS:', {
    totalDemoUsers: demoUsers.length,
    eligibleUsers: eligibleUsers.length,
    numRequests,
    myProfile: {
      gender: myProfile.gender,
      age: myProfile.age,
      receiveFrom: myProfile.receiveMessagesFrom,
      ageRange: [myProfile.ageRangeMin, myProfile.ageRangeMax]
    }
  })
  
  return selectedUsers.map((user, index) => ({
    id: `initial-req-${Date.now()}-${index}`,
    fromUserId: user.id,
    toUserId: myProfile.id,
    status: 'pending' as const,
    timestamp: Date.now() - Math.floor(Math.random() * 3600000)
  }))
}

export function isPhotoValid(profilePicture?: { capturedAt: number }): boolean {
  if (!profilePicture) return false
  const hoursSinceCapture = (Date.now() - profilePicture.capturedAt) / (1000 * 60 * 60)
  return hoursSinceCapture < 24
}

const CONVERSATION_STARTERS = [
  "Hey! I noticed we're really close by 👋",
  "Hi there! Love this area, do you come here often?",
  "Hey! What brings you around here?",
  "Hi! Beautiful day isn't it?",
  "Hello! Nice to connect with someone nearby 😊",
  "Hey! Are you from around here?",
  "Hi! Cool to see someone so close on the map",
  "Hey there! How's your day going?",
  "Hi! This neighborhood is great right?",
  "Hello! Random question - best coffee spot around here?"
]

const CASUAL_RESPONSES = [
  "Yeah, I live nearby! Been here a few years",
  "Just moved here actually, still exploring",
  "I'm here pretty often, love this area",
  "Been around here for a while now",
  "Yes! Born and raised in this neighborhood",
  "Fairly new to the area but really like it",
  "I work nearby so I'm around a lot",
  "Yeah it's a great spot, lots to do",
  "I'm here most weekends, great vibes",
  "Not originally from here but it's grown on me"
]

const FOLLOW_UP_MESSAGES = [
  "That's awesome! Any recommendations for things to do?",
  "Nice! Have you checked out the local spots?",
  "Cool! We should grab coffee sometime",
  "That's great! Always nice to meet neighbors",
  "Oh nice! What do you like most about it?",
  "Interesting! What brought you here?",
  "Sweet! Maybe we can explore together sometime",
  "That's cool! I'm always looking for new places",
  "Awesome! Know any good restaurants nearby?",
  "Nice to meet you! This area has such good energy"
]

const ENTHUSIASTIC_REPLIES = [
  "Definitely! I know some great places",
  "For sure! There's this amazing spot on the corner",
  "Yeah! I'd be down to meet up",
  "Absolutely! I'm free this weekend",
  "Love that idea! When works for you?",
  "I'd like that! Want to exchange plans?",
  "Sure thing! Let me know what you're into",
  "That sounds fun! I'm usually free after 6",
  "Sounds good! I'm around pretty often",
  "Yeah let's do it! This weekend maybe?"
]

const SMALL_TALK = [
  "Have you been to that new place that opened up?",
  "The weather has been perfect lately",
  "Do you know if there are any events coming up?",
  "I love walking around here in the evening",
  "Have you tried any of the local cafes?",
  "The sunset views from here are incredible",
  "Is it usually this busy around here?",
  "I've been meaning to explore more of the neighborhood",
  "Have you met many people through this app?",
  "This is such a cool way to connect with locals"
]

export function generateDemoMessages(
  conversationId: string,
  user1Id: string,
  user2Id: string,
  messageCount: number = 8
) {
  const messages: any[] = []
  const now = Date.now()
  const oneDayMs = 24 * 60 * 60 * 1000
  const baseTime = now - Math.random() * oneDayMs * 3
  
  let currentSender = Math.random() > 0.5 ? user1Id : user2Id
  let timeOffset = 0
  
  for (let i = 0; i < messageCount; i++) {
    let messageText = ''
    
    if (i === 0) {
      messageText = CONVERSATION_STARTERS[Math.floor(Math.random() * CONVERSATION_STARTERS.length)]
    } else if (i === 1) {
      messageText = CASUAL_RESPONSES[Math.floor(Math.random() * CASUAL_RESPONSES.length)]
    } else if (i === 2) {
      messageText = FOLLOW_UP_MESSAGES[Math.floor(Math.random() * FOLLOW_UP_MESSAGES.length)]
    } else if (i === 3) {
      messageText = ENTHUSIASTIC_REPLIES[Math.floor(Math.random() * ENTHUSIASTIC_REPLIES.length)]
    } else {
      messageText = SMALL_TALK[Math.floor(Math.random() * SMALL_TALK.length)]
    }
    
    timeOffset += Math.floor(Math.random() * 15 * 60 * 1000) + 30000
    
    messages.push({
      id: `msg-demo-${conversationId}-${i}`,
      conversationId,
      senderId: currentSender,
      text: messageText,
      timestamp: baseTime + timeOffset
    })
    
    currentSender = currentSender === user1Id ? user2Id : user1Id
  }
  
  return messages
}

export function generateDemoConversationsAndMessages(
  myProfile: UserProfile,
  demoUsers: UserProfile[],
  conversationCount: number = 5
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
    
    const userReceivesList = user.receiveMessagesFrom || []
    const myReceivesList = myProfile.receiveMessagesFrom || []
    
    const canMessage = 
      userReceivesList.includes(myProfile.gender) &&
      user.ageRangeMin <= myProfile.age &&
      user.ageRangeMax >= myProfile.age &&
      myReceivesList.includes(user.gender) &&
      myProfile.ageRangeMin <= user.age &&
      myProfile.ageRangeMax >= user.age
    
    return canMessage
  })
  
  const selectedUsers = eligibleUsers
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(conversationCount, eligibleUsers.length))
  
  const conversations: any[] = []
  const chatRequests: any[] = []
  const allMessages: Record<string, any[]> = {}
  
  selectedUsers.forEach((user, index) => {
    const conversationId = [myProfile.id, user.id].sort().join('-')
    
    const messageCount = Math.floor(Math.random() * 8) + 4
    const messages = generateDemoMessages(conversationId, myProfile.id, user.id, messageCount)
    
    allMessages[conversationId] = messages
    
    const lastMessage = messages[messages.length - 1]
    
    conversations.push({
      id: conversationId,
      participants: [myProfile.id, user.id] as [string, string],
      lastMessage,
      unreadCount: 0
    })
    
    chatRequests.push({
      id: `demo-req-${conversationId}`,
      fromUserId: Math.random() > 0.5 ? myProfile.id : user.id,
      toUserId: Math.random() > 0.5 ? user.id : myProfile.id,
      status: 'accepted' as const,
      timestamp: messages[0].timestamp - 60000
    })
  })
  
  console.log('💬 GENERATED DEMO CONVERSATIONS:', {
    conversationCount: conversations.length,
    totalMessages: Object.values(allMessages).flat().length,
    eligibleUsers: eligibleUsers.length
  })
  
  return { conversations, chatRequests, messages: allMessages }
}

export function generateAdditionalChatRequests(
  myProfile: UserProfile,
  demoUsers: UserProfile[],
  existingRequestUserIds: string[],
  count: number = 5
) {
  const eligibleUsers = demoUsers.filter(user => {
    if (existingRequestUserIds.includes(user.id)) return false
    if (!user.isActive || !user.locationSharingEnabled) return false
    
    const distance = calculateDistance(
      myProfile.location.lat,
      myProfile.location.lng,
      user.location.lat,
      user.location.lng
    )
    
    if (distance > 1) return false
    
    const userReceivesList = user.receiveMessagesFrom || []
    const myReceivesList = myProfile.receiveMessagesFrom || []
    
    const canMessage = 
      userReceivesList.includes(myProfile.gender) &&
      user.ageRangeMin <= myProfile.age &&
      user.ageRangeMax >= myProfile.age &&
      myReceivesList.includes(user.gender) &&
      myProfile.ageRangeMin <= user.age &&
      myProfile.ageRangeMax >= user.age
    
    return canMessage
  })
  
  const selectedUsers = eligibleUsers
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(count, eligibleUsers.length))
  
  const requests = selectedUsers.map((user, index) => ({
    id: `additional-req-${Date.now()}-${index}`,
    fromUserId: user.id,
    toUserId: myProfile.id,
    status: 'pending' as const,
    timestamp: Date.now() - Math.floor(Math.random() * 7200000)
  }))
  
  console.log('🔔 GENERATED ADDITIONAL REQUESTS:', {
    requestCount: requests.length,
    eligibleUsers: eligibleUsers.length,
    existingRequests: existingRequestUserIds.length
  })
  
  return requests
}
