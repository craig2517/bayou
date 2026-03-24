import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Toaster } from '@/components/ui/sonner'
import { MapTrifold, MagnifyingGlass, ChatCircle, User, Check, X, MapPin, ArrowsClockwise, Database } from '@phosphor-icons/react'
import { HeatMap } from '@/components/HeatMap'
import { UserCard } from '@/components/UserCard'
import { ProfileForm } from '@/components/ProfileForm'
import { ChatInterface } from '@/components/ChatInterface'
import { UserProfileView } from '@/components/UserProfileView'
import { generateDemoUsers, calculateDistance, generateHeatMapData, formatDistance, getRandomLocationNearCenter, isPhotoValid, generateDemoConversationsAndMessages, generateAdditionalChatRequests } from '@/lib/helpers'
import { toast } from 'sonner'
import type { UserProfile, ChatRequest, Message, Conversation } from '@/lib/types'

function App() {
  const [myProfile, setMyProfile] = useKV<UserProfile | null>('my-profile-v6', null)
  const [demoUsers, setDemoUsers] = useState<UserProfile[]>([])
  const [chatRequests, setChatRequests] = useKV<ChatRequest[]>('chat-requests-v6', [])
  const [conversations, setConversations] = useKV<Conversation[]>('conversations-v6', [])
  const [messages, setMessages] = useKV<Record<string, Message[]>>('messages-v6', {})
  const [searchRadius, setSearchRadius] = useState([0.8])
  const [selectedTab, setSelectedTab] = useState('map')
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [pendingRequestUser, setPendingRequestUser] = useState<UserProfile | null>(null)
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null)
  const [viewingUserDistance, setViewingUserDistance] = useState<string | undefined>(undefined)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const initializedRef = useRef(false)
  const dataGeneratedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    
    const newUsers = generateDemoUsers(1000)
    setDemoUsers(newUsers)
  }, [])
  
  useEffect(() => {
    if (!myProfile?.locationSharingEnabled) return
    
    const interval = setInterval(() => {
      setMyProfile(current => {
        if (!current) return null
        return { ...current, isActive: true, lastActive: Date.now() }
      })
    }, 60000)

    return () => clearInterval(interval)
  }, [myProfile?.id, myProfile?.locationSharingEnabled, setMyProfile])

  const generateSampleData = useCallback((profile: UserProfile, users: UserProfile[]) => {
    if (!profile || !Array.isArray(users) || users.length === 0) {
      console.error('Invalid parameters for generateSampleData')
      return
    }

    const demoData = generateDemoConversationsAndMessages(profile, users, 25)
    
    if (demoData.conversations.length === 0 && demoData.chatRequests.length === 0) {
      toast.error('No compatible users found', {
        description: 'Try adjusting your profile preferences',
        duration: 5000
      })
      return
    }
    
    const existingUserIds = [...new Set([
      ...demoData.conversations.flatMap(c => c.participants),
      ...demoData.chatRequests.map(r => r.fromUserId),
      ...demoData.chatRequests.map(r => r.toUserId)
    ].filter(id => id !== profile.id))]
    
    const pendingRequests = generateAdditionalChatRequests(profile, users, existingUserIds, 50)
    const allChatRequests = [...demoData.chatRequests, ...pendingRequests]
    
    const autoAcceptedRequests = pendingRequests.filter(r => r.status === 'accepted')
    const newConversations = autoAcceptedRequests.map(request => ({
      id: [request.fromUserId, request.toUserId].sort().join('-'),
      participants: [request.fromUserId, request.toUserId] as [string, string],
      unreadCount: 0
    }))
    
    const allConversations = [...demoData.conversations, ...newConversations]
    
    setConversations(allConversations)
    setChatRequests(allChatRequests)
    setMessages(demoData.messages)
    
    dataGeneratedRef.current = true
    
    const pendingToMe = allChatRequests.filter(r => r.toUserId === profile.id && r.status === 'pending')
    
    toast.success(`✨ Demo data loaded successfully!`, {
      description: `${allConversations.length} conversations & ${pendingToMe.length} requests ready`,
      duration: 4000
    })
  }, [setConversations, setChatRequests, setMessages])

  useEffect(() => {
    if (!myProfile || demoUsers.length === 0 || dataGeneratedRef.current) return
    
    const conversationArray = Array.isArray(conversations) ? conversations : []
    const requestArray = Array.isArray(chatRequests) ? chatRequests : []
    
    if (conversationArray.length > 0 || requestArray.length > 0) {
      dataGeneratedRef.current = true
      return
    }
    
    const timer = setTimeout(() => {
      generateSampleData(myProfile, demoUsers)
    }, 500)

    return () => clearTimeout(timer)
  }, [myProfile, demoUsers, conversations, chatRequests, generateSampleData])

  const heatMapData = useMemo(() => {
    if (!Array.isArray(demoUsers) || demoUsers.length === 0) {
      return []
    }
    return generateHeatMapData(demoUsers)
  }, [demoUsers])

  const canIMessageUser = useCallback((user: UserProfile): boolean => {
    if (!myProfile) return false
    
    const userReceivesList = user.receiveMessagesFrom || []
    if (!userReceivesList.includes(myProfile.gender)) return false
    
    if (myProfile.age < user.ageRangeMin || myProfile.age > user.ageRangeMax) return false
    
    const userRelationshipPrefs = user.relationshipStatusPreference || ['Single', 'Not Single', 'Prefer not to say']
    const getEffectiveStatus = (isSingle: boolean | undefined): string => {
      if (isSingle === undefined) return 'Prefer not to say'
      return isSingle ? 'Single' : 'Not Single'
    }
    const myEffectiveStatus = getEffectiveStatus(myProfile.isSingle)
    
    return userRelationshipPrefs.includes('Prefer not to say') || userRelationshipPrefs.includes(myEffectiveStatus)
  }, [myProfile])

  const nearbyUsers = useMemo(() => {
    if (!myProfile || !Array.isArray(demoUsers) || demoUsers.length === 0) return []
    
    const blockedUserIds = myProfile.blockedUsers || []
    
    const eligibleDemoUsers = demoUsers.filter(user => {
      if (!user || user.id === myProfile.id || !user.isActive || !user.locationSharingEnabled) {
        return false
      }
      
      if (blockedUserIds.includes(user.id)) {
        return false
      }
      
      return canIMessageUser(user)
    })
    
    const allUsersWithDistance = eligibleDemoUsers.map(user => ({
      user,
      distance: calculateDistance(
        myProfile.location.lat,
        myProfile.location.lng,
        user.location.lat,
        user.location.lng
      )
    }))
    
    return allUsersWithDistance
      .filter(item => item.distance <= searchRadius[0])
      .sort((a, b) => a.distance - b.distance)
  }, [myProfile, demoUsers, searchRadius, canIMessageUser])

  const pendingIncomingRequests = useMemo(() => {
    const requestArray = Array.isArray(chatRequests) ? chatRequests : []
    if (!myProfile || !myProfile.requireApproval) return []
    
    const blockedUserIds = myProfile.blockedUsers || []
    
    return requestArray.filter(req => 
      req && 
      req.toUserId === myProfile.id && 
      req.status === 'pending' &&
      !blockedUserIds.includes(req.fromUserId)
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
      setChatRequests([])
      setConversations([])
      setMessages({})
      dataGeneratedRef.current = false
    }
    
    if (!isNewProfile && wasRequiringApproval && !nowRequiresApproval) {
      const requestArray = Array.isArray(chatRequests) ? chatRequests : []
      const pendingRequests = requestArray.filter(
        req => req && req.toUserId === newProfile.id && req.status === 'pending'
      )
      
      if (pendingRequests.length > 0) {
        setChatRequests(current => {
          const currentArray = Array.isArray(current) ? current : []
          return currentArray.map(req => 
            req && req.toUserId === newProfile.id && req.status === 'pending'
              ? { ...req, status: 'accepted' as const }
              : req
          )
        })
        
        const newConversations = pendingRequests.map(request => {
          const conversationId = [request.fromUserId, request.toUserId].sort().join('-')
          return {
            id: conversationId,
            participants: [request.fromUserId, request.toUserId] as [string, string],
            unreadCount: 0
          }
        })
        
        setConversations(current => {
          const currentArray = Array.isArray(current) ? current : []
          const existingConvIds = new Set(currentArray.map(c => c.id))
          const uniqueNewConvs = newConversations.filter(nc => !existingConvIds.has(nc.id))
          return [...currentArray, ...uniqueNewConvs]
        })
        
        toast.success(`✅ ${pendingRequests.length} pending request${pendingRequests.length > 1 ? 's' : ''} auto-approved!`, {
          description: 'All pending requests are now active conversations',
          duration: 4000
        })
      }
    }
    
    setMyProfile(newProfile)
    setShowProfileDialog(false)
    
    if (isNewProfile) {
      dataGeneratedRef.current = false
      toast.success('✨ Profile created! Generating demo data...', {
        duration: 3000
      })
      if (demoUsers.length > 0) {
        setTimeout(() => {
          generateSampleData(newProfile, demoUsers)
          setSelectedTab('messages')
        }, 500)
      }
    } else {
      toast.success('✅ Profile updated!')
    }
  }

  const handleSendChatRequest = (toUser: UserProfile) => {
    if (!myProfile) {
      toast.error('❌ Please complete your profile first')
      return
    }

    if (!canIMessageUser(toUser)) {
      toast.error('❌ This user\'s preferences do not allow messages from you')
      return
    }

    const blockedByThem = toUser.blockedUsers?.includes(myProfile.id) || false
    if (blockedByThem) {
      toast.error('❌ Unable to send message to this user')
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
      toast.info('ℹ️ Request already sent')
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
      toast.success(`✅ You can now message ${toUser.name}!`)
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
    toast.success(`✅ Chat request sent to ${toUser.name}!`)
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

    toast.success('✅ Chat request accepted!')
  }

  const handleDeclineRequest = (request: ChatRequest) => {
    setChatRequests(current => {
      const currentArray = Array.isArray(current) ? current : []
      return currentArray.map(req => (req.id === request.id ? { ...req, status: 'declined' as const } : req))
    })
    toast.info('ℹ️ Request declined')
  }

  const handleViewUserProfile = (user: UserProfile, distance?: number) => {
    setViewingUser(user)
    setViewingUserDistance(distance !== undefined ? formatDistance(distance) : undefined)
  }

  const handleBlockUser = (userId: string) => {
    if (!myProfile) return
    
    const blockedUserIds = myProfile.blockedUsers || []
    
    if (blockedUserIds.includes(userId)) {
      toast.info('ℹ️ User is already blocked')
      return
    }
    
    setMyProfile(current => {
      if (!current) return null
      return {
        ...current,
        blockedUsers: [...blockedUserIds, userId]
      }
    })
    
    const blockedUser = demoUsers.find(u => u.id === userId)
    if (selectedConversation) {
      setSelectedConversation(null)
    }
    
    toast.success(`🚫 ${blockedUser?.name || 'User'} has been blocked`, {
      description: 'They will no longer be able to message you',
      duration: 4000
    })
    
    setViewingUser(null)
  }

  const handleUnblockUser = (userId: string) => {
    if (!myProfile) return
    
    const blockedUserIds = myProfile.blockedUsers || []
    
    setMyProfile(current => {
      if (!current) return null
      return {
        ...current,
        blockedUsers: blockedUserIds.filter(id => id !== userId)
      }
    })
    
    const unblockedUser = demoUsers.find(u => u.id === userId)
    toast.success(`✅ ${unblockedUser?.name || 'User'} has been unblocked`, {
      description: 'They can now message you again',
      duration: 4000
    })
    
    setViewingUser(null)
  }

  const handleRefreshUsers = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      const requestArray = Array.isArray(chatRequests) ? chatRequests : []
      const conversationArray = Array.isArray(conversations) ? conversations : []
      
      const existingRequestIds = requestArray.map(req => [req.fromUserId, req.toUserId])
      const existingConvIds = conversationArray.flatMap(conv => conv.participants)
      const protectedUserIds = [...new Set([...existingConvIds, ...existingRequestIds.flat()])]
      
      const newUsers = generateDemoUsers(1000)
      
      const refreshedUsers = newUsers.map(user => {
        if (protectedUserIds.includes(user.id)) {
          const existingUser = demoUsers.find(u => u.id === user.id)
          return existingUser || user
        }
        return user
      })
      
      setDemoUsers(refreshedUsers)
      setIsRefreshing(false)
      toast.success('✅ Nearby users refreshed!')
    }, 500)
  }

  const handleRefreshSampleData = () => {
    if (!myProfile) {
      toast.error('❌ Please complete your profile first')
      return
    }

    setIsRefreshing(true)
    dataGeneratedRef.current = false
    
    setChatRequests([])
    setConversations([])
    setMessages({})
    setSelectedConversation(null)
    
    const newUsers = generateDemoUsers(1000)
    setDemoUsers(newUsers)
    
    setTimeout(() => {
      const demoData = generateDemoConversationsAndMessages(myProfile, newUsers, 25)
      
      if (demoData.conversations.length === 0 && demoData.chatRequests.length === 0) {
        setIsRefreshing(false)
        dataGeneratedRef.current = false
        toast.error('No compatible users found', {
          description: 'Try adjusting your profile preferences',
          duration: 5000
        })
        return
      }
      
      const existingUserIds = [...new Set([
        ...demoData.conversations.flatMap(c => c.participants),
        ...demoData.chatRequests.map(r => r.fromUserId),
        ...demoData.chatRequests.map(r => r.toUserId)
      ].filter(id => id !== myProfile.id))]
      
      const pendingRequests = generateAdditionalChatRequests(myProfile, newUsers, existingUserIds, 50)
      const allChatRequests = [...demoData.chatRequests, ...pendingRequests]
      
      const autoAcceptedRequests = pendingRequests.filter(r => r.status === 'accepted')
      const newConversations = autoAcceptedRequests.map(request => ({
        id: [request.fromUserId, request.toUserId].sort().join('-'),
        participants: [request.fromUserId, request.toUserId] as [string, string],
        unreadCount: 0
      }))
      
      const allConversations = [...demoData.conversations, ...newConversations]
      
      setConversations(allConversations)
      setChatRequests(allChatRequests)
      setMessages(demoData.messages)
      dataGeneratedRef.current = true
      
      const pendingToMe = allChatRequests.filter(r => r.toUserId === myProfile.id && r.status === 'pending')
      
      setIsRefreshing(false)
      
      toast.success(`✨ All data refreshed!`, {
        description: `${allConversations.length} conversations, ${pendingToMe.length} requests & ${newUsers.length} users`,
        duration: 4000
      })
    }, 500)
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
    
    const blockedUserIds = myProfile.blockedUsers || []
    
    return conversationArray
      .filter(conv => conv && Array.isArray(conv.participants) && conv.participants.includes(myProfile.id))
      .map(conv => {
        const otherUserId = conv.participants.find(id => id !== myProfile.id)
        const otherUser = demoUsers.find(u => u.id === otherUserId)
        return { ...conv, otherUser: otherUser || null }
      })
      .filter(conv => conv.otherUser !== null && !blockedUserIds.includes(conv.otherUser.id))
      .sort((a, b) => (b.lastMessage?.timestamp || 0) - (a.lastMessage?.timestamp || 0))
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
                <span className="bg-gradient-to-br from-primary via-red-500 to-primary bg-clip-text text-transparent drop-shadow-sm">Bay</span>
                <span className="text-yellow-400 drop-shadow-sm">o</span>
                <span className="bg-gradient-to-br from-primary via-red-500 to-primary bg-clip-text text-transparent drop-shadow-sm">u</span>
              </h1>
              <span className="text-sm font-medium text-foreground hidden sm:inline">See what's happening, Bayou!</span>
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
                onClick={handleRefreshSampleData}
                disabled={!myProfile || isRefreshing}
                className="shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 border-border/60 hover:border-primary/30"
                title="Refresh sample data"
              >
                <Database size={18} weight="duotone" className={isRefreshing ? 'animate-spin' : ''} />
                <span className="hidden md:inline">Refresh Data</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProfileDialog(true)}
                className="shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2 border-border/60 hover:border-primary/30"
              >
                {myProfile?.profilePicture && isPhotoValid(myProfile.profilePicture) ? (
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
                <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] px-1.5 animate-pulse">
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
                Human Heat Map
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
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm text-muted-foreground text-center">
                      <span className="font-semibold text-foreground">{nearbyUsers.length}</span> {nearbyUsers.length === 1 ? 'user' : 'users'} found
                    </p>
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
                  onBlockUser={() => handleBlockUser(currentConversation.otherUser!.id)}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {activeConversations.map(conv => {
                  if (!conv.otherUser) return null
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
                          {conv.otherUser.profilePicture && isPhotoValid(conv.otherUser.profilePicture) && (
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
                            {fromUser.profilePicture && isPhotoValid(fromUser.profilePicture) && (
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
            © 2026 Undreware LLC. All rights reserved.
          </p>
        </div>
      </footer>

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto border-2 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {myProfile ? '✏️ Your Profile' : '👋 Welcome to Bayou!'}
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              {myProfile 
                ? 'Update your profile settings and preferences'
                : 'Create your profile to start discovering and connecting with people nearby'
              }
            </DialogDescription>
          </DialogHeader>
          <ProfileForm 
            profile={myProfile || null} 
            onSave={handleSaveProfile}
            blockedUsers={myProfile?.blockedUsers?.map(id => demoUsers.find(u => u.id === id)).filter(Boolean) as UserProfile[] || []}
            onUnblockUser={handleUnblockUser}
          />
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
            <UserProfileView 
              user={viewingUser} 
              distance={viewingUserDistance}
              isBlocked={myProfile?.blockedUsers?.includes(viewingUser.id)}
              onBlock={() => handleBlockUser(viewingUser.id)}
              onUnblock={() => handleUnblockUser(viewingUser.id)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default App