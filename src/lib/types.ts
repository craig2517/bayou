export interface UserProfile {
  id: string
  name: string
  age: number
  gender: string
  receiveMessagesFrom: string[]
  relationshipStatusPreference: string[]
  ageRangeMin: number
  ageRangeMax: number
  location: {
    lat: number
    lng: number
  }
  isActive: boolean
  lastActive: number
  locationSharingEnabled: boolean
  requireApproval: boolean
  isSingle?: boolean
  showReceiveMessagesFrom?: boolean
  showAgeRange?: boolean
  profilePicture?: {
    dataUrl: string
    capturedAt: number
  }
}

export interface ChatRequest {
  id: string
  fromUserId: string
  toUserId: string
  status: 'pending' | 'accepted' | 'declined'
  timestamp: number
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  text: string
  timestamp: number
}

export interface Conversation {
  id: string
  participants: [string, string]
  lastMessage?: Message
  unreadCount: number
}

export interface HeatMapPoint {
  lat: number
  lng: number
  intensity: number
}
