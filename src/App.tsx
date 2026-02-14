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
  const [showDebug, setShowDebug] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const dataGeneratedRef = useRef(false)
  const [kvInitialized, setKvInitialized] = useState(false)

  const isProfilePhotoValid = (user: UserProfile | null) => {
    return user?.profilePicture ? isPhotoValid(user.profilePicture) : false
  }

  useEffect(() => {
    const timer = setTimeout(() => setKvInitialized(true), 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!kvInitialized || !myProfile) {
      return
    }

    if (dataGeneratedRef.current) {
      console.log('⏭️ Already generated, skipping')
      return
    }

    const conversationArray = Array.isArray(conversations) ? conversations : []
    const requestArray = Array.isArray(chatRequests) ? chatRequests : []
    
    const hasData = conversationArray.length > 0 || requestArray.length > 0
    
    if (hasData) {
      console.log('✅ Existing data detected:', {
        conversations: conversationArray.length,
        requests: requestArray.length
      })
      dataGeneratedRef.current = true
      return
    }

    console.log('🎬 Generating demo data for new profile...')
    dataGeneratedRef.current = true
    
    setTimeout(() => {
      const demoData = generateDemoConversationsAndMessages(myProfile, demoUsers, 15)
      
      if (demoData.conversations.length === 0) {
        console.warn('⚠️ No conversations generated')
        toast.error('No compatible users found', {
          description: 'Use Debug menu to Force Generate',
          duration: 6000
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
      
      setConversations(demoData.conversations)
      setChatRequests(allChatRequests)
      setMessages(demoData.messages)
      
      const pendingToMe = allChatRequests.filter(r => r.toUserId === myProfile.id && r.status === 'pending')
      
      console.log('✅ Demo data saved:', {
        conversations: demoData.conversations.length,
        requests: allChatRequests.length,
        pendingToMe: pendingToMe.length
      })
      
      toast.success(`${demoData.conversations.length} conversations and ${pendingToMe.length} requests loaded!`, {
        description: 'Check Messages and Requests tabs',
        duration: 4000
      })
    }, 100)
  }, [kvInitialized, myProfile])

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
      
      const canMessage = userAcceptsMe && userAgeMatchesMe && iAcceptUser && myAgeMatchesUser
      
      return { user, distance, canMessage, userAcceptsMe, userAgeMatchesMe, iAcceptUser, myAgeMatchesUser }
    })
    
    const sortedByDistance = allUsersWithDistance.sort((a, b) => a.distance - b.distance)
    const inRadiusUsers = sortedByDistance.filter(item => item.distance <= searchRadius[0])
    
    return inRadiusUsers
  }, [myProfile, demoUsers, searchRadius])

  const pendingIncomingRequests = useMemo(() => {
    const requestArray = Array.isArray(chatRequests) ? chatRequests : []
    if (!myProfile) return []
    
    const filtered = requestArray.filter(req => 
      req && 
      req.toUserId === myProfile.id && 
      req.status === 'pending'
    )
    
    console.log('🔍 PENDING REQUESTS CHECK:', {
      total: requestArray.length,
      pendingToMe: filtered.length,
      myId: myProfile.id,
      requestSample: requestArray.slice(0, 3).map(r => ({
        id: r?.id,
        from: r?.fromUserId,
        to: r?.toUserId,
        status: r?.status
      }))
    })
    
    return filtered
  }, [chatRequests, myProfile])

  const handleSaveProfile = (profileData: Omit<UserProfile, 'id' | 'location' | 'isActive' | 'lastActive'>) => {
    const isNewProfile = !myProfile
    
    const newProfile: UserProfile = {
      ...profileData,
      id: myProfile?.id || `user-current-${Date.now()}`,
      location: myProfile?.location || getRandomLocationNearCenter(),
      isActive: true,
      lastActive: Date.now()
    }
    
    console.log('💾 Saving profile:', { isNewProfile })
    
    if (isNewProfile) {
      dataGeneratedRef.current = false
      setChatRequests([])
      setConversations([])
      setMessages({})
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

    const canMessage = 
      userReceivesList.includes(myProfile.gender) &&
      toUser.ageRangeMin <= myProfile.age &&
      toUser.ageRangeMax >= myProfile.age &&
      myReceivesList.includes(toUser.gender) &&
      myProfile.ageRangeMin <= toUser.age &&
      myProfile.ageRangeMax >= toUser.age

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
    
    console.log('🔄 Force regenerating demo data...')
    
    dataGeneratedRef.current = false
    
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
      
      setConversations(demoData.conversations)
      setChatRequests(allRequests)
      setMessages(demoData.messages)
      
      dataGeneratedRef.current = true
      setIsGenerating(false)
      
      const pendingToMe = allRequests.filter(r => r.toUserId === myProfile.id && r.status === 'pending')
      
      toast.success(`✅ ${demoData.conversations.length} conversations, ${pendingToMe.length} requests!`, {
        duration: 4000
      })
      
      setTimeout(() => setSelectedTab('messages'), 1000)
    }, 300)
  }

  const handleGenerateMoreDemoData = async () => {
    if (!myProfile) return
    
    const conversationArray = Array.isArray(conversations) ? conversations : []
    const requestArray = Array.isArray(chatRequests) ? chatRequests : []
    
    console.log('📝 GENERATING MORE DATA - Current state:', {
      existingConversations: conversationArray.length,
      existingRequests: requestArray.length,
      totalDemoUsers: demoUsers.length
    })
    
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
      
      toast.success(`Added ${demoData.conversations.length} new conversations with messages!`)
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
      setChatRequests(current => {
        const currentArray = Array.isArray(current) ? current : []
        return [...currentArray, ...additionalRequests]
      })
      toast.success(`${additionalRequests.length} new message requests!`)
    }
    
    if (demoData.conversations.length === 0 && additionalRequests.length === 0) {
      toast.error('No more eligible users available for demo data', {
        description: 'Try refreshing users or check console logs for debugging info'
      })
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
      setChatRequests(current => {
        const currentArray = Array.isArray(current) ? current : []
        return [...currentArray, ...newRequests]
      })
      toast.success(`Generated ${newRequests.length} new pending requests!`, {
        description: 'Check the Requests tab',
        duration: 3000
      })
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
    
    const active = conversationArray
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
    
    console.log('💬 ACTIVE CONVERSATIONS CHECK:', {
      total: conversationArray.length,
      active: active.length,
      conversationSample: conversationArray.slice(0, 3).map(c => ({
        id: c?.id,
        participants: c?.participants,
        hasLastMessage: !!c?.lastMessage
      }))
    })
    
    return active
  }, [conversations, myProfile, demoUsers])

  const currentConversation = activeConversations.find(c => c.id === selectedConversation)
  const currentMessages = selectedConversation && messages ? messages[selectedConversation] || [] : []
  
  useEffect(() => {
    if (selectedConversation && !currentConversation) {
      setSelectedConversation(null)
    }
  }, [selectedConversation, currentConversation])

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                <span className="text-red-600 drop-shadow-sm">Here</span>
                <span className="text-yellow-500 drop-shadow-sm">o</span>
              </h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDebug(!showDebug)}
                className="text-xs opacity-50 hover:opacity-100"
              >
                {showDebug ? 'Hide' : 'Debug'}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Badge 
                    variant="secondary" 
                    className="hidden sm:flex items-center gap-1.5 bg-accent/10 text-accent-foreground border-accent/20 text-xs px-2 py-0.5 cursor-pointer hover:bg-accent/20 transition-colors"
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
                      console.log('🗑️ Clearing all data and reloading...')
                      dataGeneratedRef.current = false
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
              {pendingIncomingRequests.length > 0 && (
                <Badge variant="destructive" className="animate-pulse shadow-md px-2.5 py-1">
                  {pendingIncomingRequests.length}
                </Badge>
              )}
              {myProfile && !myProfile.locationSharingEnabled && (
                <Badge variant="outline" className="flex items-center gap-1.5 shadow-sm">
                  <MapPin size={14} />
                  <span className="hidden sm:inline">Discover Off</span>
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProfileDialog(true)}
                className="shadow-sm hover:shadow-md transition-all flex items-center gap-2"
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

      {showDebug && (
        <div className="bg-yellow-50 border-b-2 border-yellow-200 p-4">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm">🐛 Debug Panel</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshUsers}
                  disabled={isRefreshing}
                  className="h-7 text-xs"
                >
                  🔄 Refresh Users
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleClearAllData}
                  disabled={!myProfile || isGenerating}
                  className="h-7 text-xs bg-yellow-600 hover:bg-yellow-700"
                >
                  {isGenerating ? '⏳...' : '⚡ Force Generate'}
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs font-mono">
              <div className="bg-white/60 p-2 rounded border border-yellow-300">
                <div className="font-bold text-yellow-800 mb-1">Profile</div>
                <div>{myProfile ? '✅' : '❌'}</div>
                {myProfile && (
                  <>
                    <div className="text-yellow-700 truncate">{myProfile.name}</div>
                    <div className="text-yellow-600 text-[10px]">{myProfile.gender}, {myProfile.age}</div>
                  </>
                )}
              </div>
              
              <div className="bg-white/60 p-2 rounded border border-yellow-300">
                <div className="font-bold text-yellow-800 mb-1">Conversations</div>
                <div className="text-2xl font-bold text-yellow-900">{activeConversations.length}</div>
                <div className="text-[10px] text-yellow-600">KV: {Array.isArray(conversations) ? conversations.length : 0}</div>
              </div>
              
              <div className="bg-white/60 p-2 rounded border border-yellow-300">
                <div className="font-bold text-yellow-800 mb-1">Requests</div>
                <div className="text-2xl font-bold text-yellow-900">{pendingIncomingRequests.length}</div>
                <div className="text-[10px] text-yellow-600">Total: {Array.isArray(chatRequests) ? chatRequests.length : 0}</div>
              </div>
              
              <div className="bg-white/60 p-2 rounded border border-yellow-300">
                <div className="font-bold text-yellow-800 mb-1">Messages</div>
                <div className="text-2xl font-bold text-yellow-900">{messages && typeof messages === 'object' ? Object.keys(messages).length : 0}</div>
                <div className="text-[10px] text-yellow-600">convos</div>
              </div>
              
              <div className="bg-white/60 p-2 rounded border border-yellow-300">
                <div className="font-bold text-yellow-800 mb-1">Status</div>
                <div className="text-[10px] text-yellow-700">
                  {dataGeneratedRef.current ? '✅ Generated' : '❌ Not Generated'}
                </div>
                <div className="text-[10px] text-yellow-700">
                  Demo: {demoUsers.length} users
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8 h-auto p-1.5 bg-muted/50 shadow-sm">
            <TabsTrigger value="map" className="flex items-center gap-2 py-2.5 data-[state=active]:shadow-sm">
              <MapTrifold size={20} />
              <span className="hidden sm:inline font-medium">Map</span>
            </TabsTrigger>
            <TabsTrigger value="discover" className="flex items-center gap-2 py-2.5 data-[state=active]:shadow-sm">
              <MagnifyingGlass size={20} />
              <span className="hidden sm:inline font-medium">Discover</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2 py-2.5 data-[state=active]:shadow-sm">
              <ChatCircle size={20} />
              <span className="hidden sm:inline font-medium">Messages</span>
              {activeConversations.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] px-1.5">
                  {activeConversations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2 py-2.5 data-[state=active]:shadow-sm">
              <User size={20} />
              <span className="hidden sm:inline font-medium">Requests</span>
              {pendingIncomingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-[20px] px-1.5">
                  {pendingIncomingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-6">
            <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10 rounded-xl p-5 shadow-sm">
              <h2 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <MapTrifold size={24} weight="duotone" className="text-primary" />
                Real-Time Activity Heat Map
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Visualize anonymous user density in the area. Brighter colors indicate higher activity. 
                All locations are fuzzed to protect privacy.
              </p>
            </div>
            <div className="h-[600px] rounded-xl overflow-hidden border-2 border-border shadow-lg">
              <HeatMap points={heatMapData} />
            </div>
          </TabsContent>

          <TabsContent value="discover" className="space-y-6">
            {!myProfile ? (
              <div className="text-center py-16">
                <div className="bg-muted/30 rounded-2xl p-8 max-w-md mx-auto shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <MagnifyingGlass className="mx-auto text-muted-foreground mb-4" size={56} weight="duotone" />
                  <p className="text-lg text-foreground font-medium mb-2">Complete Your Profile</p>
                  <p className="text-muted-foreground mb-6">Create your profile to discover and connect with nearby users.</p>
                  <Button onClick={() => setShowProfileDialog(true)} className="bg-primary shadow-md hover:shadow-lg transition-all" size="lg">
                    Create Profile
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {!myProfile.locationSharingEnabled && (
                  <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <MapPin className="text-amber-600 flex-shrink-0 mt-0.5" size={24} weight="duotone" />
                      <div className="space-y-1">
                        <p className="font-semibold text-amber-900">Location Sharing Disabled</p>
                        <p className="text-sm text-amber-800">
                          Others cannot see you in their Discover feed, but you can still browse and message users.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-4 p-5 bg-card rounded-xl border border-border shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label className="text-base font-semibold">Search Radius</Label>
                      <p className="text-sm text-muted-foreground">{searchRadius[0]} km</p>
                    </div>
                    <Button
                      onClick={handleRefreshUsers}
                      variant="outline"
                      size="sm"
                      disabled={isRefreshing}
                      className="flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
                    >
                      <ArrowsClockwise size={18} className={isRefreshing ? 'animate-spin' : ''} />
                      <span className="hidden sm:inline">Refresh</span>
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

                <div className="bg-card border border-border rounded-xl p-5 mb-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="grid grid-cols-2 sm:flex gap-4 sm:gap-6 w-full sm:w-auto">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Users</p>
                        <p className="text-2xl font-bold text-foreground">{demoUsers.length}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Active</p>
                        <p className="text-2xl font-bold text-accent">{demoUsers.filter(u => u.isActive && u.locationSharingEnabled).length}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">In Range</p>
                        <p className="text-2xl font-bold text-primary">{nearbyUsers.length}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Matching</p>
                        <p className="text-2xl font-bold text-secondary">{nearbyUsers.filter(u => u.canMessage).length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {nearbyUsers.length === 0 ? (
                  <div className="text-center py-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-muted/30 rounded-2xl p-8 max-w-md mx-auto">
                      <MagnifyingGlass className="mx-auto text-muted-foreground mb-4" size={56} weight="duotone" />
                      <p className="text-lg font-medium text-foreground mb-2">No Users Found</p>
                      <p className="text-muted-foreground">No users within {searchRadius[0]} km match your preferences</p>
                      <p className="text-sm text-muted-foreground mt-2">Try increasing the search radius or adjusting your profile preferences</p>
                    </div>
                  </div>
                ) : (
                  <div className={`relative ${isRefreshing ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {nearbyUsers.map(({ user, distance, canMessage }, index) => (
                        <div 
                          key={user.id}
                          className="animate-in fade-in slide-in-from-bottom-4"
                          style={{ animationDelay: `${index * 50}ms`, animationDuration: '400ms' }}
                        >
                          <UserCard
                            user={user}
                            distance={formatDistance(distance)}
                            canMessage={canMessage}
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
              <div className="text-center py-16">
                <div className="bg-muted/30 rounded-2xl p-8 max-w-md mx-auto">
                  <ChatCircle className="mx-auto text-muted-foreground mb-4" size={56} weight="duotone" />
                  <p className="text-lg font-medium text-foreground">Complete Your Profile</p>
                  <p className="text-muted-foreground mt-2">Create your profile to start messaging.</p>
                </div>
              </div>
            ) : activeConversations.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-muted/30 rounded-2xl p-8 max-w-md mx-auto">
                  <ChatCircle className="mx-auto text-muted-foreground mb-4" size={56} weight="duotone" />
                  <p className="text-lg font-medium text-foreground mb-2">No Conversations Yet</p>
                  <p className="text-muted-foreground">
                    Send a message request to start chatting
                  </p>
                </div>
              </div>
            ) : selectedConversation && currentConversation && currentConversation.otherUser ? (
              <div className="h-[600px] rounded-xl overflow-hidden shadow-lg">
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
                      className="p-5 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md cursor-pointer transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar
                          className="w-14 h-14 cursor-pointer hover:scale-105 transition-transform shadow-sm border-2 border-primary/20"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewUserProfile(conv.otherUser!)
                          }}
                        >
                          {otherUserPhotoValid && conv.otherUser.profilePicture && (
                            <AvatarImage src={conv.otherUser.profilePicture.dataUrl} alt={conv.otherUser.name} />
                          )}
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold text-lg">
                            {conv.otherUser.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 
                            className="font-semibold text-lg cursor-pointer hover:text-primary transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewUserProfile(conv.otherUser!)
                            }}
                          >
                            {conv.otherUser.name}
                          </h3>
                          {conv.lastMessage && (
                            <p className="text-sm text-muted-foreground truncate mt-1">
                              {conv.lastMessage.text}
                            </p>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <span className="text-xs text-muted-foreground font-medium">
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
              <div className="text-center py-16">
                <div className="bg-muted/30 rounded-2xl p-8 max-w-md mx-auto">
                  <User className="mx-auto text-muted-foreground mb-4" size={56} weight="duotone" />
                  <p className="text-lg font-medium text-foreground">Complete Your Profile</p>
                  <p className="text-muted-foreground mt-2">Create your profile to receive requests.</p>
                </div>
              </div>
            ) : pendingIncomingRequests.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-muted/30 rounded-2xl p-8 max-w-md mx-auto">
                  <User className="mx-auto text-muted-foreground mb-4" size={56} weight="duotone" />
                  <p className="text-lg font-medium text-foreground">No Pending Requests</p>
                  <p className="text-muted-foreground mt-2">When someone wants to connect, you'll see them here.</p>
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
                      className="p-5 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar
                            className="w-14 h-14 cursor-pointer hover:scale-105 transition-transform shadow-sm border-2 border-primary/20"
                            onClick={() => handleViewUserProfile(fromUser)}
                          >
                            {fromUserPhotoValid && fromUser.profilePicture && (
                              <AvatarImage src={fromUser.profilePicture.dataUrl} alt={fromUser.name} />
                            )}
                            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold text-lg">
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
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {fromUser.age} • {fromUser.gender}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="default"
                            onClick={() => handleAcceptRequest(request)}
                            className="bg-primary hover:bg-primary/90 shadow-sm hover:shadow-md transition-all"
                          >
                            <Check size={18} className="mr-1.5" />
                            Accept
                          </Button>
                          <Button
                            size="default"
                            variant="outline"
                            onClick={() => handleDeclineRequest(request)}
                            className="shadow-sm hover:shadow-md transition-all"
                          >
                            <X size={18} className="mr-1.5" />
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

      <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-12">
        <div className="container mx-auto px-4 sm:px-6 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Hereo</span> - Here Now, Hereo · 
            <span className="ml-2">Demo Application with {demoUsers.length} simulated users</span>
          </p>
        </div>
      </footer>

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {myProfile ? 'Your Profile' : '👋 Welcome to Hereo!'}
            </DialogTitle>
            <DialogDescription className="text-base">
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
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl">Request Sent!</DialogTitle>
            <DialogDescription className="text-base">
              Your chat request has been sent to {pendingRequestUser?.name}. You'll be notified when they respond.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setPendingRequestUser(null)} className="bg-primary shadow-md hover:shadow-lg transition-all" size="lg">
            Got it
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">User Profile</DialogTitle>
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