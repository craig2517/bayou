import { useState, useEffect, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Toaster } from '@/components/ui/sonner'
import { MapTrifold, MagnifyingGlass, ChatCircle, User, Check, X, MapPin, ArrowsClockwise } from '@phosphor-icons/react'
import { HeatMap } from '@/components/HeatMap'
import { UserCard } from '@/components/UserCard'
import { ProfileForm } from '@/components/ProfileForm'
import { ChatInterface } from '@/components/ChatInterface'
import { UserProfileView } from '@/components/UserProfileView'
import { generateDemoUsers, calculateDistance, generateHeatMapData, formatDistance, generateInitialChatRequests } from '@/lib/helpers'
import { toast } from 'sonner'
import type { UserProfile, ChatRequest, Message, Conversation } from '@/lib/types'

function App() {
  const [myProfile, setMyProfile] = useKV<UserProfile | null>('my-profile', null)
  const [demoUsers, setDemoUsers] = useState(() => generateDemoUsers(1200))
  const [chatRequests, setChatRequests] = useKV<ChatRequest[]>('chat-requests', [])
  const [conversations, setConversations] = useKV<Conversation[]>('conversations', [])
  const [messages, setMessages] = useKV<Record<string, Message[]>>('messages', {})
  const [searchRadius, setSearchRadius] = useState([1])
  const [selectedTab, setSelectedTab] = useState('map')
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [pendingRequestUser, setPendingRequestUser] = useState<UserProfile | null>(null)
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null)
  const [viewingUserDistance, setViewingUserDistance] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!myProfile) {
      setShowProfileDialog(true)
    }
  }, [myProfile])

  const heatMapData = useMemo(() => generateHeatMapData(demoUsers), [demoUsers])

  const nearbyUsers = useMemo(() => {
    if (!myProfile) return []
    
    return demoUsers
      .filter(user => user.id !== myProfile.id && user.isActive && user.locationSharingEnabled)
      .map(user => {
        const distance = calculateDistance(
          myProfile.location.lat,
          myProfile.location.lng,
          user.location.lat,
          user.location.lng
        )
        
        const canMessage = 
          user.receiveMessagesFrom?.includes(myProfile.gender) &&
          user.ageRangeMin <= myProfile.age &&
          user.ageRangeMax >= myProfile.age &&
          myProfile.receiveMessagesFrom?.includes(user.gender) &&
          myProfile.ageRangeMin <= user.age &&
          myProfile.ageRangeMax >= user.age
        
        return { user, distance, canMessage }
      })
      .filter(item => item.distance <= searchRadius[0])
      .sort((a, b) => a.distance - b.distance)
  }, [myProfile, demoUsers, searchRadius])

  const pendingIncomingRequests = useMemo(() => {
    return (chatRequests || []).filter(req => req.toUserId === myProfile?.id && req.status === 'pending')
  }, [chatRequests, myProfile])

  const handleSaveProfile = (profileData: Omit<UserProfile, 'id' | 'location' | 'isActive' | 'lastActive'>) => {
    const isNewProfile = !myProfile
    const newProfile: UserProfile = {
      ...profileData,
      id: myProfile?.id || `user-current`,
      location: myProfile?.location || { lat: 38.2545, lng: -85.7145 },
      isActive: true,
      lastActive: Date.now()
    }
    setMyProfile(newProfile)
    setShowProfileDialog(false)
    
    if (isNewProfile && profileData.locationSharingEnabled) {
      const initialRequests = generateInitialChatRequests(newProfile, demoUsers, 3)
      if (initialRequests.length > 0) {
        setChatRequests(current => [...(current || []), ...initialRequests])
        toast.success(`Profile saved! You have ${initialRequests.length} new message requests.`)
      } else {
        toast.success('Profile saved! You are now discoverable nearby.')
      }
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

    const canMessage = 
      toUser.receiveMessagesFrom?.includes(myProfile.gender) &&
      toUser.ageRangeMin <= myProfile.age &&
      toUser.ageRangeMax >= myProfile.age &&
      myProfile.receiveMessagesFrom?.includes(toUser.gender) &&
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
    setChatRequests(current =>
      (current || []).map(req => (req.id === request.id ? { ...req, status: 'accepted' as const } : req))
    )

    const conversationId = [request.fromUserId, request.toUserId].sort().join('-')
    const existingConv = (conversations || []).find(c => c.id === conversationId)

    if (!existingConv) {
      const newConversation: Conversation = {
        id: conversationId,
        participants: [request.fromUserId, request.toUserId] as [string, string],
        unreadCount: 0
      }
      setConversations(current => [...(current || []), newConversation])
    }

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
    setDemoUsers(generateDemoUsers(1200))
    toast.success('Nearby users refreshed!')
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
    return (conversations || [])
      .filter(conv => myProfile && conv.participants.includes(myProfile.id))
      .map(conv => {
        const otherUserId = conv.participants.find(id => id !== myProfile?.id)
        const otherUser = demoUsers.find(u => u.id === otherUserId)
        return { ...conv, otherUser }
      })
      .filter(conv => conv.otherUser)
      .sort((a, b) => {
        const aTime = a.lastMessage?.timestamp || 0
        const bTime = b.lastMessage?.timestamp || 0
        return bTime - aTime
      })
  }, [conversations, myProfile, demoUsers])

  const currentConversation = activeConversations.find(c => c.id === selectedConversation)
  const currentMessages = selectedConversation ? (messages || {})[selectedConversation] || [] : []

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="text-red-600 drop-shadow-sm">Here</span>
              <span className="text-yellow-500 drop-shadow-sm">o</span>
            </h1>
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
                className="shadow-sm hover:shadow-md transition-all"
              >
                <User className="mr-1.5" size={18} />
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
            <div className="h-[600px] rounded-xl overflow-hidden border-2 border-border shadow-lg">
              <HeatMap points={heatMapData} />
            </div>
            <p className="text-center text-muted-foreground text-sm bg-muted/30 p-3 rounded-lg">
              Heat map shows approximate user density. Locations are fuzzed for privacy.
            </p>
          </TabsContent>

          <TabsContent value="discover" className="space-y-6">
            {!myProfile ? (
              <div className="text-center py-16">
                <div className="bg-muted/30 rounded-2xl p-8 max-w-md mx-auto shadow-sm">
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
                      className="flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
                    >
                      <ArrowsClockwise size={18} />
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

                {nearbyUsers.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="bg-muted/30 rounded-2xl p-8 max-w-md mx-auto">
                      <MagnifyingGlass className="mx-auto text-muted-foreground mb-4" size={56} weight="duotone" />
                      <p className="text-lg font-medium text-foreground mb-2">No Users Found</p>
                      <p className="text-muted-foreground">No users within {searchRadius[0]} km</p>
                      <p className="text-sm text-muted-foreground mt-2">Try increasing the search radius</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {nearbyUsers.map(({ user, distance, canMessage }) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        distance={formatDistance(distance)}
                        canMessage={canMessage}
                        onMessage={() => handleSendChatRequest(user)}
                        onViewProfile={() => handleViewUserProfile(user, distance)}
                      />
                    ))}
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
            ) : selectedConversation && currentConversation ? (
              <div className="h-[600px] rounded-xl overflow-hidden shadow-lg">
                <ChatInterface
                  messages={currentMessages}
                  currentUserId={myProfile.id}
                  otherUser={currentConversation.otherUser!}
                  onSendMessage={(text) => handleSendMessage(selectedConversation, text)}
                  onBack={() => setSelectedConversation(null)}
                  onViewProfile={() => handleViewUserProfile(currentConversation.otherUser!)}
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {activeConversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className="p-5 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-md cursor-pointer transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold cursor-pointer hover:scale-105 transition-transform text-lg shadow-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewUserProfile(conv.otherUser!)
                        }}
                      >
                        {conv.otherUser!.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="font-semibold text-lg cursor-pointer hover:text-primary transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewUserProfile(conv.otherUser!)
                          }}
                        >
                          {conv.otherUser!.name}
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
                ))}
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
                  return (
                    <div
                      key={request.id}
                      className="p-5 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold cursor-pointer hover:scale-105 transition-transform text-lg shadow-sm"
                            onClick={() => handleViewUserProfile(fromUser)}
                          >
                            {fromUser.name[0]}
                          </div>
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

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Your Profile</DialogTitle>
            <DialogDescription className="text-base">
              Complete your profile to start connecting with nearby users
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