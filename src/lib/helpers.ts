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
    
    let radiusKm: number
    if (i < count * 0.7) {
      radiusKm = Math.random() * 0.5
    } else if (i < count * 0.9) {
      radiusKm = 0.5 + Math.random() * 0.5
    } else {
      radiusKm = 1.0 + Math.random() * 0.5
    }
    
    const latOffset = (radiusKm / 111) * Math.cos(angle)
    const lngOffset = (radiusKm / (111 * Math.cos((CENTER_LAT * Math.PI) / 180))) * Math.sin(angle)
    
    const lat = CENTER_LAT + latOffset
    const lng = CENTER_LNG + lngOffset
    const age = 18 + Math.floor(Math.random() * 63)
    const gender = GENDERS[Math.floor(Math.random() * GENDERS.length)]
    const name = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]
    
    const capturedAt = Date.now() - Math.floor(Math.random() * 12 * 60 * 60 * 1000)
    
    const allGenders = ['Male', 'Female', 'Non-binary', 'Other']
    const numGendersToReceive = Math.random() > 0.15 ? allGenders.length : Math.floor(Math.random() * 3) + 1
    const shuffledGenders = [...allGenders].sort(() => Math.random() - 0.5)
    const receiveFrom = shuffledGenders.slice(0, numGendersToReceive)
    
    const minAge = Math.max(18, age - 20 - Math.floor(Math.random() * 10))
    const maxAge = Math.min(100, age + 20 + Math.floor(Math.random() * 30))
    
    users.push({
      id: `user-demo-${i + 1}-${timestamp}`,
      name,
      age,
      gender,
      receiveMessagesFrom: receiveFrom,
      ageRangeMin: minAge,
      ageRangeMax: Math.min(maxAge, 100),
      location: { lat, lng },
      isActive: true,
      lastActive: Date.now() - Math.floor(Math.random() * 3600000),
      locationSharingEnabled: true,
      requireApproval: i % 3 !== 0,
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
  "Hello! Random question - best coffee spot around here?",
  "Hey! Just moved to the area, any recommendations?",
  "Hi there! Always cool to meet people nearby",
  "Hey! Love finding local connections on here",
  "Hi! Have you lived here long?",
  "Hello! This area has such good vibes",
  "Hey! Small world, we're super close by",
  "Hi! Do you know the area well?",
  "Hey there! Nice to meet a neighbor",
  "Hi! What's your favorite thing about this area?",
  "Hello! I've been meaning to explore more around here"
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
  "Not originally from here but it's grown on me",
  "Yeah! I moved here last year and love it",
  "Been living here my whole life pretty much",
  "I'm around here all the time, it's home",
  "Just a few months but already feel settled",
  "Yeah, couldn't imagine living anywhere else",
  "I spend a lot of time in this area for sure",
  "It's been my neighborhood for years now",
  "Recently moved but already loving it",
  "Yeah I know it pretty well at this point",
  "I'm local, happy to share recommendations!"
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
  "Nice to meet you! This area has such good energy",
  "That's so cool! I'd love some local tips",
  "Amazing! What's your favorite spot around here?",
  "Nice! I'm still discovering hidden gems",
  "That's great! Any places I should definitely check out?",
  "Cool! Would love to hear your favorite spots",
  "Sweet! I need some good recommendations",
  "Nice! What would you say is a must-see?",
  "That's awesome! I'm always up for exploring",
  "Great! I love hearing from people who know the area",
  "Nice! Would you want to show me around sometime?"
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
  "Yeah let's do it! This weekend maybe?",
  "I'm totally down! Just say when",
  "That would be great! I love meeting new people",
  "For sure! I know this perfect place",
  "Absolutely! Let me show you my favorites",
  "I'd really enjoy that! Name the time",
  "Yes! I've been wanting to show someone around",
  "Count me in! What day works best?",
  "I'm so down! There's so much to see",
  "Definitely interested! Let's make it happen",
  "That sounds perfect! I know just the spot"
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
  "This is such a cool way to connect with locals",
  "What do you usually do on weekends?",
  "I heard there's a great farmers market nearby",
  "Do you have any favorite hidden spots?",
  "The community here seems really friendly",
  "Have you checked out the park area?",
  "I love how walkable this neighborhood is",
  "Are there any good happy hour spots?",
  "What kind of food do you usually go for?",
  "I'm always looking for good brunch places",
  "Do you know any good spots for live music?",
  "The local shops here are so unique",
  "Have you been to any neighborhood events?",
  "I love the vibe around here",
  "Are you into outdoor activities at all?",
  "What brought you to this area originally?",
  "Do you work from home or commute?",
  "I'm trying to get more involved locally",
  "Any good workout spots you'd recommend?",
  "I've been wanting to try that restaurant",
  "The architecture around here is beautiful"
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
  const baseTime = now - Math.random() * oneDayMs * 5
  
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
      const allOptions = [...SMALL_TALK, ...CASUAL_RESPONSES, ...FOLLOW_UP_MESSAGES]
      messageText = allOptions[Math.floor(Math.random() * allOptions.length)]
    }
    
    const minGap = 30000
    const maxGap = Math.random() > 0.7 ? 60 * 60 * 1000 : 20 * 60 * 1000
    timeOffset += Math.floor(Math.random() * (maxGap - minGap)) + minGap
    
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
  console.log('🔍 DEBUG CONVERSATION GENERATION - START', {
    myProfile: {
      id: myProfile.id,
      gender: myProfile.gender,
      age: myProfile.age,
      receiveFrom: myProfile.receiveMessagesFrom,
      ageRange: [myProfile.ageRangeMin, myProfile.ageRangeMax],
      location: myProfile.location
    },
    totalDemoUsers: demoUsers.length,
    requestedConversations: conversationCount
  })

  const eligibleUsers = demoUsers.filter(user => {
    if (user.id === myProfile.id) return false
    if (!user.isActive) return false
    if (!user.locationSharingEnabled) return false
    
    const distance = calculateDistance(
      myProfile.location.lat,
      myProfile.location.lng,
      user.location.lat,
      user.location.lng
    )
    
    if (distance > 10) return false
    
    const userReceivesList = user.receiveMessagesFrom || []
    const myReceivesList = myProfile.receiveMessagesFrom || []
    
    const userAcceptsMyGender = userReceivesList.includes(myProfile.gender)
    const myAgeInTheirRange = user.ageRangeMin <= myProfile.age && user.ageRangeMax >= myProfile.age
    const iAcceptTheirGender = myReceivesList.includes(user.gender)
    const theirAgeInMyRange = myProfile.ageRangeMin <= user.age && myProfile.ageRangeMax >= user.age
    
    const canMessage = userAcceptsMyGender && myAgeInTheirRange && iAcceptTheirGender && theirAgeInMyRange
    
    return canMessage
  })
  
  const afterSelf = demoUsers.filter(u => u.id !== myProfile.id)
  const afterActive = afterSelf.filter(u => u.isActive)
  const afterLocationSharing = afterActive.filter(u => u.locationSharingEnabled)
  const afterDistance = afterLocationSharing.filter(u => {
    const dist = calculateDistance(myProfile.location.lat, myProfile.location.lng, u.location.lat, u.location.lng)
    return dist <= 10
  })
  
  const failedChecks = afterDistance.filter(u => {
    const userReceivesList = u.receiveMessagesFrom || []
    const myReceivesList = myProfile.receiveMessagesFrom || []
    
    const userAcceptsMyGender = userReceivesList.includes(myProfile.gender)
    const myAgeInTheirRange = u.ageRangeMin <= myProfile.age && u.ageRangeMax >= myProfile.age
    const iAcceptTheirGender = myReceivesList.includes(u.gender)
    const theirAgeInMyRange = myProfile.ageRangeMin <= u.age && myProfile.ageRangeMax >= u.age
    
    const passes = userAcceptsMyGender && myAgeInTheirRange && iAcceptTheirGender && theirAgeInMyRange
    return !passes
  })
  
  console.log('🔍 ELIGIBLE USERS FOR CONVERSATIONS - DETAILED:', {
    count: eligibleUsers.length,
    requestedCount: conversationCount,
    myProfile: {
      id: myProfile.id,
      gender: myProfile.gender,
      age: myProfile.age,
      receiveFrom: myProfile.receiveMessagesFrom,
      ageRange: [myProfile.ageRangeMin, myProfile.ageRangeMax],
      location: myProfile.location
    },
    totalDemoUsers: demoUsers.length,
    filterBreakdown: {
      afterSelfFilter: afterSelf.length,
      afterActiveFilter: afterActive.length,
      afterLocationSharingFilter: afterLocationSharing.length,
      afterDistanceFilter: afterDistance.length,
      finalEligible: eligibleUsers.length,
      failedMatchingChecks: afterDistance.length - eligibleUsers.length
    },
    failedMatchesBreakdown: failedChecks.slice(0, 10).map(u => {
      const userReceivesList = u.receiveMessagesFrom || []
      const myReceivesList = myProfile.receiveMessagesFrom || []
      
      return {
        name: u.name,
        gender: u.gender,
        age: u.age,
        distance: calculateDistance(myProfile.location.lat, myProfile.location.lng, u.location.lat, u.location.lng).toFixed(4) + 'km',
        receiveFrom: u.receiveMessagesFrom,
        ageRange: [u.ageRangeMin, u.ageRangeMax],
        checks: {
          theyAcceptMyGender: userReceivesList.includes(myProfile.gender),
          myAgeInTheirRange: u.ageRangeMin <= myProfile.age && u.ageRangeMax >= myProfile.age,
          iAcceptTheirGender: myReceivesList.includes(u.gender),
          theirAgeInMyRange: myProfile.ageRangeMin <= u.age && myProfile.ageRangeMax >= u.age
        }
      }
    }),
    eligibleSample: eligibleUsers.slice(0, 10).map(u => ({
      name: u.name,
      gender: u.gender,
      age: u.age,
      distance: calculateDistance(myProfile.location.lat, myProfile.location.lng, u.location.lat, u.location.lng).toFixed(4) + 'km',
      receiveFrom: u.receiveMessagesFrom,
      ageRange: [u.ageRangeMin, u.ageRangeMax],
      requireApproval: u.requireApproval
    }))
  })

  const selectedUsers = eligibleUsers
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(conversationCount, eligibleUsers.length))
  
  const conversations: any[] = []
  const chatRequests: any[] = []
  const allMessages: Record<string, any[]> = {}
  
  selectedUsers.forEach((user, index) => {
    const conversationId = [myProfile.id, user.id].sort().join('-')
    
    const messageCount = Math.floor(Math.random() * 20) + 10
    const messages = generateDemoMessages(conversationId, myProfile.id, user.id, messageCount)
    
    allMessages[conversationId] = messages
    
    const lastMessage = messages[messages.length - 1]
    
    conversations.push({
      id: conversationId,
      participants: [myProfile.id, user.id] as [string, string],
      lastMessage,
      unreadCount: 0
    })
    
    const whoInitiated = Math.random() > 0.5 ? myProfile.id : user.id
    const whoReceived = whoInitiated === myProfile.id ? user.id : myProfile.id
    
    chatRequests.push({
      id: `demo-req-${conversationId}`,
      fromUserId: whoInitiated,
      toUserId: whoReceived,
      status: 'accepted' as const,
      timestamp: messages[0].timestamp - 60000
    })
  })
  
  console.log('💬 GENERATED DEMO CONVERSATIONS:', {
    conversationCount: conversations.length,
    totalMessages: Object.values(allMessages).flat().length,
    eligibleUsers: eligibleUsers.length,
    attemptedCount: conversationCount,
    myProfile: {
      id: myProfile.id,
      location: myProfile.location,
      gender: myProfile.gender,
      age: myProfile.age,
      receiveFrom: myProfile.receiveMessagesFrom,
      ageRange: [myProfile.ageRangeMin, myProfile.ageRangeMax]
    },
    sampleConversations: conversations.slice(0, 3).map(c => {
      const otherUserId = c.participants.find((id: string) => id !== myProfile.id)
      const otherUser = demoUsers.find(u => u.id === otherUserId)
      return {
        id: c.id,
        with: otherUser?.name,
        messageCount: allMessages[c.id]?.length || 0,
        lastMessage: c.lastMessage?.text.substring(0, 30) + '...'
      }
    }),
    sampleEligibleUsers: eligibleUsers.slice(0, 5).map(u => ({
      name: u.name,
      distance: calculateDistance(myProfile.location.lat, myProfile.location.lng, u.location.lat, u.location.lng).toFixed(4) + 'km',
      gender: u.gender,
      age: u.age,
      requireApproval: u.requireApproval
    }))
  })
  
  return { conversations, chatRequests, messages: allMessages }
}

export function generateAdditionalChatRequests(
  myProfile: UserProfile,
  demoUsers: UserProfile[],
  existingRequestUserIds: string[],
  count: number = 5
) {
  console.log('🔔 DEBUG ADDITIONAL REQUESTS - START', {
    myProfile: {
      id: myProfile.id,
      gender: myProfile.gender,
      age: myProfile.age,
      receiveFrom: myProfile.receiveMessagesFrom,
      ageRange: [myProfile.ageRangeMin, myProfile.ageRangeMax],
      location: myProfile.location
    },
    totalDemoUsers: demoUsers.length,
    existingUserIds: existingRequestUserIds.length,
    requestedCount: count
  })

  const eligibleUsers = demoUsers.filter(user => {
    if (user.id === myProfile.id) return false
    if (existingRequestUserIds.includes(user.id)) return false
    if (!user.isActive) return false
    if (!user.locationSharingEnabled) return false
    
    const distance = calculateDistance(
      myProfile.location.lat,
      myProfile.location.lng,
      user.location.lat,
      user.location.lng
    )
    
    if (distance > 10) return false
    
    const userReceivesList = user.receiveMessagesFrom || []
    const myReceivesList = myProfile.receiveMessagesFrom || []
    
    const userAcceptsMyGender = userReceivesList.includes(myProfile.gender)
    const myAgeInTheirRange = user.ageRangeMin <= myProfile.age && user.ageRangeMax >= myProfile.age
    const iAcceptTheirGender = myReceivesList.includes(user.gender)
    const theirAgeInMyRange = myProfile.ageRangeMin <= user.age && myProfile.ageRangeMax >= user.age
    
    const canMessage = userAcceptsMyGender && myAgeInTheirRange && iAcceptTheirGender && theirAgeInMyRange
    
    return canMessage
  })
  
  const afterSelf = demoUsers.filter(u => u.id !== myProfile.id)
  const afterExisting = afterSelf.filter(u => !existingRequestUserIds.includes(u.id))
  const afterActive = afterExisting.filter(u => u.isActive)
  const afterLocationSharing = afterActive.filter(u => u.locationSharingEnabled)
  const afterDistance = afterLocationSharing.filter(u => {
    const dist = calculateDistance(myProfile.location.lat, myProfile.location.lng, u.location.lat, u.location.lng)
    return dist <= 10
  })
  
  console.log('🔔 ADDITIONAL REQUESTS - FILTER BREAKDOWN:', {
    afterSelfFilter: afterSelf.length,
    afterExistingFilter: afterExisting.length,
    afterActiveFilter: afterActive.length,
    afterLocationSharingFilter: afterLocationSharing.length,
    afterDistanceFilter: afterDistance.length,
    finalEligible: eligibleUsers.length,
    failedMatchingChecks: afterDistance.length - eligibleUsers.length
  })
  
  const numRequestsToMe = Math.ceil(count * 0.85)
  const numRequestsFromMe = count - numRequestsToMe
  
  const selectedUsersForRequestsToMe = eligibleUsers
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(numRequestsToMe, eligibleUsers.length))
  
  const remainingUsers = eligibleUsers.filter(u => !selectedUsersForRequestsToMe.includes(u))
  
  const selectedUsersForRequestsFromMe = remainingUsers
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.min(numRequestsFromMe, remainingUsers.length))
  
  const requestsToMe = selectedUsersForRequestsToMe.map((user, index) => ({
    id: `pending-req-to-me-${Date.now()}-${index}`,
    fromUserId: user.id,
    toUserId: myProfile.id,
    status: 'pending' as const,
    timestamp: Date.now() - Math.floor(Math.random() * 7200000)
  }))
  
  const requestsFromMe = selectedUsersForRequestsFromMe.map((user, index) => ({
    id: `pending-req-from-me-${Date.now()}-${index}`,
    fromUserId: myProfile.id,
    toUserId: user.id,
    status: 'pending' as const,
    timestamp: Date.now() - Math.floor(Math.random() * 7200000)
  }))
  
  const allRequests = [...requestsToMe, ...requestsFromMe]
  
  console.log('🔔 GENERATED ADDITIONAL REQUESTS - COMPLETE:', {
    totalRequestCount: allRequests.length,
    requestsToMe: requestsToMe.length,
    requestsFromMe: requestsFromMe.length,
    eligibleUsers: eligibleUsers.length,
    existingRequestUserIds: existingRequestUserIds.length,
    attemptedCount: count,
    myProfile: {
      requireApproval: myProfile.requireApproval,
      gender: myProfile.gender,
      age: myProfile.age,
      receiveFrom: myProfile.receiveMessagesFrom,
      ageRange: [myProfile.ageRangeMin, myProfile.ageRangeMax],
      location: myProfile.location
    },
    sampleRequestsToMe: requestsToMe.slice(0, 3).map(r => {
      const user = demoUsers.find(u => u.id === r.fromUserId)
      return {
        id: r.id,
        from: user?.name,
        fromGender: user?.gender,
        fromAge: user?.age,
        theyRequireApproval: user?.requireApproval
      }
    }),
    sampleRequestsFromMe: requestsFromMe.slice(0, 3).map(r => {
      const user = demoUsers.find(u => u.id === r.toUserId)
      return {
        id: r.id,
        to: user?.name,
        toGender: user?.gender,
        toAge: user?.age,
        theyRequireApproval: user?.requireApproval
      }
    }),
    sampleEligibleUsers: eligibleUsers.slice(0, 5).map(u => ({
      name: u.name,
      distance: calculateDistance(myProfile.location.lat, myProfile.location.lng, u.location.lat, u.location.lng).toFixed(4) + 'km',
      gender: u.gender,
      age: u.age,
      requiresApproval: u.requireApproval,
      checks: {
        theyAcceptMyGender: u.receiveMessagesFrom.includes(myProfile.gender),
        myAgeInTheirRange: u.ageRangeMin <= myProfile.age && u.ageRangeMax >= myProfile.age,
        iAcceptTheirGender: myProfile.receiveMessagesFrom.includes(u.gender),
        theirAgeInMyRange: myProfile.ageRangeMin <= u.age && myProfile.ageRangeMax >= u.age
      }
    }))
  })
  
  return allRequests
}
