import { useState, useEffect, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Toaster } from '@/components/ui/sonner'
import { MapTrifold, MagnifyingGlass, ChatCircle, User, Check, X, MapPin } from '@phosphor-icons/react'
import { HeatMap } from '@/components/HeatMap'
import { UserCard } from '@/components/UserCard'
import { ProfileForm } from '@/components/ProfileForm'
import { ChatInterface } from '@/components/ChatInterface'
import { UserProfileView } from '@/components/UserProfileView'
import { generateDemoUsers, calculateDistance, generateHeatMapData, formatDistance } from '@/lib/helpers'
import { toast } from 'sonner'
import type { UserProfile, ChatRequest, Message, Conversation } from '@/lib/types'

function App() {
  const [myProfile, setMyProfile] = useKV<UserProfile | null>('my-profile', null)
  const [demoUsers] = useState(() => generateDemoUsers(50))
  const [chatRequests, setChatRequests] = useKV<ChatRequest[]>('chat-requests', [])
  const [conversations, setConversations] = useKV<Conversation[]>('conversations', [])
  const [messages, setMessages] = useKV<Record<string, Message[]>>('messages', {})
  const [searchRadius, setSearchRadius] = useState([5])
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
      .map(user => ({
        user,
        distance: calculateDistance(
          myProfile.location.lat,
          myProfile.location.lng,
          user.location.lat,
          user.location.lng
        )
      }))
      .filter(item => item.distance <= searchRadius[0])
      .sort((a, b) => a.distance - b.distance)
  }, [myProfile, demoUsers, searchRadius])

  const pendingIncomingRequests = useMemo(() => {
    return (chatRequests || []).filter(req => req.toUserId === myProfile?.id && req.status === 'pending')
  }, [chatRequests, myProfile])

  const handleSaveProfile = (profileData: Omit<UserProfile, 'id' | 'location' | 'isActive' | 'lastActive'>) => {
    const newProfile: UserProfile = {
      ...profileData,
      id: myProfile?.id || `user-current`,
      location: myProfile?.location || { lat: 40.7580, lng: -73.9855 },
      isActive: true,
      lastActive: Date.now()
    }
    setMyProfile(newProfile)
    setShowProfileDialog(false)
    
    if (profileData.locationSharingEnabled) {
      toast.success('Profile saved! Location sharing enabled.')
    } else {
      toast.success('Profile saved! Location sharing disabled.')
    }
  }

  const handleSendChatRequest = (toUser: UserProfile) => {
    if (!myProfile) {
      toast.error('Please complete your profile first')
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
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Hereo
            </h1>
            <div className="flex items-center gap-3">
              {pendingIncomingRequests.length > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {pendingIncomingRequests.length}
                </Badge>
              )}
              {myProfile && !myProfile.locationSharingEnabled && (
                <Badge variant="outline" className="flex items-center gap-1.5">
                  <MapPin size={14} />
                  Location Off
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProfileDialog(true)}
              >
                <User className="mr-2" />
                {myProfile ? myProfile.name : 'Profile'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapTrifold />
              <span className="hidden sm:inline">Map</span>
            </TabsTrigger>
            <TabsTrigger value="discover" className="flex items-center gap-2">
              <MagnifyingGlass />
              <span className="hidden sm:inline">Discover</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex items-center gap-2">
              <ChatCircle />
              <span className="hidden sm:inline">Messages</span>
              {activeConversations.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeConversations.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <User />
              <span className="hidden sm:inline">Requests</span>
              {pendingIncomingRequests.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {pendingIncomingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-4">
            <div className="h-[600px] rounded-lg overflow-hidden border border-border">
              <HeatMap points={heatMapData} />
            </div>
            <p className="text-center text-muted-foreground text-sm">
              Heat map shows approximate user density. Locations are fuzzed for privacy.
            </p>
          </TabsContent>

          <TabsContent value="discover" className="space-y-6">
            {!myProfile ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Please complete your profile to discover nearby users.</p>
                <Button onClick={() => setShowProfileDialog(true)} className="mt-4 bg-primary">
                  Create Profile
                </Button>
              </div>
            ) : !myProfile.locationSharingEnabled ? (
              <div className="text-center py-12 space-y-4">
                <MapPin className="mx-auto text-muted-foreground" size={48} />
                <div className="space-y-2">
                  <p className="text-lg font-semibold">Location Sharing Disabled</p>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Enable location sharing in your profile settings to discover nearby users and be discovered by others.
                  </p>
                </div>
                <Button onClick={() => setShowProfileDialog(true)} className="mt-4 bg-primary">
                  Enable in Settings
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3 p-4 bg-card rounded-lg border border-border">
                  <Label>Search Radius: {searchRadius[0]} km</Label>
                  <Slider
                    value={searchRadius}
                    onValueChange={setSearchRadius}
                    min={1}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                </div>

                {nearbyUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <MagnifyingGlass className="mx-auto text-muted-foreground mb-4" size={48} />
                    <p className="text-muted-foreground">No users found within {searchRadius[0]} km</p>
                    <p className="text-sm text-muted-foreground mt-2">Try increasing the search radius</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {nearbyUsers.map(({ user, distance }) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        distance={formatDistance(distance)}
                        onMessage={() => handleSendChatRequest(user)}
                        onViewProfile={() => handleViewUserProfile(user, distance)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            {!myProfile ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Please complete your profile first.</p>
              </div>
            ) : activeConversations.length === 0 ? (
              <div className="text-center py-12">
                <ChatCircle className="mx-auto text-muted-foreground mb-4" size={48} />
                <p className="text-muted-foreground">No conversations yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Send a message request to start chatting
                </p>
              </div>
            ) : selectedConversation && currentConversation ? (
              <div className="h-[600px]">
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
              <div className="grid grid-cols-1 gap-3">
                {activeConversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv.id)}
                    className="p-4 bg-card rounded-lg border border-border hover:border-accent/50 cursor-pointer transition-all hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold cursor-pointer hover:scale-105 transition-transform"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewUserProfile(conv.otherUser!)
                        }}
                      >
                        {conv.otherUser!.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 
                          className="font-semibold cursor-pointer hover:text-primary transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleViewUserProfile(conv.otherUser!)
                          }}
                        >
                          {conv.otherUser!.name}
                        </h3>
                        {conv.lastMessage && (
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.lastMessage.text}
                          </p>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(conv.lastMessage.timestamp).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {!myProfile ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Please complete your profile first.</p>
              </div>
            ) : pendingIncomingRequests.length === 0 ? (
              <div className="text-center py-12">
                <User className="mx-auto text-muted-foreground mb-4" size={48} />
                <p className="text-muted-foreground">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingIncomingRequests.map(request => {
                  const fromUser = demoUsers.find(u => u.id === request.fromUserId)
                  if (!fromUser) return null
                  return (
                    <div
                      key={request.id}
                      className="p-4 bg-card rounded-lg border border-border flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold cursor-pointer hover:scale-105 transition-transform"
                          onClick={() => handleViewUserProfile(fromUser)}
                        >
                          {fromUser.name[0]}
                        </div>
                        <div>
                          <h3 
                            className="font-semibold cursor-pointer hover:text-primary transition-colors"
                            onClick={() => handleViewUserProfile(fromUser)}
                          >
                            {fromUser.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {fromUser.age} • {fromUser.gender}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(request)}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Check />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeclineRequest(request)}
                        >
                          <X />
                        </Button>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Your Profile</DialogTitle>
            <DialogDescription>
              Complete your profile to start connecting with nearby users
            </DialogDescription>
          </DialogHeader>
          <ProfileForm profile={myProfile || null} onSave={handleSaveProfile} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!pendingRequestUser} onOpenChange={() => setPendingRequestUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Request Sent!</DialogTitle>
            <DialogDescription>
              Your chat request has been sent to {pendingRequestUser?.name}. You'll be notified when they respond.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setPendingRequestUser(null)} className="bg-primary">
            Got it
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
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