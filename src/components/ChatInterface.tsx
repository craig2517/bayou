import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PaperPlaneTilt, ArrowLeft } from '@phosphor-icons/react'
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

  return (
    <Card className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center gap-3">
        {onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="hover:bg-muted"
          >
            <ArrowLeft size={20} />
          </Button>
        )}
        <Avatar 
          className="w-10 h-10 border-2 border-primary/20 cursor-pointer hover:scale-105 transition-transform"
          onClick={onViewProfile}
        >
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold">
            {otherUserInitials}
          </AvatarFallback>
        </Avatar>
        <div 
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onViewProfile}
        >
          <h3 className="font-semibold text-foreground">{otherUser.name}</h3>
          <p className="text-sm text-muted-foreground">{otherUser.age} • {otherUser.gender}</p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>Start the conversation!</p>
            </div>
          ) : (
            messages.map(message => {
              const isSent = message.senderId === currentUserId
              return (
                <div
                  key={message.id}
                  className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      isSent
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted text-foreground rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    <p className={`text-xs mt-1 ${isSent ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
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

      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!messageText.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            <PaperPlaneTilt weight="fill" />
          </Button>
        </div>
      </form>
    </Card>
  )
}
