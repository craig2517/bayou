import { useState, useEffect, useMemo, useRef } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { Toaster } from '@/components/ui/sonner'
import { MapTrifold, MagnifyingGlass, ChatCircle, User, Check, X, MapPin, ArrowsClockwise, Trash } from '@phosphor-icons/react'
import { HeatMap } from '@/components/HeatMap'
import { UserCard } from '@/components/UserCard'
import { ProfileForm } from '@/components/ProfileForm'
import { ChatInterface } from '@/components/ChatInterface'
import { UserProfileView } from '@/components/UserProfileView'
import { generateDemoUsers, calculateDistance, generateHeatMapData, formatDistance, generateInitialChatRequests, getRandomLocationNearCenter, isPhotoValid, CENTER_LAT, CENTER_LNG, generateDemoConversationsAndMessages, generateAdditionalChatRequests } from '@/lib/helpers'
import { toast } from 'sonner'
import type { UserProfile, ChatRequest, Message, Conversation } from '@/lib/types'

function App() {
  const [myProfile, setMyProfile] = useKV<UserProfile | null>('my-profile-v4', null)
  const [demoUsers, setDemoUsers] = useState(() => generateDemoUsers(2000))
  const [chatRequests, setChatRequests] = useKV<ChatRequest[]>('chat-requests-v4', [])
  const [conversations, setConversations] = useKV<Conversation[]>('conversations-v4', [])
  const [messages, setMessages] = useKV<Record<string, Message[]>>('messages-v4', {})
  const [searchRadius, setSearchRadius] = useState([0.8])
  const [selectedTab, setSelectedTab] = useState('map')
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [pendingRequestUser, setPendingRequestUser] = useState<UserProfile | null>(null)
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null)
  const [viewingUserDistance, setViewingUserDistance] = useState<string | undefined>(undefined)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const dataGeneratedRef = useRef(false)
  const initialLoadCompleteRef = useRef(false)

  const isProfilePhotoValid = (user: UserProfile | null) => {
    return user?.profilePicture ? isPhotoValid(user.profilePicture) : false
  }

  useEffect(() => {
    if (!myProfile || dataGeneratedRef.current || initialLoadCompleteRef.current) return

    const conversationArray = Array.isArray(conversations) ? conversations : []
    const requestArray = Array.isArray(chatRequests) ? chatRequests : []
    
    if (conversationArray.length > 0 || requestArray.length > 0) {
      dataGeneratedRef.current = true
      initialLoadCompleteRef.current = true
      return
    }

    dataGeneratedRef.current = true
    initialLoadCompleteRef.current = true
    
    const timer = setTimeout(() => {
      const demoData = generateDemoConversationsAndMessages(myProfile, demoUsers, 15)
      
      if (demoData.conversations.length === 0) {
        toast.error('No compatible users found', {
          description: 'Try adjusting your profile preferences',
          duration: 5000
        })
        return
      }
      
      const existingUserIds = [
        ...demoData.conversations.flatMap(c => c.participants),
        ...demoData.chatRequests.map(r => r.fromUserId),
        ...demoData.chatRequests.map(r => r.toUserId)
      ].filter(id => id !== myProfile.id)
      
      const uniqueExistingUserIds = [...new Set(existingUserIds)]
      const pendingRequests = generateAdditionalChatRequests(myProfile, demoUsers, uniqueExistingUserIds, 25)
      const allChatRequests = [...demoData.chatRequests, ...pendingRequests]
      
      const autoAcceptedRequests = pendingRequests.filter(r => r.status === 'accepted')
      const newConversations = autoAcceptedRequests.map(request => {
        const conversationId = [request.fromUserId, request.toUserId].sort().join('-')
        return {
          id: conversationId,
          participants: [request.fromUserId, request.toUserId] as [string, string],
          unreadCount: 0
        }
      })
      
      setConversations([...demoData.conversations, ...newConversations])
      setChatRequests(allChatRequests)
      setMessages(demoData.messages)
      
      const pendingToMe = allChatRequests.filter(r => r.toUserId === myProfile.id && r.status === 'pending')
      
      toast.success(`${demoData.conversations.length + newConversations.length} conversations and ${pendingToMe.length} requests loaded!`, {
        description: 'Check Messages and Requests tabs',
        duration: 4000
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [myProfile])

  const heatMapData = useMemo(() => generateHeatMapData(demoUsers), [demoUsers])

  const nearbyUsers = useMemo(() => {
    if (!myProfile) return []
    
    const eligibleDemoUsers = demoUsers.filter(user => 
      user.id !== myProfile.id && user.isActive && user.locationSharingEnabled
    )
    
    const allUsersWithDistance = eligibleDemoUsers.map(user => {
      const distance = calculateDistance(
        myProfile.location.lat,
        myProfile.location.lng,
        user.location.lat,
        user.location.lng
      )
      
      const userReceivesList = user.receiveMessagesFrom || []
      const myReceivesList = myProfile.receiveMessagesFrom || []
      
      const userAcceptsMe = userReceivesList.includes(myProfile.gender)
      const userAgeMatchesMe = user.ageRangeMin <= myProfile.age && user.ageRangeMax >= myProfile.age
      const iAcceptUser = myReceivesList.includes(user.gender)
      const myAgeMatchesUser = myProfile.ageRangeMin <= user.age && myProfile.ageRangeMax >= user.age
      
      const userRelationshipPrefs = user.relationshipStatusPreference || ['Single', 'Not Single', 'Prefer not to say']
      const myRelationshipPrefs = myProfile.relationshipStatusPreference || ['Single', 'Not Single', 'Prefer not to say']
      
      const getEffectiveStatus = (isSingle: boolean | undefined): string => {
        if (isSingle === undefined) return 'Prefer not to say'
        return isSingle ? 'Single' : 'Not Single'
      }
      
      const myEffectiveStatus = getEffectiveStatus(myProfile.isSingle)
      const userEffectiveStatus = getEffectiveStatus(user.isSingle)
      
      const userAcceptsMyRelationshipStatus = userRelationshipPrefs.includes('Prefer not to say') || userRelationshipPrefs.includes(myEffectiveStatus)
      const iAcceptUserRelationshipStatus = myRelationshipPrefs.includes('Prefer not to say') || myRelationshipPrefs.includes(userEffectiveStatus)
      
      const canMessage = userAcceptsMe && userAgeMatchesMe && iAcceptUser && myAgeMatchesUser && userAcceptsMyRelationshipStatus && iAcceptUserRelationshipStatus
      
      return { user, distance, canMessage, userAcceptsMe, userAgeMatchesMe, iAcceptUser, myAgeMatchesUser }
    })
    
    const sortedByDistance = allUsersWithDistance.sort((a, b) => a.distance - b.distance)
    const inRadiusUsers = sortedByDistance.filter(item => item.distance <= searchRadius[0] && item.canMessage)
    
    return inRadiusUsers
  }, [myProfile, demoUsers, searchRadius])

  const pendingIncomingRequests = useMemo(() => {
    const requestArray = Array.isArray(chatRequests) ? chatRequests : []
    if (!myProfile) return []
    
    if (!myProfile.requireApproval) return []
    
    return requestArray.filter(req => 
      req && 
      req.toUserId === myProfile.id && 
      req.status === 'pending'
    )
  }, [chatRequests, myProfile])

  const handleSaveProfile = (profileData: Omit<UserProfile, 'id' | 'location' | 'isActive' | 'lastActive'>) => {
    const isNewProfile = !myProfile
    const wasRequiringApproval = myProfile?.requireApproval ?? false
    const nowRequiresApproval = profileData.requireApproval ?? false
    
    const newProfile: UserProfile = {
      ...profileData,
      id: myProfile?.id || `user-current-${Date.now()}`,
      location: myProfile?.location || getRandomLocationNearCenter(),
      isActive: true,
      lastActive: Date.now()
    }
    
    if (isNewProfile) {
      dataGeneratedRef.current = false
      initialLoadCompleteRef.current = false
      setChatRequests([])
      setConversations([])
      setMessages({})
    }
    
    if (!isNewProfile && wasRequiringApproval && !nowRequiresApproval) {
      const requestArray = Array.isArray(chatRequests) ? chatRequests : []
      const pendingRequests = requestArray.filter(
        req => req && req.toUserId === newProfile.id && req.status === 'pending'
      )
      
      if (pendingRequests.length > 0) {
        const updatedRequests = requestArray.map(req => 
          req && req.toUserId === newProfile.id && req.status === 'pending'
            ? { ...req, status: 'accepted' as const }
            : req
        )
        
        const newConversations = pendingRequests.map(request => {
          const conversationId = [request.fromUserId, request.toUserId].sort().join('-')
          return {
            id: conversationId,
            participants: [request.fromUserId, request.toUserId] as [string, string],
            unreadCount: 0
          }
        })
        
        setChatRequests(updatedRequests)
        
        setConversations(current => {
          const currentArray = Array.isArray(current) ? current : []
          const existingConvIds = new Set(currentArray.map(c => c.id))
          const uniqueNewConvs = newConversations.filter(nc => !existingConvIds.has(nc.id))
          return [...currentArray, ...uniqueNewConvs]
        })
        
        toast.success(`${pendingRequests.length} pending request${pendingRequests.length > 1 ? 's' : ''} auto-approved!`, {
          description: 'All pending requests are now active conversations',
          duration: 4000
        })
      }
    }
    
    setMyProfile(newProfile)
    setShowProfileDialog(false)
    
    if (isNewProfile) {
      toast.success('Profile created! Generating demo data...', {
        duration: 3000
      })
      setTimeout(() => setSelectedTab('messages'), 3000)
    } else {
      toast.success('Profile updated!')
    }
  }

  const handleSendChatRequest = (toUser: UserProfile) => {
    if (!myProfile) {
      toast.error('Please complete your profile first')
      return
    }

    const userReceivesList = toUser.receiveMessagesFrom || []
    const myReceivesList = myProfile.receiveMessagesFrom || []
    
    const userRelationshipPrefs = toUser.relationshipStatusPreference || ['Single', 'Not Single', 'Prefer not to say']
    const myRelationshipPrefs = myProfile.relationshipStatusPreference || ['Single', 'Not Single', 'Prefer not to say']
    
    const getEffectiveStatus = (isSingle: boolean | undefined): string => {
      if (isSingle === undefined) return 'Prefer not to say'
      return isSingle ? 'Single' : 'Not Single'
    }
    
    const myEffectiveStatus = getEffectiveStatus(myProfile.isSingle)
    const userEffectiveStatus = getEffectiveStatus(toUser.isSingle)
    
    const userAcceptsMyRelationshipStatus = userRelationshipPrefs.includes('Prefer not to say') || userRelationshipPrefs.includes(myEffectiveStatus)
    const iAcceptUserRelationshipStatus = myRelationshipPrefs.includes('Prefer not to say') || myRelationshipPrefs.includes(userEffectiveStatus)

    const canMessage = 
      userReceivesList.includes(myProfile.gender) &&
      toUser.ageRangeMin <= myProfile.age &&
      toUser.ageRangeMax >= myProfile.age &&
      myReceivesList.includes(toUser.gender) &&
      myProfile.ageRangeMin <= toUser.age &&
      myProfile.ageRangeMax >= toUser.age &&
      userAcceptsMyRelationshipStatus &&
      iAcceptUserRelationshipStatus

    if (!canMessage) {
      toast.error('Your preferences do not match with this user')
      return
    }

    const requestArray = Array.isArray(chatRequests) ? chatRequests : []
    const existingRequest = requestArray.find(
      req =>
        (req.fromUserId === myProfile.id && req.toUserId === toUser.id) ||
        (req.fromUserId === toUser.id && req.toUserId === myProfile.id)
    )

    if (existingRequest) {
      if (existingRequest.status === 'accepted') {
        const convId = [myProfile.id, toUser.id].sort().join('-')
        setSelectedConversation(convId)
        setSelectedTab('messages')
        return
      }
      toast.info('Request already sent')
      return
    }

    const conversationId = [myProfile.id, toUser.id].sort().join('-')
    
    if (!toUser.requireApproval) {
      const autoAcceptedRequest: ChatRequest = {
        id: `req-${Date.now()}`,
        fromUserId: myProfile.id,
        toUserId: toUser.id,
        status: 'accepted',
        timestamp: Date.now()
      }

      setChatRequests(current => {
        const currentArray = Array.isArray(current) ? current : []
        return [...currentArray, autoAcceptedRequest]
      })

      const newConversation: Conversation = {
        id: conversationId,
        participants: [myProfile.id, toUser.id] as [string, string],
        unreadCount: 0
      }
      setConversations(current => {
        const currentArray = Array.isArray(current) ? current : []
        return [...currentArray, newConversation]
      })

      setSelectedConversation(conversationId)
      setSelectedTab('messages')
      toast.success(`You can now message ${toUser.name}!`)
      return
    }

    const newRequest: ChatRequest = {
      id: `req-${Date.now()}`,
      fromUserId: myProfile.id,
      toUserId: toUser.id,
      status: 'pending',
      timestamp: Date.now()
    }

    setChatRequests(current => {
      const currentArray = Array.isArray(current) ? current : []
      return [...currentArray, newRequest]
    })
    setPendingRequestUser(toUser)
    toast.success(`Chat request sent to ${toUser.name}!`)
  }

  const handleAcceptRequest = (request: ChatRequest) => {
    if (!myProfile) return
    
    setChatRequests(current => {
      const currentArray = Array.isArray(current) ? current : []
      return currentArray.map(req => (req.id === request.id ? { ...req, status: 'accepted' as const } : req))
    })

    const conversationId = [request.fromUserId, request.toUserId].sort().join('-')
    
    setConversations(current => {
      const currentArray = Array.isArray(current) ? current : []
      const existingConv = currentArray.find(c => c.id === conversationId)
      if (!existingConv) {
        const newConversation: Conversation = {
          id: conversationId,
          participants: [request.fromUserId, request.toUserId] as [string, string],
          unreadCount: 0
        }
        return [...currentArray, newConversation]
      }
      return currentArray
    })

    toast.success('Chat request accepted!')
  }

  const handleDeclineRequest = (request: ChatRequest) => {
    setChatRequests(current => {
      const currentArray = Array.isArray(current) ? current : []
      return currentArray.map(req => (req.id === request.id ? { ...req, status: 'declined' as const } : req))
    })
    toast.info('Request declined')
  }

  const handleViewUserProfile = (user: UserProfile, distance?: number) => {
    setViewingUser(user)
    setViewingUserDistance(distance !== undefined ? formatDistance(distance) : undefined)
  }

  const handleRefreshUsers = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      const requestArray = Array.isArray(chatRequests) ? chatRequests : []
      const conversationArray = Array.isArray(conversations) ? conversations : []
      
      const existingRequestIds = requestArray.map(req => [req.fromUserId, req.toUserId])
      const existingConvIds = conversationArray.flatMap(conv => conv.participants)
      const protectedUserIds = [...new Set([...existingConvIds, ...existingRequestIds.flat()])]
      
      const newUsers = generateDemoUsers(2000)
      
      const refreshedUsers = newUsers.map(user => {
        if (protectedUserIds.includes(user.id)) {
          const existingUser = demoUsers.find(u => u.id === user.id)
          return existingUser || user
        }
        return user
      })
      
      setDemoUsers(refreshedUsers)
      setIsRefreshing(false)
      toast.success('Nearby users refreshed!')
    }, 500)
  }

  const handleClearAllData = () => {
    if (!myProfile) {
      toast.error('Create a profile first')
      return
    }
    
    dataGeneratedRef.current = false
    initialLoadCompleteRef.current = false
    
    setChatRequests([])
    setConversations([])
    setMessages({})
    
    setIsGenerating(true)
    
    setTimeout(() => {
      const demoData = generateDemoConversationsAndMessages(myProfile, demoUsers, 15)
      
      if (demoData.conversations.length === 0) {
        setIsGenerating(false)
        toast.error('No compatible users - adjust preferences')
        return
      }
      
      const existingUserIds = [
        ...demoData.conversations.flatMap(c => c.participants),
        ...demoData.chatRequests.map(r => r.fromUserId),
        ...demoData.chatRequests.map(r => r.toUserId)
      ].filter(id => id !== myProfile.id)
      
      const pendingRequests = generateAdditionalChatRequests(myProfile, demoUsers, [...new Set(existingUserIds)], 25)
      const allRequests = [...demoData.chatRequests, ...pendingRequests]
      
      const autoAcceptedRequests = pendingRequests.filter(r => r.status === 'accepted')
      const newConversations = autoAcceptedRequests.map(request => {
        const conversationId = [request.fromUserId, request.toUserId].sort().join('-')
        return {
          id: conversationId,
          participants: [request.fromUserId, request.toUserId] as [string, string],
          unreadCount: 0
        }
      })
      
      setConversations([...demoData.conversations, ...newConversations])
      setChatRequests(allRequests)
      setMessages(demoData.messages)
      
      dataGeneratedRef.current = true
      initialLoadCompleteRef.current = true
      setIsGenerating(false)
      
      const pendingToMe = allRequests.filter(r => r.toUserId === myProfile.id && r.status === 'pending')
      
      toast.success(`✅ ${demoData.conversations.length + newConversations.length} conversations, ${pendingToMe.length} requests!`, {
        duration: 4000
      })
      
      setTimeout(() => setSelectedTab('messages'), 1000)
    }, 300)
  }

  const handleGenerateMoreDemoData = async () => {
    if (!myProfile) return
    
    const conversationArray = Array.isArray(conversations) ? conversations : []
    const requestArray = Array.isArray(chatRequests) ? chatRequests : []
    
    const existingUserIds = [
      ...conversationArray.flatMap(c => c.participants),
      ...requestArray.map(r => r.fromUserId),
      ...requestArray.map(r => r.toUserId)
    ].filter(id => id !== myProfile.id)
    
    const uniqueExistingUserIds = [...new Set(existingUserIds)]
    
    const demoData = generateDemoConversationsAndMessages(myProfile, demoUsers, 10)
    
    if (demoData.conversations.length > 0) {
      setConversations(current => {
        const currentArray = Array.isArray(current) ? current : []
        return [...currentArray, ...demoData.conversations]
      })
      setChatRequests(current => {
        const currentArray = Array.isArray(current) ? current : []
        return [...currentArray, ...demoData.chatRequests]
      })
      setMessages(current => {
        const currentObj = current && typeof current === 'object' ? current : {}
        return { ...currentObj, ...demoData.messages }
      })
      
      toast.success(`Added ${demoData.conversations.length} new conversations!`)
    }
    
    const newExistingIds = [
      ...uniqueExistingUserIds,
      ...demoData.conversations.flatMap(c => c.participants),
      ...demoData.chatRequests.map(r => r.fromUserId),
      ...demoData.chatRequests.map(r => r.toUserId)
    ].filter(id => id !== myProfile.id)
    
    const finalUniqueIds = [...new Set(newExistingIds)]
    const additionalRequests = generateAdditionalChatRequests(myProfile, demoUsers, finalUniqueIds, 20)
    
    if (additionalRequests.length > 0) {
      const autoAcceptedRequests = additionalRequests.filter(r => r.status === 'accepted')
      const newConversations = autoAcceptedRequests.map(request => {
        const conversationId = [request.fromUserId, request.toUserId].sort().join('-')
        return {
          id: conversationId,
          participants: [request.fromUserId, request.toUserId] as [string, string],
          unreadCount: 0
        }
      })
      
      if (newConversations.length > 0) {
        setConversations(current => {
          const currentArray = Array.isArray(current) ? current : []
          return [...currentArray, ...newConversations]
        })
      }
      
      setChatRequests(current => {
        const currentArray = Array.isArray(current) ? current : []
        return [...currentArray, ...additionalRequests]
      })
      
      const pendingCount = additionalRequests.filter(r => r.status === 'pending').length
      const acceptedCount = additionalRequests.filter(r => r.status === 'accepted').length
      
      if (pendingCount > 0 && acceptedCount > 0) {
        toast.success(`${acceptedCount} new conversations and ${pendingCount} new requests!`)
      } else if (pendingCount > 0) {
        toast.success(`${pendingCount} new message requests!`)
      } else if (acceptedCount > 0) {
        toast.success(`${acceptedCount} new conversations!`)
      }
    }
    
    if (demoData.conversations.length === 0 && additionalRequests.length === 0) {
      toast.error('No more eligible users available')
    }
  }

  const handleGeneratePendingRequests = async () => {
    if (!myProfile) return
    
    const conversationArray = Array.isArray(conversations) ? conversations : []
    const requestArray = Array.isArray(chatRequests) ? chatRequests : []
    
    const existingUserIds = [
      ...conversationArray.flatMap(c => c.participants),
      ...requestArray.map(r => r.fromUserId),
      ...requestArray.map(r => r.toUserId)
    ].filter(id => id !== myProfile.id)
    
    const uniqueExistingUserIds = [...new Set(existingUserIds)]
    
    const newRequests = generateAdditionalChatRequests(myProfile, demoUsers, uniqueExistingUserIds, 20)
    
    if (newRequests.length > 0) {
      const autoAcceptedRequests = newRequests.filter(r => r.status === 'accepted')
      const newConversations = autoAcceptedRequests.map(request => {
        const conversationId = [request.fromUserId, request.toUserId].sort().join('-')
        return {
          id: conversationId,
          participants: [request.fromUserId, request.toUserId] as [string, string],
          unreadCount: 0
        }
      })
      
      if (newConversations.length > 0) {
        setConversations(current => {
          const currentArray = Array.isArray(current) ? current : []
          return [...currentArray, ...newConversations]
        })
      }
      
      setChatRequests(current => {
        const currentArray = Array.isArray(current) ? current : []
        return [...currentArray, ...newRequests]
      })
      
      const pendingCount = newRequests.filter(r => r.status === 'pending').length
      const acceptedCount = newRequests.filter(r => r.status === 'accepted').length
      
      if (pendingCount > 0 && acceptedCount > 0) {
        toast.success(`Generated ${acceptedCount} conversations and ${pendingCount} requests!`, {
          description: 'Check the Messages and Requests tabs',
          duration: 3000
        })
      } else if (pendingCount > 0) {
        toast.success(`Generated ${pendingCount} new pending requests!`, {
          description: 'Check the Requests tab',
          duration: 3000
        })
      } else if (acceptedCount > 0) {
        toast.success(`Generated ${acceptedCount} new conversations!`, {
          description: 'Check the Messages tab',
          duration: 3000
        })
      }
    } else {
      toast.info('No eligible users available for requests', {
        description: 'Try refreshing users or adjusting your profile preferences'
      })
    }
  }

  const handleSendMessage = (conversationId: string, text: string) => {
    if (!myProfile) return

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId: myProfile.id,
      text,
      timestamp: Date.now()
    }

    setMessages(current => {
      const currentObj = current && typeof current === 'object' ? current : {}
      return {
        ...currentObj,
        [conversationId]: [...(currentObj[conversationId] || []), newMessage]
      }
    })

    setConversations(current => {
      const currentArray = Array.isArray(current) ? current : []
      return currentArray.map(conv =>
        conv.id === conversationId ? { ...conv, lastMessage: newMessage } : conv
      )
    })
  }

  const activeConversations = useMemo(() => {
    const conversationArray = Array.isArray(conversations) ? conversations : []
    if (!myProfile) return []
    
    return conversationArray
      .filter(conv => conv && Array.isArray(conv.participants) && conv.participants.includes(myProfile.id))
      .map(conv => {
        const otherUserId = conv.participants.find(id => id !== myProfile.id)
        const otherUser = demoUsers.find(u => u.id === otherUserId)
        return { ...conv, otherUser: otherUser || null }
      })
      .filter(conv => conv.otherUser !== null)
      .sort((a, b) => {
        const aTime = a.lastMessage?.timestamp || 0
        const bTime = b.lastMessage?.timestamp || 0
        return bTime - aTime
      })
  }, [conversations, myProfile, demoUsers])

  const currentConversation = activeConversations.find(c => c.id === selectedConversation)
  const currentMessages = selectedConversation && messages ? messages[selectedConversation] || [] : []
  
  useEffect(() => {
    if (selectedConversation && !currentConversation) {
      setSelectedConversation(null)
    }
  }, [selectedConversation, currentConversation])

  useEffect(() => {
    if (selectedTab === 'requests' && myProfile && !myProfile.requireApproval) {
      setSelectedTab('messages')
    }
  }, [selectedTab, myProfile])

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <header className="border-b border-border bg-card/90 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight select-none">
                <span className="bg-gradient-to-br from-primary via-red-500 to-primary bg-clip-text text-transparent drop-shadow-sm">Here</span>
                <span className="bg-gradient-to-br from-yellow-400 to-accent bg-clip-text text-transparent drop-shadow-sm">o</span>
              </h1>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Badge 
                    variant="secondary" 
                    className="hidden sm:flex items-center gap-1.5 bg-accent/10 text-accent-foreground border-accent/20 text-xs px-2.5 py-1 cursor-pointer hover:bg-accent/20 hover:shadow-sm transition-all duration-200"
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                    </span>
                    Demo Mode
                  </Badge>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onClick={handleClearAllData} className="cursor-pointer">
                    <ArrowsClockwise size={16} className="mr-2" />
                    Force Generate Demo Data
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleGenerateMoreDemoData} className="cursor-pointer">
                    <ChatCircle size={16} className="mr-2" />
                    Add More Conversations
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleGeneratePendingRequests} className="cursor-pointer">
                    <User size={16} className="mr-2" />
                    Add More Requests
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={async () => {
                      dataGeneratedRef.current = false
                      initialLoadCompleteRef.current = false
                      setChatRequests([])
                      setConversations([])
                      setMessages({})
                      toast.success('All data cleared!', {
                        description: 'Reloading page...',
                        duration: 1500
                      })
                      setTimeout(() => {
                        window.location.reload()
                      }, 1000)
                    }} 
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <Trash size={16} className="mr-2" />
                    Clear All & Reload
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center gap-2.5">
              {myProfile?.requireApproval && pendingIncomingRequests.length > 0 && (
                <Badge variant="destructive" className="animate-pulse shadow-md px-3 py-1.5 font-semibold">
                  {pendingIncomingRequests.length}
                </Badge>
              )}
              {myProfile && !myProfile.locationSharingEnabled && (
                <Badge variant="outline" className="flex items-center gap-1.5 shadow-sm border-amber-300 bg-amber-50 text-amber-700">
                  <MapPin size={14} weight="fill" />
                  <span className="hidden sm:inline font-medium">Hidden</span>
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProfileDialog(true)}
                className="shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 border-border/60 hover:border-primary/30"
              >
                {myProfile && isProfilePhotoValid(myProfile) && myProfile.profilePicture ? (
                  <Avatar className="w-6 h-6 border border-border">
                    <AvatarImage src={myProfile.profilePicture.dataUrl} alt={myProfile.name} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xs">
                      {myProfile.name[0]}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <User size={18} />
                )}
                <span className="hidden sm:inline">{myProfile ? myProfile.name : 'Profile'}</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className={`grid w-full ${myProfile?.requireApproval ? 'grid-cols-4' : 'grid-cols-3'} mb-8 h-auto p-1.5 bg-muted/40 shadow-md backdrop-blur-sm`}>
            <TabsTrigger value="map" className="flex items-center gap-2 py-3 px-4 data-[state=active]:shadow-md data-[state=active]:bg-background transition-all duration-200">
              <MapTrifold size={20} weight="duotone" />
              <span className="hidden sm:inline font-medium">Map</span>
            </TabsTrigger>
            <TabsTrigger value="discover" className="flex items-center gap-2 py-3 px-4 data-[state=active]:shadow-md data-[state=active]:bg-background transition-all duration-200">
              <MagnifyingGlass size={20} weight="duotone" />
              <span className="hidden sm:inline font-medium">Discover</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2 py-3 px-4 data-[state=active]:shadow-md data-[state=active]:bg-background transition-all duration-200">
              <ChatCircle size={20} weight="duotone" />
              <span className="hidden sm:inline font-medium">Messages</span>
              {activeConversations.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5 bg-primary/20 text-primary-foreground border-primary/30">
                  {activeConversations.length}
                </Badge>
              )}
            </TabsTrigger>
            {myProfile?.requireApproval && (
              <TabsTrigger value="requests" className="flex items-center gap-2 py-3 px-4 data-[state=active]:shadow-md data-[state=active]:bg-background transition-all duration-200">
                <User size={20} weight="duotone" />
                <span className="hidden sm:inline font-medium">Requests</span>
                {pendingIncomingRequests.length > 0 && (
                  <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] px-1.5 animate-pulse">
                    {pendingIncomingRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="map" className="space-y-6">
            <div className="bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 border-2 border-primary/15 rounded-2xl p-6 shadow-md backdrop-blur-sm">
              <h2 className="font-semibold text-xl mb-2.5 flex items-center gap-2.5">
                <MapTrifold size={26} weight="duotone" className="text-primary" />
                Social Discovery Heat Map
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Visualize anonymous user density in the area. Brighter colors indicate higher activity. 
                All locations are fuzzed to protect privacy.
              </p>
            </div>
            <div className="h-[600px] rounded-2xl overflow-hidden border-2 border-border shadow-xl ring-4 ring-primary/5">
              <HeatMap points={heatMapData} />
            </div>
          </TabsContent>

          <TabsContent value="discover" className="space-y-6">
            {!myProfile ? (
              <div className="text-center py-20">
                <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl p-10 max-w-md mx-auto shadow-lg border-2 border-border animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <MagnifyingGlass className="mx-auto text-muted-foreground mb-5" size={64} weight="duotone" />
                  <p className="text-xl text-foreground font-semibold mb-3">Complete Your Profile</p>
                  <p className="text-muted-foreground mb-7 leading-relaxed">Create your profile to discover and connect with nearby users.</p>
                  <Button onClick={() => setShowProfileDialog(true)} className="bg-primary shadow-lg hover:shadow-xl transition-all duration-200 h-12 px-8" size="lg">
                    Get Started
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {!myProfile.locationSharingEnabled && (
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-5 shadow-md">
                    <div className="flex items-start gap-3">
                      <MapPin className="text-amber-600 flex-shrink-0 mt-0.5" size={26} weight="duotone" />
                      <div className="space-y-1.5">
                        <p className="font-semibold text-amber-900 text-base">Location Sharing Disabled</p>
                        <p className="text-sm text-amber-800 leading-relaxed">
                          Others cannot see you in their Discover feed, but you can still browse and message users.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-5 p-6 bg-card rounded-2xl border-2 border-border shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                      <Label className="text-base font-semibold">Search Radius</Label>
                      <p className="text-sm text-muted-foreground font-medium">{searchRadius[0]} km</p>
                    </div>
                    <Button
                      onClick={handleRefreshUsers}
                      variant="outline"
                      size="sm"
                      disabled={isRefreshing}
                      className="flex items-center gap-2 shadow-sm hover:shadow-md transition-all duration-200 border-border/60 hover:border-primary/30"
                    >
                      <ArrowsClockwise size={18} weight="bold" className={isRefreshing ? 'animate-spin' : ''} />
                      <span className="hidden sm:inline font-medium">Refresh</span>
                    </Button>
                  </div>
                  <Slider
                    value={searchRadius}
                    onValueChange={setSearchRadius}
                    min={0.1}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="bg-card border-2 border-border rounded-2xl p-6 mb-6 shadow-md">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="grid grid-cols-2 sm:flex gap-5 sm:gap-8 w-full sm:w-auto">
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Users</p>
                        <p className="text-3xl font-bold text-foreground">{demoUsers.length}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Active</p>
                        <p className="text-3xl font-bold text-accent">{demoUsers.filter(u => u.isActive && u.locationSharingEnabled).length}</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Matching Nearby</p>
                        <p className="text-3xl font-bold text-primary">{nearbyUsers.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {nearbyUsers.length === 0 ? (
                  <div className="text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl p-10 max-w-md mx-auto shadow-lg border-2 border-border">
                      <MagnifyingGlass className="mx-auto text-muted-foreground mb-5" size={64} weight="duotone" />
                      <p className="text-xl font-semibold text-foreground mb-3">No Users Found</p>
                      <p className="text-muted-foreground leading-relaxed mb-2">No users within {searchRadius[0]} km match your preferences</p>
                      <p className="text-sm text-muted-foreground mt-3 bg-muted/50 p-3 rounded-lg">Try increasing the search radius or adjusting your profile preferences</p>
                    </div>
                  </div>
                ) : (
                  <div className={`relative ${isRefreshing ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {nearbyUsers.map(({ user, distance }, index) => (
                        <div 
                          key={user.id}
                          className="animate-in fade-in slide-in-from-bottom-4"
                          style={{ animationDelay: `${index * 30}ms`, animationDuration: '400ms' }}
                        >
                          <UserCard
                            user={user}
                            distance={formatDistance(distance)}
                            canMessage={true}
                            onMessage={() => handleSendChatRequest(user)}
                            onViewProfile={() => handleViewUserProfile(user, distance)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            {!myProfile ? (
              <div className="text-center py-20">
                <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl p-10 max-w-md mx-auto shadow-lg border-2 border-border">
                  <ChatCircle className="mx-auto text-muted-foreground mb-5" size={64} weight="duotone" />
                  <p className="text-xl font-semibold text-foreground mb-3">Complete Your Profile</p>
                  <p className="text-muted-foreground leading-relaxed">Create your profile to start messaging.</p>
                </div>
              </div>
            ) : activeConversations.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl p-10 max-w-md mx-auto shadow-lg border-2 border-border">
                  <ChatCircle className="mx-auto text-muted-foreground mb-5" size={64} weight="duotone" />
                  <p className="text-xl font-semibold text-foreground mb-3">No Conversations Yet</p>
                  <p className="text-muted-foreground leading-relaxed">
                    Send a message request to start chatting
                  </p>
                </div>
              </div>
            ) : selectedConversation && currentConversation && currentConversation.otherUser ? (
              <div className="h-[600px] rounded-2xl overflow-hidden shadow-xl border-2 border-border ring-4 ring-primary/5">
                <ChatInterface
                  messages={currentMessages}
                  currentUserId={myProfile.id}
                  otherUser={currentConversation.otherUser}
                  onSendMessage={(text) => handleSendMessage(selectedConversation, text)}
                  onBack={() => setSelectedConversation(null)}
                  onViewProfile={() => handleViewUserProfile(currentConversation.otherUser!)}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {activeConversations.map(conv => {
                  if (!conv.otherUser) return null
                  const otherUserPhotoValid = conv.otherUser.profilePicture ? isPhotoValid(conv.otherUser.profilePicture) : false
                  return (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className="p-5 bg-card rounded-xl border-2 border-border hover:border-primary/30 hover:shadow-lg cursor-pointer transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar
                          className="w-16 h-16 cursor-pointer group-hover:scale-110 transition-transform duration-200 shadow-md border-2 border-primary/20 group-hover:border-primary/40"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewUserProfile(conv.otherUser!)
                          }}
                        >
                          {otherUserPhotoValid && conv.otherUser.profilePicture && (
                            <AvatarImage src={conv.otherUser.profilePicture.dataUrl} alt={conv.otherUser.name} />
                          )}
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold text-xl">
                            {conv.otherUser.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 
                            className="font-semibold text-lg cursor-pointer group-hover:text-primary transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewUserProfile(conv.otherUser!)
                            }}
                          >
                            {conv.otherUser.name}
                          </h3>
                          {conv.lastMessage && (
                            <p className="text-sm text-muted-foreground truncate mt-1.5">
                              {conv.lastMessage.text}
                            </p>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <span className="text-xs text-muted-foreground font-medium bg-muted/30 px-2.5 py-1 rounded-full">
                            {new Date(conv.lastMessage.timestamp).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            {!myProfile ? (
              <div className="text-center py-20">
                <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl p-10 max-w-md mx-auto shadow-lg border-2 border-border">
                  <User className="mx-auto text-muted-foreground mb-5" size={64} weight="duotone" />
                  <p className="text-xl font-semibold text-foreground mb-3">Complete Your Profile</p>
                  <p className="text-muted-foreground leading-relaxed">Create your profile to receive requests.</p>
                </div>
              </div>
            ) : pendingIncomingRequests.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl p-10 max-w-md mx-auto shadow-lg border-2 border-border">
                  <User className="mx-auto text-muted-foreground mb-5" size={64} weight="duotone" />
                  <p className="text-xl font-semibold text-foreground mb-3">No Pending Requests</p>
                  <p className="text-muted-foreground leading-relaxed">When someone wants to connect, you'll see them here.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingIncomingRequests.map(request => {
                  const fromUser = demoUsers.find(u => u.id === request.fromUserId)
                  if (!fromUser) return null
                  const fromUserPhotoValid = fromUser.profilePicture ? isPhotoValid(fromUser.profilePicture) : false
                  return (
                    <div
                      key={request.id}
                      className="p-6 bg-card rounded-2xl border-2 border-border shadow-md hover:shadow-xl hover:border-primary/20 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar
                            className="w-16 h-16 cursor-pointer hover:scale-110 transition-transform duration-200 shadow-md border-2 border-primary/20 hover:border-primary/40"
                            onClick={() => handleViewUserProfile(fromUser)}
                          >
                            {fromUserPhotoValid && fromUser.profilePicture && (
                              <AvatarImage src={fromUser.profilePicture.dataUrl} alt={fromUser.name} />
                            )}
                            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold text-xl">
                              {fromUser.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 
                              className="font-semibold text-lg cursor-pointer hover:text-primary transition-colors"
                              onClick={() => handleViewUserProfile(fromUser)}
                            >
                              {fromUser.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {fromUser.age} • {fromUser.gender}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2.5">
                          <Button
                            size="default"
                            onClick={() => handleAcceptRequest(request)}
                            className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all h-11 px-5"
                          >
                            <Check size={18} className="mr-2" weight="bold" />
                            Accept
                          </Button>
                          <Button
                            size="default"
                            variant="outline"
                            onClick={() => handleDeclineRequest(request)}
                            className="shadow-md hover:shadow-lg transition-all h-11 px-5 hover:border-destructive/30 hover:text-destructive"
                          >
                            <X size={18} className="mr-2" weight="bold" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border bg-card/60 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 sm:px-6 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Here Now, Hereo · 
            <span className="ml-2 font-medium">Demo Application with {demoUsers.length} simulated users</span>
          </p>
        </div>
      </footer>

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto border-2 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {myProfile ? '✏️ Your Profile' : '👋 Welcome to Hereo!'}
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              {myProfile 
                ? 'Update your profile settings and preferences'
                : 'Create your profile to start discovering and connecting with people nearby'
              }
            </DialogDescription>
          </DialogHeader>
          <ProfileForm profile={myProfile || null} onSave={handleSaveProfile} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingRequestUser} onOpenChange={() => setPendingRequestUser(null)}>
        <DialogContent className="max-w-sm border-2 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">✨ Request Sent!</DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              Your chat request has been sent to {pendingRequestUser?.name}. You'll be notified when they respond.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setPendingRequestUser(null)} className="bg-primary shadow-lg hover:shadow-xl transition-all duration-200 h-12 font-semibold" size="lg">
            Got it
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto border-2 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">👤 User Profile</DialogTitle>
          </DialogHeader>
          {viewingUser && (
            <UserProfileView user={viewingUser} distance={viewingUserDistance} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App