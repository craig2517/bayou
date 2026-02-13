import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PaperPlaneTilt, ArrowLeft, ChatCircle } from '@phosphor-icons/react'
import type { Message, UserProfile } from '@/lib/types'

interface ChatInterfaceProps {
  messages: Message[]
  currentUserId: string
  otherUser: UserProfile
  onSendMessage: (text: string) => void
  onBack?: () => void
  onViewProfile?: () => void
}

export function ChatInterface({ messages, currentUserId, otherUser, onSendMessage, onBack, onViewProfile }: ChatInterfaceProps) {
  const [messageText, setMessageText] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (messageText.trim()) {
      onSendMessage(messageText.trim())
      setMessageText('')
    }
  }

  const otherUserInitials = otherUser.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()

  const isPhotoValid = () => {
    if (!otherUser.profilePicture) return false
    const now = Date.now()
    const hoursSinceCapture = (now - otherUser.profilePicture.capturedAt) / (1000 * 60 * 60)
    return hoursSinceCapture < 24
  }

  const photoValid = isPhotoValid()

  return (
    <Card className="flex flex-col h-full border-2 shadow-lg">
      <div className="p-5 border-b-2 border-border flex items-center gap-3 bg-muted/20">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="hover:bg-muted -ml-2"
          >
            <ArrowLeft size={20} />
          </Button>
        )}
        <Avatar 
          className="w-11 h-11 border-2 border-primary/20 cursor-pointer hover:scale-105 transition-transform shadow-sm"
          onClick={onViewProfile}
        >
          {photoValid && otherUser.profilePicture && (
            <AvatarImage src={otherUser.profilePicture.dataUrl} alt={otherUser.name} />
          )}
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
            {otherUserInitials}
          </AvatarFallback>
        </Avatar>
        <div 
          className="cursor-pointer hover:opacity-80 transition-opacity flex-1"
          onClick={onViewProfile}
        >
          <h3 className="font-semibold text-foreground text-base">{otherUser.name}</h3>
          <p className="text-sm text-muted-foreground">{otherUser.age} • {otherUser.gender}</p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-5" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <ChatCircle className="mx-auto mb-3" size={48} weight="duotone" />
              <p className="font-medium">Start the conversation!</p>
              <p className="text-sm mt-1">Send a message to break the ice.</p>
            </div>
          ) : (
            messages.map(message => {
              const isSent = message.senderId === currentUserId
              return (
                <div
                  key={message.id}
                  className={`flex ${isSent ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                      isSent
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md border border-border'
                    }`}
                  >
                    <p className="text-sm leading-relaxed break-words">{message.text}</p>
                    <p className={`text-xs mt-1.5 ${isSent ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-5 border-t-2 border-border bg-muted/20">
        <div className="flex gap-2.5">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 h-11"
          />
          <Button
            type="submit"
            disabled={!messageText.trim()}
            className="bg-primary hover:bg-primary/90 shadow-sm hover:shadow-md transition-all h-11 px-5"
          >
            <PaperPlaneTilt weight="fill" size={20} />
          </Button>
        </div>
      </form>
    </Card>
  )
}
