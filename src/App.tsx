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
  const [myProfile, setMyProfile] = useKV<UserProfile | null>('my-profile-v2', null)
  const [demoUsers, setDemoUsers] = useState(() => generateDemoUsers(2000))
  const [chatRequests, setChatRequests] = useKV<ChatRequest[]>('chat-requests-v2', [])
  const [conversations, setConversations] = useKV<Conversation[]>('conversations-v2', [])
  const [messages, setMessages] = useKV<Record<string, Message[]>>('messages-v2', {})
  const [searchRadius, setSearchRadius] = useState([0.8])
  const [selectedTab, setSelectedTab] = useState('map')
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [pendingRequestUser, setPendingRequestUser] = useState<UserProfile | null>(null)
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null)
  const [viewingUserDistance, setViewingUserDistance] = useState<string | undefined>(undefined)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const hasInitializedDemoData = useRef(false)

  const isProfilePhotoValid = (user: UserProfile | null) => {
    return user?.profilePicture ? isPhotoValid(user.profilePicture) : false
  }

  useEffect(() => {
    if (!myProfile) {
      setShowProfileDialog(true)
      return
    }

    if (hasInitializedDemoData.current) {
      return
    }

    const hasConversations = conversations && conversations.length > 0
    const hasAnyRequests = chatRequests && chatRequests.length > 0
    
    const hasAnyData = hasConversations || hasAnyRequests
    
    console.log('🔄 INIT DEMO DATA CHECK:', {
      hasProfile: !!myProfile,
      profileId: myProfile?.id,
      hasConversations,
      conversationsCount: conversations?.length || 0,
      hasAnyRequests,
      requestsCount: chatRequests?.length || 0,
      hasAnyData,
      hasInitialized: hasInitializedDemoData.current,
      demoUsersCount: demoUsers.length
    })
    
    if (!hasAnyData) {
      console.log('🎬 Starting demo data generation...')
      console.log('Profile:', { 
        id: myProfile.id, 
        location: myProfile.location, 
        gender: myProfile.gender, 
        age: myProfile.age,
        receiveFrom: myProfile.receiveMessagesFrom,
        ageRange: [myProfile.ageRangeMin, myProfile.ageRangeMax]
      })
      console.log('Total demo users:', demoUsers.length)
      
      hasInitializedDemoData.current = true
      
      setTimeout(() => {
        const demoData = generateDemoConversationsAndMessages(myProfile, demoUsers, 15)
        
        const existingUserIds = [
          ...demoData.conversations.flatMap(c => c.participants),
          ...demoData.chatRequests.map(r => r.fromUserId),
          ...demoData.chatRequests.map(r => r.toUserId)
        ].filter(id => id !== myProfile.id)
        const uniqueExistingUserIds = [...new Set(existingUserIds)]
        
        console.log('🔔 Generating additional pending requests...')
        const pendingRequests = generateAdditionalChatRequests(myProfile, demoUsers, uniqueExistingUserIds, 25)
        
        const allChatRequests = [...demoData.chatRequests, ...pendingRequests]
        
        console.log('✅ Demo data generation complete:', {
          conversations: demoData.conversations.length,
          initialRequests: demoData.chatRequests.length,
          pendingRequests: pendingRequests.length,
          totalRequests: allChatRequests.length,
          pendingToMe: allChatRequests.filter(r => r.toUserId === myProfile.id && r.status === 'pending').length,
          acceptedRequests: allChatRequests.filter(r => r.status === 'accepted').length
        })
        
        console.log('📦 Setting all KV data...')
        setConversations(demoData.conversations)
        setChatRequests(allChatRequests)
        setMessages(demoData.messages)
        
        const pendingToMe = allChatRequests.filter(r => r.toUserId === myProfile.id && r.status === 'pending')
        
        if (demoData.conversations.length > 0 || pendingToMe.length > 0) {
          toast.success(`Demo data loaded: ${demoData.conversations.length} conversations and ${pendingToMe.length} requests!`, {
            description: 'Check Messages and Requests tabs',
            duration: 4000
          })
        } else {
          toast.error('No compatible users found for demo data', {
            description: 'Try adjusting your profile preferences or use Demo Mode menu',
            duration: 5000
          })
        }
      }, 100)
    } else {
      console.log('✅ Demo data already exists, skipping generation')
      hasInitializedDemoData.current = true
    }
  }, [myProfile, conversations, chatRequests, demoUsers, setConversations, setChatRequests, setMessages])

  const heatMapData = useMemo(() => generateHeatMapData(demoUsers), [demoUsers])

  const nearbyUsers = useMemo(() => {
    if (!myProfile) {
      console.log('❌ No profile exists yet')
      return []
    }
    
    console.log('==================== NEARBY USERS CALCULATION ====================')
    console.log('👤 MY PROFILE:', {
      id: myProfile.id,
      location: myProfile.location,
      name: myProfile.name,
      gender: myProfile.gender,
      age: myProfile.age,
      receiveFrom: myProfile.receiveMessagesFrom,
      ageRange: [myProfile.ageRangeMin, myProfile.ageRangeMax],
      locationSharingEnabled: myProfile.locationSharingEnabled
    })
    
    const eligibleDemoUsers = demoUsers.filter(user => 
      user.id !== myProfile.id && user.isActive && user.locationSharingEnabled
    )
    
    console.log('📊 ELIGIBLE USERS:', {
      totalDemoUsers: demoUsers.length,
      afterFiltering: eligibleDemoUsers.length,
      removedByMyId: demoUsers.filter(u => u.id === myProfile.id).length,
      removedByInactive: demoUsers.filter(u => !u.isActive).length,
      removedByLocationSharing: demoUsers.filter(u => !u.locationSharingEnabled).length
    })
    
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
    
    console.log('🔍 DISCOVER DEBUG:', {
      searchRadius: searchRadius[0] + 'km',
      totalWithDistance: allUsersWithDistance.length,
      inRadiusCount: inRadiusUsers.length,
      matchingCount: inRadiusUsers.filter(f => f.canMessage).length,
      failedMatchReasons: {
        userDoesntAcceptMe: inRadiusUsers.filter(f => !f.userAcceptsMe).length,
        userAgeDoesntMatchMe: inRadiusUsers.filter(f => !f.userAgeMatchesMe).length,
        iDontAcceptUser: inRadiusUsers.filter(f => !f.iAcceptUser).length,
        myAgeDoesntMatchUser: inRadiusUsers.filter(f => !f.myAgeMatchesUser).length
      },
      closest10: sortedByDistance.slice(0, 10).map(item => ({
        name: item.user.name,
        distance: item.distance.toFixed(4) + 'km',
        inRadius: item.distance <= searchRadius[0],
        gender: item.user.gender,
        age: item.user.age,
        userAgeRange: [item.user.ageRangeMin, item.user.ageRangeMax],
        userReceives: item.user.receiveMessagesFrom,
        checks: {
          userAcceptsMe: item.userAcceptsMe,
          userAgeMatchesMe: item.userAgeMatchesMe,
          iAcceptUser: item.iAcceptUser,
          myAgeMatchesUser: item.myAgeMatchesUser,
          canMessage: item.canMessage
        }
      }))
    })
    console.log('==================================================================')
    
    return inRadiusUsers
  }, [myProfile, demoUsers, searchRadius])

  const pendingIncomingRequests = useMemo(() => {
    if (!myProfile || !chatRequests) {
      console.log('🔍 PENDING REQUESTS: No profile or no chat requests', { hasProfile: !!myProfile, chatRequestsCount: chatRequests?.length || 0 })
      return []
    }
    const filtered = chatRequests.filter(req => req.toUserId === myProfile.id && req.status === 'pending')
    console.log('🔍 PENDING INCOMING REQUESTS:', {
      myProfileId: myProfile.id,
      totalChatRequests: chatRequests.length,
      pendingToMe: filtered.length,
      allPending: chatRequests.filter(r => r.status === 'pending').length,
      requestsBreakdown: {
        toMe: chatRequests.filter(r => r.toUserId === myProfile.id).length,
        fromMe: chatRequests.filter(r => r.fromUserId === myProfile.id).length,
        accepted: chatRequests.filter(r => r.status === 'accepted').length,
        pending: chatRequests.filter(r => r.status === 'pending').length,
        declined: chatRequests.filter(r => r.status === 'declined').length
      },
      sampleRequests: chatRequests.slice(0, 5).map(r => ({
        id: r.id,
        from: r.fromUserId,
        to: r.toUserId,
        status: r.status,
        isToMe: r.toUserId === myProfile.id,
        isPending: r.status === 'pending',
        matches: r.toUserId === myProfile.id && r.status === 'pending'
      }))
    })
    return filtered
  }, [chatRequests, myProfile])

  const handleSaveProfile = (profileData: Omit<UserProfile, 'id' | 'location' | 'isActive' | 'lastActive'>) => {
    const isNewProfile = !myProfile
    
    const newProfile: UserProfile = {
      ...profileData,
      id: myProfile?.id || `user-current`,
      location: myProfile?.location || getRandomLocationNearCenter(),
      isActive: true,
      lastActive: Date.now()
    }
    
    console.log('💾 SAVED PROFILE:', {
      profile: newProfile,
      isNewProfile,
      totalDemoUsers: demoUsers.length,
      location: newProfile.location,
      receiveMessagesFrom: newProfile.receiveMessagesFrom,
      ageRange: [newProfile.ageRangeMin, newProfile.ageRangeMax]
    })
    
    setMyProfile(newProfile)
    setShowProfileDialog(false)
    
    if (isNewProfile && profileData.locationSharingEnabled) {
      toast.success('Profile saved! You are now discoverable nearby.', {
        description: 'Demo conversations and requests have been added',
        duration: 4000
      })
      setTimeout(() => setSelectedTab('messages'), 1000)
    } else if (profileData.locationSharingEnabled) {
      toast.success('Profile saved! You are now discoverable nearby.')
    } else {
      toast.success('Profile saved! You are hidden from Discover.')
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

    const existingRequest = (chatRequests || []).find(
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

      setChatRequests(current => [...(current || []), autoAcceptedRequest])

      const newConversation: Conversation = {
        id: conversationId,
        participants: [myProfile.id, toUser.id] as [string, string],
        unreadCount: 0
      }
      setConversations(current => [...(current || []), newConversation])

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

    setChatRequests(current => [...(current || []), newRequest])
    setPendingRequestUser(toUser)
    toast.success(`Chat request sent to ${toUser.name}!`)
  }

  const handleAcceptRequest = (request: ChatRequest) => {
    if (!myProfile) return
    
    setChatRequests(current =>
      (current || []).map(req => (req.id === request.id ? { ...req, status: 'accepted' as const } : req))
    )

    const conversationId = [request.fromUserId, request.toUserId].sort().join('-')
    
    setConversations(current => {
      const conversations = current || []
      const existingConv = conversations.find(c => c.id === conversationId)
      if (!existingConv) {
        const newConversation: Conversation = {
          id: conversationId,
          participants: [request.fromUserId, request.toUserId] as [string, string],
          unreadCount: 0
        }
        return [...conversations, newConversation]
      }
      return conversations
    })

    toast.success('Chat request accepted!')
  }

  const handleDeclineRequest = (request: ChatRequest) => {
    setChatRequests(current =>
      (current || []).map(req => (req.id === request.id ? { ...req, status: 'declined' as const } : req))
    )
    toast.info('Request declined')
  }

  const handleViewUserProfile = (user: UserProfile, distance?: number) => {
    setViewingUser(user)
    setViewingUserDistance(distance !== undefined ? formatDistance(distance) : undefined)
  }

  const handleRefreshUsers = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      const existingRequestIds = (chatRequests || []).map(req => [req.fromUserId, req.toUserId])
      const existingConvIds = (conversations || []).flatMap(conv => conv.participants)
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
    if (!myProfile) return
    
    console.log('🔄 Force regenerating demo data after clear...')
    
    const demoData = generateDemoConversationsAndMessages(myProfile, demoUsers, 15)
    
    const existingUserIds = [
      ...demoData.conversations.flatMap(c => c.participants),
      ...demoData.chatRequests.map(r => r.fromUserId),
      ...demoData.chatRequests.map(r => r.toUserId)
    ].filter(id => id !== myProfile.id)
    const uniqueExistingUserIds = [...new Set(existingUserIds)]
    const additionalRequests = generateAdditionalChatRequests(myProfile, demoUsers, uniqueExistingUserIds, 25)
    
    const allRequests = [...demoData.chatRequests, ...additionalRequests]
    
    setConversations(demoData.conversations)
    setChatRequests(allRequests)
    setMessages(demoData.messages)
    
    const pendingToMe = allRequests.filter(r => r.toUserId === myProfile.id && r.status === 'pending')
    
    console.log('✅ Force regeneration complete:', {
      conversations: demoData.conversations.length,
      totalRequests: allRequests.length,
      pendingToMe: pendingToMe.length
    })
    
    if (demoData.conversations.length > 0 || pendingToMe.length > 0) {
      toast.success('Demo data regenerated!', {
        description: `${demoData.conversations.length} conversations and ${pendingToMe.length} requests created`,
        duration: 4000
      })
    } else {
      toast.error('No compatible users found', {
        description: 'Try adjusting your profile preferences or refreshing users',
        duration: 3000
      })
    }
  }

  const handleGenerateMoreDemoData = () => {
    if (!myProfile) return
    
    console.log('📝 GENERATING MORE DATA - Current state:', {
      existingConversations: conversations?.length || 0,
      existingRequests: chatRequests?.length || 0,
      totalDemoUsers: demoUsers.length
    })
    
    const existingUserIds = [
      ...(conversations || []).flatMap(c => c.participants),
      ...(chatRequests || []).map(r => r.fromUserId),
      ...(chatRequests || []).map(r => r.toUserId)
    ].filter(id => id !== myProfile.id)
    
    const uniqueExistingUserIds = [...new Set(existingUserIds)]
    
    const demoData = generateDemoConversationsAndMessages(myProfile, demoUsers, 10)
    
    if (demoData.conversations.length > 0) {
      setConversations(current => [...(current || []), ...demoData.conversations])
      setChatRequests(current => [...(current || []), ...demoData.chatRequests])
      setMessages(current => ({ ...(current || {}), ...demoData.messages }))
      
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
      setChatRequests(current => [...(current || []), ...additionalRequests])
      toast.success(`${additionalRequests.length} new message requests!`)
    }
    
    if (demoData.conversations.length === 0 && additionalRequests.length === 0) {
      toast.error('No more eligible users available for demo data', {
        description: 'Try refreshing users or check console logs for debugging info'
      })
    }
  }

  const handleGeneratePendingRequests = () => {
    if (!myProfile) return
    
    const existingUserIds = [
      ...(conversations || []).flatMap(c => c.participants),
      ...(chatRequests || []).map(r => r.fromUserId),
      ...(chatRequests || []).map(r => r.toUserId)
    ].filter(id => id !== myProfile.id)
    
    const uniqueExistingUserIds = [...new Set(existingUserIds)]
    
    const newRequests = generateAdditionalChatRequests(myProfile, demoUsers, uniqueExistingUserIds, 20)
    
    if (newRequests.length > 0) {
      setChatRequests(current => [...(current || []), ...newRequests])
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

    setMessages(current => ({
      ...(current || {}),
      [conversationId]: [...((current || {})[conversationId] || []), newMessage]
    }))

    setConversations(current =>
      (current || []).map(conv =>
        conv.id === conversationId ? { ...conv, lastMessage: newMessage } : conv
      )
    )
  }

  const activeConversations = useMemo(() => {
    if (!myProfile || !conversations) return []
    return conversations
      .filter(conv => conv.participants.includes(myProfile.id))
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
                    onClick={() => {
                      console.log('🗑️ Clearing all data and reloading...')
                      setConversations([])
                      setChatRequests([])
                      setMessages({})
                      toast.success('All data cleared!', {
                        description: 'Reloading page...',
                        duration: 1500
                      })
                      setTimeout(() => {
                        hasInitializedDemoData.current = false
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