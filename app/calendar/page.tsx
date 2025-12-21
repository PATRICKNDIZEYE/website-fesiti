'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { TeamChat } from '@/components/TeamChat'
import { useLayout } from '@/contexts/LayoutContext'
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Link as LinkIcon, Unlink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import api from '@/lib/api'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'

interface CalendarEvent {
  id: string
  title: string
  description?: string
  startDate: string
  endDate?: string
  type: 'project_start' | 'project_end' | 'target_date' | 'custom'
  allDay: boolean
  location?: string
  projectId?: string
  project?: {
    id: string
    name: string
  }
  syncedToGoogle: boolean
}

export default function CalendarPage() {
  const router = useRouter()
  const { sidebarCollapsed, chatCollapsed } = useLayout()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [checkingGoogle, setCheckingGoogle] = useState(true)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    allDay: true,
    location: '',
    projectId: '',
    syncToGoogle: false,
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    checkGoogleStatus()
    fetchEvents()
  }, [router, currentDate])

  const checkGoogleStatus = async () => {
    try {
      const response = await api.get('/calendar/google-status')
      setGoogleConnected(response.data.connected)
    } catch (error) {
      console.error('Failed to check Google Calendar status:', error)
    } finally {
      setCheckingGoogle(false)
    }
  }

  const connectGoogleCalendar = async () => {
    try {
      const response = await api.get('/calendar/google-auth-url')
      window.location.href = response.data.authUrl
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to get Google Calendar auth URL')
    }
  }

  const disconnectGoogleCalendar = async () => {
    try {
      await api.delete('/calendar/google-disconnect')
      setGoogleConnected(false)
      alert('Google Calendar disconnected successfully')
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to disconnect Google Calendar')
    }
  }

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const start = startOfMonth(currentDate).toISOString()
      const end = endOfMonth(currentDate).toISOString()
      const response = await api.get('/calendar/events', {
        params: {
          startDate: start,
          endDate: end,
          includeProjectDates: 'true',
        },
      })
      setEvents(response.data)
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setSelectedEvent(null)
    setFormData({
      title: '',
      description: '',
      startDate: format(date, 'yyyy-MM-dd'),
      endDate: format(date, 'yyyy-MM-dd'),
      allDay: true,
      location: '',
      projectId: '',
      syncToGoogle: googleConnected,
    })
    setShowEventDialog(true)
  }

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setFormData({
      title: event.title,
      description: event.description || '',
      startDate: format(new Date(event.startDate), 'yyyy-MM-dd'),
      endDate: event.endDate ? format(new Date(event.endDate), 'yyyy-MM-dd') : '',
      allDay: event.allDay,
      location: event.location || '',
      projectId: event.projectId || '',
      syncToGoogle: false,
    })
    setShowEventDialog(true)
  }

  const handleSaveEvent = async () => {
    try {
      if (selectedEvent) {
        await api.patch(`/calendar/events/${selectedEvent.id}`, formData, {
          params: { syncToGoogle: formData.syncToGoogle },
        })
      } else {
        await api.post('/calendar/events', formData, {
          params: { syncToGoogle: formData.syncToGoogle },
        })
      }
      setShowEventDialog(false)
      await fetchEvents()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save event')
    }
  }

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      await api.delete(`/calendar/events/${selectedEvent.id}`)
      setShowEventDialog(false)
      await fetchEvents()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete event')
    }
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startDate)
      return isSameDay(eventDate, date)
    })
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case 'project_start':
        return 'bg-blue-500/20 text-blue-600 border-blue-500/30'
      case 'project_end':
        return 'bg-green-500/20 text-green-600 border-green-500/30'
      case 'target_date':
        return 'bg-gold-500/20 text-gold-600 border-gold-500/30'
      default:
        return 'bg-purple-500/20 text-purple-600 border-purple-500/30'
    }
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (loading || checkingGoogle) {
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
        <Header title="Calendar" />
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h2 className="text-2xl font-bold text-foreground">
                  {format(currentDate, 'MMMM yyyy')}
                </h2>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                {googleConnected ? (
                  <Button
                    variant="outline"
                    onClick={disconnectGoogleCalendar}
                    className="text-red-500"
                  >
                    <Unlink className="w-4 h-4 mr-2" />
                    Disconnect Google
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={connectGoogleCalendar}
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Connect Google Calendar
                  </Button>
                )}
                <Button
                  onClick={() => {
                    setSelectedDate(new Date())
                    setSelectedEvent(null)
                    setFormData({
                      title: '',
                      description: '',
                      startDate: format(new Date(), 'yyyy-MM-dd'),
                      endDate: format(new Date(), 'yyyy-MM-dd'),
                      allDay: true,
                      location: '',
                      projectId: '',
                      syncToGoogle: googleConnected,
                    })
                    setShowEventDialog(true)
                  }}
                  className="bg-gold-500 hover:bg-gold-600 text-charcoal-900"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Event
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="grid grid-cols-7 border-b border-border">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="p-4 text-center font-semibold text-foreground bg-muted/50"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {days.map((day, idx) => {
                  const dayEvents = getEventsForDate(day)
                  const isCurrentMonth = isSameMonth(day, currentDate)
                  const isToday = isSameDay(day, new Date())

                  return (
                    <div
                      key={idx}
                      className={cn(
                        "min-h-[120px] border-r border-b border-border p-2",
                        !isCurrentMonth && "bg-muted/30",
                        isToday && "bg-gold-500/10"
                      )}
                      onClick={() => handleDateClick(day)}
                    >
                      <div
                        className={cn(
                          "text-sm font-medium mb-1",
                          !isCurrentMonth && "text-muted-foreground",
                          isToday && "text-gold-600 font-bold"
                        )}
                      >
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEventClick(event)
                            }}
                            className={cn(
                              "text-xs p-1 rounded cursor-pointer hover:opacity-80",
                              getEventColor(event.type)
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <span className="truncate">{event.title}</span>
                              {event.syncedToGoogle && (
                                <CalendarIcon className="w-3 h-3 ml-1 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <TeamChat />

      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedEvent ? 'Edit Event' : 'Create New Event'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Event title"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Event description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allDay"
                checked={formData.allDay}
                onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="allDay">All Day</Label>
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Event location"
              />
            </div>
            {googleConnected && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="syncToGoogle"
                  checked={formData.syncToGoogle}
                  onChange={(e) => setFormData({ ...formData, syncToGoogle: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="syncToGoogle">Sync to Google Calendar</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            {selectedEvent && (
              <Button
                variant="destructive"
                onClick={handleDeleteEvent}
              >
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEvent} className="bg-gold-500 hover:bg-gold-600 text-charcoal-900">
              {selectedEvent ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
