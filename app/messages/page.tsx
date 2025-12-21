'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { TeamChat } from '@/components/TeamChat'
import { useLayout } from '@/contexts/LayoutContext'
import { cn } from '@/lib/utils'
import { Search, Send, Paperclip, Image as ImageIcon, X, Play, Pause, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { EmojiPickerComponent } from '@/components/EmojiPicker'
import { VoiceRecorder } from '@/components/VoiceRecorder'
import api from '@/lib/api'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
}

interface MessageAttachment {
  id: string
  fileName: string
  filePath: string
  mimeType: string
  fileSize: number
  type: 'image' | 'file' | 'voice'
  duration?: number
}

interface Message {
  id: string
  content: string
  type: 'text' | 'image' | 'file' | 'voice'
  sender: User
  senderId: string
  attachments?: MessageAttachment[]
  isRead: boolean
  createdAt: string
}

interface Conversation {
  id: string
  participant1: User
  participant2: User
  participant1Id: string
  participant2Id: string
  lastMessageAt: string | null
  messages?: Message[]
}

export default function MessagesPage() {
  const router = useRouter()
  const { sidebarCollapsed, chatCollapsed } = useLayout()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showNewConversation, setShowNewConversation] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({})

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const userStr = localStorage.getItem('user')
    if (userStr) {
      setCurrentUser(JSON.parse(userStr))
    }

    fetchConversations()
    fetchAvailableUsers()
  }, [router])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id)
      const interval = setInterval(() => {
        fetchMessages(selectedConversation.id, false)
      }, 3000) // Poll every 3 seconds
      return () => clearInterval(interval)
    }
  }, [selectedConversation])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await api.get('/messages/conversations')
      setConversations(response.data)
      if (response.data.length > 0 && !selectedConversation) {
        setSelectedConversation(response.data[0])
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      const response = await api.get('/messages/users')
      setAvailableUsers(response.data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleStartConversation = async (userId: string) => {
    try {
      const response = await api.post('/messages/conversations', {
        participant2Id: userId,
      })
      const newConversation = response.data
      setSelectedConversation(newConversation)
      setShowNewConversation(false)
      await fetchConversations()
    } catch (error: any) {
      console.error('Failed to start conversation:', error)
      alert(error.response?.data?.message || 'Failed to start conversation')
    }
  }

  const fetchMessages = async (conversationId: string, showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      const response = await api.get(`/messages/conversations/${conversationId}/messages`, {
        params: { limit: 100 },
      })
      setMessages(response.data.messages || [])
    } catch (error) {
      console.error('Failed to fetch messages:', error)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if ((!message.trim() && selectedFiles.length === 0 && !voiceBlob) || sending) return

    if (!selectedConversation) {
      alert('Please select a conversation')
      return
    }

    try {
      setSending(true)
      const formData = new FormData()
      formData.append('content', message || '')
      formData.append('conversationId', selectedConversation.id)

      // Add files
      if (selectedFiles.length > 0) {
        selectedFiles.forEach((file) => {
          formData.append('attachments', file)
        })
      }

      // Add voice note
      if (voiceBlob) {
        const voiceFile = new File([voiceBlob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
        formData.append('attachments', voiceFile)
      }

      await api.post(`/messages/conversations/${selectedConversation.id}/messages`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setMessage('')
      setSelectedFiles([])
      setVoiceBlob(null)
      await fetchMessages(selectedConversation.id, false)
      await fetchConversations()
    } catch (error: any) {
      console.error('Failed to send message:', error)
      alert(error.response?.data?.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setSelectedFiles((prev) => [...prev, ...files])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const getOtherParticipant = (conversation: Conversation): User => {
    if (!currentUser) return conversation.participant1
    return conversation.participant1Id === currentUser.id
      ? conversation.participant2
      : conversation.participant1
  }

  const getParticipantName = (user: User) => {
    return `${user.firstName} ${user.lastName}`
  }

  const getParticipantInitials = (user: User) => {
    return `${user.firstName[0]}${user.lastName[0]}`
  }

  const handlePlayAudio = (messageId: string, audioUrl: string) => {
    if (!audioRefs.current[messageId]) {
      const audio = new Audio(audioUrl)
      audioRefs.current[messageId] = audio
      audio.onended = () => {
        delete audioRefs.current[messageId]
      }
    }
    const audio = audioRefs.current[messageId]
    if (audio.paused) {
      audio.play()
    } else {
      audio.pause()
    }
  }

  const getFileUrl = (filePath: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    // Use the full filePath as stored in the database
    // The backend expects the relative path
    return `${apiUrl}/messages/files/${encodeURIComponent(filePath)}`
  }

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true
    const other = getOtherParticipant(conv)
    const name = getParticipantName(other).toLowerCase()
    return name.includes(searchQuery.toLowerCase())
  })

  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all duration-300",
        sidebarCollapsed ? "ml-20" : "ml-64",
        chatCollapsed ? "mr-12" : "mr-80"
      )}>
        <Header title="Messages" />
        
        <div className="flex-1 flex overflow-hidden">
          {/* Conversations List */}
          <div className="w-80 border-r border-border bg-card flex flex-col">
            <div className="p-4 border-b border-border space-y-2">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-foreground">Conversations</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNewConversation(true)}
                  className="h-8 w-8"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const other = getOtherParticipant(conversation)
                  const isSelected = selectedConversation?.id === conversation.id
                  
                  return (
                    <div
                      key={conversation.id}
                      onClick={() => setSelectedConversation(conversation)}
                      className={cn(
                        "p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors",
                        isSelected && "bg-muted"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-gold-500/20 text-gold-500 border border-gold-500/30">
                            {getParticipantInitials(other)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-foreground truncate">
                              {getParticipantName(other)}
                            </p>
                            {conversation.lastMessageAt && (
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(conversation.lastMessageAt), 'HH:mm')}
                              </span>
                            )}
                          </div>
                          {conversation.messages && conversation.messages.length > 0 && (
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.messages[conversation.messages.length - 1].content.substring(0, 30)}
                              {conversation.messages[conversation.messages.length - 1].content.length > 30 ? '...' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Chat View */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border bg-card">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback className="bg-gold-500/20 text-gold-500 border border-gold-500/30">
                        {getParticipantInitials(getOtherParticipant(selectedConversation))}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">
                        {getParticipantName(getOtherParticipant(selectedConversation))}
                      </p>
                      <p className="text-xs text-muted-foreground">Online</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
                  {messages.map((msg) => {
                    const isOwn = msg.senderId === currentUser?.id
                    return (
                      <div
                        key={msg.id}
                        className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                      >
                        <div className={cn("max-w-[70%]", isOwn ? "order-2" : "order-1")}>
                          {!isOwn && (
                            <div className="flex items-center space-x-2 mb-1 px-1">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="bg-gold-500/20 text-gold-500 text-xs">
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
                                : "bg-card text-foreground rounded-bl-sm shadow-sm border border-border"
                            )}
                          >
                            {msg.type === 'voice' && msg.attachments && msg.attachments[0] ? (
                              <div className="flex items-center space-x-3">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handlePlayAudio(msg.id, getFileUrl(msg.attachments![0].filePath))}
                                  className="h-8 w-8"
                                >
                                  <Play className="w-4 h-4" />
                                </Button>
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
                                {msg.attachments[0].duration && (
                                  <span className="text-xs opacity-90">
                                    {Math.floor(msg.attachments[0].duration / 60)}:
                                    {(msg.attachments[0].duration % 60).toString().padStart(2, '0')}
                                  </span>
                                )}
                              </div>
                            ) : msg.type === 'image' && msg.attachments && msg.attachments[0] ? (
                              <div className="space-y-2">
                                <img
                                  src={getFileUrl(msg.attachments[0].filePath)}
                                  alt={msg.attachments[0].fileName}
                                  className="max-w-full rounded-lg"
                                />
                                {msg.content && <p className="text-sm">{msg.content}</p>}
                              </div>
                            ) : msg.type === 'file' && msg.attachments && msg.attachments[0] ? (
                              <div className="space-y-2">
                                <a
                                  href={getFileUrl(msg.attachments[0].filePath)}
                                  download
                                  className="flex items-center space-x-2 text-sm underline"
                                >
                                  <Paperclip className="w-4 h-4" />
                                  <span>{msg.attachments[0].fileName}</span>
                                </a>
                                {msg.content && <p className="text-sm">{msg.content}</p>}
                              </div>
                            ) : (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            )}
                          </div>
                          <div className={cn("flex items-center space-x-2 mt-1 px-1", isOwn ? "justify-end" : "justify-start")}>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(msg.createdAt), 'HH:mm')}
                            </span>
                            {isOwn && msg.isRead && (
                              <span className="text-xs text-muted-foreground">✓✓</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Selected Files Preview */}
                {selectedFiles.length > 0 && (
                  <div className="px-4 py-2 border-t border-border bg-card">
                    <div className="flex flex-wrap gap-2">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="relative">
                          {file.type.startsWith('image/') ? (
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 bg-red-500 hover:bg-red-600 text-white"
                                onClick={() => removeFile(index)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 p-2 bg-muted rounded-lg border border-border">
                              <Paperclip className="w-4 h-4" />
                              <span className="text-xs truncate max-w-[100px]">{file.name}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-500"
                                onClick={() => removeFile(index)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="p-4 border-t border-border bg-card">
                  <div className="flex items-end space-x-2">
                    <div className="flex-1 flex flex-col space-y-2">
                      <Input
                        type="text"
                        placeholder="Type a message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                        className="bg-background border-border"
                      />
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-10 w-10"
                    >
                      <Paperclip className="w-5 h-5" />
                    </Button>
                    {voiceBlob ? (
                      <div className="flex items-center space-x-2 p-2 bg-muted rounded-lg">
                        <span className="text-xs text-muted-foreground">Voice note ready</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setVoiceBlob(null)}
                          className="h-6 w-6 text-red-500"
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
                    <EmojiPickerComponent
                      onEmojiClick={(emoji) => setMessage((prev) => prev + emoji)}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={sending || (!message.trim() && selectedFiles.length === 0 && !voiceBlob)}
                      className="h-10 w-10 bg-gold-500 hover:bg-gold-600 text-charcoal-900"
                    >
                      {sending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Select a conversation to start messaging
              </div>
            )}
          </div>
        </div>
      </div>

      <TeamChat />

      {/* New Conversation Dialog */}
      <Dialog open={showNewConversation} onOpenChange={setShowNewConversation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {availableUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No users available</p>
            ) : (
              availableUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleStartConversation(user.id)}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                >
                  <Avatar>
                    <AvatarFallback className="bg-gold-500/20 text-gold-500 border border-gold-500/30">
                      {getParticipantInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {getParticipantName(user)}
                    </p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
