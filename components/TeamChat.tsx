'use client'

import { useState, useEffect } from 'react'
import { Search, Phone, Smile, Mic, Send, Maximize2, X, ChevronRight, MessageSquare, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useLayout } from '@/contexts/LayoutContext'
import { EmojiPickerComponent } from './EmojiPicker'
import { VoiceRecorder } from './VoiceRecorder'
import api from '@/lib/api'
import { orgApi } from '@/lib/api-helpers'
import { format } from 'date-fns'
import { useRouter, usePathname } from 'next/navigation'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
}

interface Message {
  id: string
  content: string
  type: 'text' | 'image' | 'file' | 'voice'
  sender: User
  senderId: string
  createdAt: string
}

interface TeamChatProps {
  orgId?: string
}

export function TeamChat({ orgId }: TeamChatProps = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const [message, setMessage] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [recentMessages, setRecentMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null)
  const { chatCollapsed, setChatCollapsed } = useLayout()
  
  // Extract orgId from pathname if not provided
  const currentOrgId = orgId || (pathname.match(/^\/org\/([^/]+)/)?.[1] ?? null)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setCurrentUser(JSON.parse(userStr))
    }
    if (currentOrgId) {
      fetchRecentMessages()
      const interval = setInterval(fetchRecentMessages, 5000) // Poll every 5 seconds
      return () => clearInterval(interval)
    }
  }, [currentOrgId])

  const fetchRecentMessages = async () => {
    if (!currentOrgId) return
    
    try {
      const response = await orgApi.get(currentOrgId, 'messages/conversations')
      const conversations = response.data || []
      
      // Get messages from all conversations
      const allMessages: Message[] = []
      for (const conv of conversations.slice(0, 5)) {
        try {
          const msgResponse = await orgApi.get(currentOrgId, `messages/conversations/${conv.id}/messages`, {
            params: { limit: 3 },
          })
          if (msgResponse.data.messages) {
            allMessages.push(...msgResponse.data.messages)
          }
        } catch (e) {
          // Skip if error
        }
      }
      
      // Sort by date and take most recent
      allMessages.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      setRecentMessages(allMessages.slice(0, 10))
    } catch (error) {
      console.error('Failed to fetch recent messages:', error)
    }
  }

  const handleSendMessage = async () => {
    if ((!message.trim() && !voiceBlob) || loading) return

    // Redirect to messages page to send
    if (currentOrgId) {
      router.push(`/org/${currentOrgId}/messages`)
    } else {
      router.push('/messages')
    }
  }

  const toggleCollapse = () => {
    setChatCollapsed(!chatCollapsed)
    if (!chatCollapsed) {
      setExpanded(false)
    }
  }

  const toggleExpand = () => {
    if (chatCollapsed) {
      setChatCollapsed(false)
    } else {
      setExpanded(!expanded)
    }
  }

  const getParticipantName = (user: User) => {
    return `${user.firstName} ${user.lastName}`
  }

  const getParticipantInitials = (user: User) => {
    return `${user.firstName[0]}${user.lastName[0]}`
  }

  if (chatCollapsed) {
    return (
      <div className="w-12 bg-card border-l border-border flex flex-col h-screen fixed right-0 top-0 z-40">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="h-12 w-12 rounded-none hover:bg-accent"
          aria-label="Open team chat"
        >
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>
    )
  }

  return (
    <div 
      className={cn(
        "bg-card border-l border-border flex flex-col h-screen fixed right-0 top-0 z-40 transition-all duration-300",
        expanded ? "fixed inset-0 z-50" : "w-80"
      )}
      data-tour="team-chat"
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-card">
        <div className="flex items-center space-x-3">
          <Avatar className="border-2 border-border">
            <AvatarFallback className="bg-gold-500/20 text-gold-500 font-semibold border border-gold-500/30">
              TC
            </AvatarFallback>
          </Avatar>
          {!expanded && (
            <div>
              <h3 className="font-semibold text-foreground">Team Chat</h3>
              <p className="text-xs text-gold-500">Recent Messages</p>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-1">
          {!expanded && (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => {
                  if (currentOrgId) {
                    router.push(`/org/${currentOrgId}/messages`)
                  } else {
                    router.push('/messages')
                  }
                }}
              >
                <Search className="w-4 h-4 text-muted-foreground" />
              </Button>
            </>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={toggleExpand}
            aria-label={expanded ? "Minimize chat" : "Expand chat"}
          >
            {expanded ? (
              <X className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Maximize2 className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
          {!expanded && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={toggleCollapse}
              aria-label="Collapse chat"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
        {recentMessages.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            <p>No recent messages</p>
            <Button
              variant="link"
              onClick={() => {
                if (currentOrgId) {
                  router.push(`/org/${currentOrgId}/messages`)
                } else {
                  router.push('/messages')
                }
              }}
              className="mt-2"
            >
              Go to Messages
            </Button>
          </div>
        ) : (
          <>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Recent
            </div>
            {recentMessages.map((msg) => {
              const isOwn = msg.senderId === currentUser?.id
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[75%] ${isOwn ? 'order-2' : 'order-1'}`}>
                    {!isOwn && (
                      <div className="flex items-center space-x-2 mb-1 px-1">
                        <Avatar className="w-6 h-6 border border-border">
                          <AvatarFallback className="bg-gold-500/20 text-gold-500 text-xs border border-gold-500/30">
                            {getParticipantInitials(msg.sender)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-muted-foreground">
                          {getParticipantName(msg.sender)}
                        </span>
                      </div>
                    )}
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2.5",
                        isOwn
                          ? "bg-gold-500 text-charcoal-900 dark:text-charcoal-900 rounded-br-sm"
                          : "bg-secondary text-foreground rounded-bl-sm shadow-sm border border-border"
                      )}
                    >
                      {msg.type === 'voice' ? (
                        <div className="flex items-center space-x-3">
                          <div className="flex space-x-0.5">
                            {[...Array(20)].map((_, i) => (
                              <div
                                key={i}
                                className="w-0.5 bg-current rounded-full"
                                style={{
                                  height: `${Math.random() * 16 + 4}px`,
                                  opacity: 0.7,
                                }}
                              />
                            ))}
                          </div>
                          <span className="text-xs opacity-90">Voice</span>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      )}
                    </div>
                    <div className={cn("flex items-center space-x-2 mt-1 px-1", isOwn ? "justify-end" : "justify-start")}>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(msg.createdAt), 'HH:mm')}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Type Message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage()
              }
            }}
            className="flex-1 bg-background border-border text-foreground placeholder:text-muted-foreground"
          />
          <EmojiPickerComponent
            onEmojiClick={(emoji) => setMessage((prev) => prev + emoji)}
          />
          {voiceBlob ? (
            <div className="flex items-center space-x-1 p-1 bg-muted rounded">
              <span className="text-xs">Voice</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setVoiceBlob(null)}
                className="h-6 w-6"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <VoiceRecorder
              onRecordingComplete={(blob) => setVoiceBlob(blob)}
              onCancel={() => setVoiceBlob(null)}
            />
          )}
          <Button 
            size="icon" 
            className="h-10 w-10 bg-gold-500 hover:bg-gold-600 text-charcoal-900"
            onClick={handleSendMessage}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <div className="mt-2 text-xs text-center text-muted-foreground">
          <Button
            variant="link"
            onClick={() => {
              if (currentOrgId) {
                router.push(`/org/${currentOrgId}/messages`)
              } else {
                router.push('/messages')
              }
            }}
            className="h-auto p-0 text-xs"
          >
            Open full messages →
          </Button>
        </div>
      </div>
    </div>
  )
}
