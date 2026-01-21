'use client'
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Header } from '@/components/Header'
import { TeamChat } from '@/components/TeamChat'
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Link as LinkIcon, Unlink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { orgApi } from '@/lib/api-helpers'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns'
import { ConfirmationModal } from '@/components/ConfirmationModal'

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
  const params = useParams()
  const orgId = params.orgId as string
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [googleConnected, setGoogleConnected] = useState(false)
  const [checkingGoogle, setCheckingGoogle] = useState(true)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)
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

    if (!orgId) {
      console.error('Organization ID not found in route')
      return
    }

    checkGoogleStatus()
    fetchEvents()
  }, [router, orgId, currentDate])

  const checkGoogleStatus = async () => {
    try {
      const response = await orgApi.get(orgId, 'calendar/google-status')
      setGoogleConnected(response.data.connected)
    } catch (error) {
      console.error('Failed to check Google Calendar status:', error)
    } finally {
      setCheckingGoogle(false)
    }
  }

  const connectGoogleCalendar = async () => {
    try {
      // Store orgId for callback
      localStorage.setItem('currentOrgId', orgId)
      
      const response = await orgApi.get(orgId, 'calendar/google-auth-url')
      window.location.href = response.data.authUrl
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to get Google Calendar auth URL')
    }
  }

  const disconnectGoogleCalendar = async () => {
    try {
      await orgApi.delete(orgId, 'calendar/google-disconnect')
      setGoogleConnected(false)
      alert('Google Calendar disconnected successfully')
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to disconnect Google Calendar')
    }
  }

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const start = startOfMonth(currentDate)
      const end = endOfMonth(currentDate)
      const response = await orgApi.get(orgId, 'calendar/events', {
        params: {
          startDate: format(start, 'yyyy-MM-dd'),
          endDate: format(end, 'yyyy-MM-dd'),
        },
      })
      setEvents(response.data)
    } catch (error) {
      console.error('Failed to fetch events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEvent = async () => {
    try {
      // Filter out empty strings for optional fields
      const payload = {
        ...formData,
        projectId: formData.projectId && formData.projectId.trim() !== '' ? formData.projectId : undefined,
        description: formData.description && formData.description.trim() !== '' ? formData.description : undefined,
        location: formData.location && formData.location.trim() !== '' ? formData.location : undefined,
        endDate: formData.endDate && formData.endDate.trim() !== '' ? formData.endDate : undefined,
      }
      await orgApi.post(orgId, 'calendar/events', payload)
      await fetchEvents()
      setShowEventDialog(false)
      setFormData({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        allDay: true,
        location: '',
        projectId: '',
        syncToGoogle: false,
      })
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create event')
    }
  }

  const handleUpdateEvent = async () => {
    if (!selectedEvent) return
    try {
      // Filter out empty strings for optional fields
      const payload = {
        ...formData,
        projectId: formData.projectId && formData.projectId.trim() !== '' ? formData.projectId : undefined,
        description: formData.description && formData.description.trim() !== '' ? formData.description : undefined,
        location: formData.location && formData.location.trim() !== '' ? formData.location : undefined,
        endDate: formData.endDate && formData.endDate.trim() !== '' ? formData.endDate : undefined,
      }
      await orgApi.patch(orgId, `calendar/events/${selectedEvent.id}`, payload)
      await fetchEvents()
      setShowEventDialog(false)
      setSelectedEvent(null)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update event')
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    // Delete will be handled by modal
    setEventToDelete(eventId)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!eventToDelete) return
    try {
      await orgApi.delete(orgId, `calendar/events/${eventToDelete}`)
      setShowDeleteModal(false)
      setEventToDelete(null)
      setShowDeleteModal(false)
      setEventToDelete(null)
      await fetchEvents()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete event')
      setShowDeleteModal(false)
      setEventToDelete(null)
    }
  }

  const openCreateDialog = (date: Date) => {
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
      syncToGoogle: false,
    })
    setShowEventDialog(true)
  }

  const openEditDialog = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setFormData({
      title: event.title,
      description: event.description || '',
      startDate: format(new Date(event.startDate), 'yyyy-MM-dd'),
      endDate: event.endDate ? format(new Date(event.endDate), 'yyyy-MM-dd') : '',
      allDay: event.allDay,
      location: event.location || '',
      projectId: event.projectId || '',
      syncToGoogle: event.syncedToGoogle,
    })
    setShowEventDialog(true)
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startDate)
      return isSameDay(eventDate, date)
    })
  }

  if (loading && checkingGoogle) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Header title="Calendar" subtitle="Milestones, field visits, and reporting deadlines." />

      <div className="space-y-6">
        <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h1 className="text-2xl font-bold text-foreground">
                  {format(currentDate, 'MMMM yyyy')}
                </h1>
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
                  onClick={() => openCreateDialog(new Date())}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Event
                </Button>
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="grid grid-cols-7 gap-px bg-border">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="bg-muted/50 p-2 text-center text-sm font-semibold text-foreground">
                    {day}
                  </div>
                ))}
                {days.map((day) => {
                  const dayEvents = getEventsForDate(day)
                  const isCurrentMonth = isSameMonth(day, currentDate)
                  const isToday = isSameDay(day, new Date())
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "min-h-[100px] p-2 bg-card border-r border-b border-border",
                        !isCurrentMonth && "bg-muted/30",
                        isToday && "bg-primary/10"
                      )}
                    >
                      <div className={cn(
                        "text-sm font-medium mb-1",
                        isToday && "text-primary",
                        !isCurrentMonth && "text-muted-foreground"
                      )}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            onClick={() => openEditDialog(event)}
                            className="text-xs p-1 rounded bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 truncate"
                            title={event.title}
                          >
                            {event.title}
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

      <TeamChat orgId={orgId} />

      {/* Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedEvent ? 'Edit Event' : 'Create Event'}
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
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Event location"
              />
            </div>
          </div>
          <DialogFooter>
            {selectedEvent && (
              <Button
                variant="destructive"
                onClick={() => {
                  handleDeleteEvent(selectedEvent.id)
                  setShowEventDialog(false)
                }}
              >
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={selectedEvent ? handleUpdateEvent : handleCreateEvent}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {selectedEvent ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
