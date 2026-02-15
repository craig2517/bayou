import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PaperPlaneTilt, ArrowLeft, ChatCircle } from '@phosphor-icons/react'
import { isPhotoValid } from '@/lib/helpers'
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
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]')
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight
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

  const photoValid = otherUser.profilePicture ? isPhotoValid(otherUser.profilePicture) : false

  return (
    <Card className="flex flex-col h-full border-2 shadow-xl">
      <div className="p-5 border-b-2 border-border flex items-center gap-3 bg-gradient-to-r from-muted/30 to-muted/10 backdrop-blur-sm">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="hover:bg-muted/60 -ml-2 transition-colors"
          >
            <ArrowLeft size={20} weight="bold" />
          </Button>
        )}
        <Avatar 
          className="w-12 h-12 border-2 border-primary/30 cursor-pointer hover:scale-110 transition-transform duration-200 shadow-md"
          onClick={onViewProfile}
        >
          {photoValid && otherUser.profilePicture && (
            <AvatarImage src={otherUser.profilePicture.dataUrl} alt={otherUser.name} />
          )}
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold text-base">
            {otherUserInitials}
          </AvatarFallback>
        </Avatar>
        <div 
          className="cursor-pointer hover:opacity-80 transition-opacity flex-1"
          onClick={onViewProfile}
        >
          <h3 className="font-semibold text-foreground text-base">{otherUser.name}</h3>
          <p className="text-sm text-muted-foreground font-medium">{otherUser.age} • {otherUser.gender}</p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
              <ChatCircle className="mx-auto mb-4" size={56} weight="duotone" />
              <p className="font-semibold text-lg text-foreground mb-2">Start the conversation!</p>
              <p className="text-sm">Send a message to break the ice.</p>
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
                    className={`max-w-[75%] rounded-2xl px-4 py-3.5 shadow-md ${
                      isSent
                        ? 'bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-md'
                        : 'bg-muted text-foreground rounded-bl-md border-2 border-border'
                    }`}
                  >
                    <p className="text-sm leading-relaxed break-words font-medium">{message.text}</p>
                    <p className={`text-xs mt-2 font-medium ${isSent ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
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

      <form onSubmit={handleSubmit} className="p-5 border-t-2 border-border bg-gradient-to-r from-muted/30 to-muted/10 backdrop-blur-sm">
        <div className="flex gap-3">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 h-12 border-border/60 focus:border-primary transition-colors text-base"
          />
          <Button
            type="submit"
            disabled={!messageText.trim()}
            className="bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all duration-200 h-12 px-6"
          >
            <PaperPlaneTilt weight="fill" size={22} />
          </Button>
        </div>
      </form>
    </Card>
  )
}
