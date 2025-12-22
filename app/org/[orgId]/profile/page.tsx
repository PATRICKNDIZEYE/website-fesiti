'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { TeamChat } from '@/components/TeamChat'
import { useLayout } from '@/contexts/LayoutContext'
import { Edit2, Save, X, Camera, Mail, Phone, MapPin, Briefcase, Building, Link as LinkIcon, Twitter, Linkedin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { orgApi } from '@/lib/api-helpers'
import api from '@/lib/api'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  bio?: string
  phone?: string
  jobTitle?: string
  department?: string
  location?: string
  skills?: string
  linkedInUrl?: string
  twitterUrl?: string
  role: string
  createdAt: string
}

export default function ProfilePage() {
  const router = useRouter()
  const params = useParams()
  const orgId = params.orgId as string
  const { sidebarCollapsed, chatCollapsed } = useLayout()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
    phone: '',
    jobTitle: '',
    department: '',
    location: '',
    skills: '',
    linkedInUrl: '',
    twitterUrl: '',
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

    fetchProfile()
  }, [router, orgId])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await orgApi.get(orgId, 'users/profile/me')
      const userData = response.data
      setUser(userData)
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        bio: userData.bio || '',
        phone: userData.phone || '',
        jobTitle: userData.jobTitle || '',
        department: userData.department || '',
        location: userData.location || '',
        skills: userData.skills || '',
        linkedInUrl: userData.linkedInUrl || '',
        twitterUrl: userData.twitterUrl || '',
      })
      
      // Update localStorage with latest user data
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          const storedUser = JSON.parse(userStr)
          storedUser.firstName = userData.firstName
          storedUser.lastName = userData.lastName
          storedUser.email = userData.email
          storedUser.avatar = userData.avatar // Store relative path
          localStorage.setItem('user', JSON.stringify(storedUser))
        } catch (error) {
          console.error('Failed to update user in localStorage:', error)
        }
      }
      
      return userData
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      return null
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]
    
    // Show preview immediately
    const reader = new FileReader()
    reader.onloadend = () => {
      if (user) {
        setUser({ ...user, avatar: reader.result as string })
      }
    }
    reader.readAsDataURL(file)

    const formData = new FormData()
    formData.append('avatar', file)

    try {
      setUploading(true)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await api.post(`${apiUrl}/org/${orgId}/users/profile/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      // Update with the server response
      if (user && response.data.avatar) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        const fullAvatarUrl = `${apiUrl}${response.data.avatar}`
        setUser({ ...user, avatar: fullAvatarUrl })
        
        // Update localStorage so Sidebar can pick it up
        const userStr = localStorage.getItem('user')
        if (userStr) {
          try {
            const userData = JSON.parse(userStr)
            userData.avatar = response.data.avatar // Store relative path, Sidebar will construct full URL
            localStorage.setItem('user', JSON.stringify(userData))
          } catch (error) {
            console.error('Failed to update user in localStorage:', error)
          }
        }
      }
      
      await fetchProfile()
    } catch (error: any) {
      console.error('Avatar upload error:', error)
      alert(error.response?.data?.message || 'Failed to upload avatar')
      // Revert to original avatar on error
      await fetchProfile()
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await orgApi.patch(orgId, 'users/profile/me', formData)
      const updatedUser = await fetchProfile()
      setEditing(false)
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (user: User) => {
    return `${user.firstName[0]}${user.lastName[0]}`
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-600 border-red-500/30'
      case 'manager':
        return 'bg-gold-500/20 text-gold-600 border-gold-500/30'
      case 'field_staff':
        return 'bg-blue-500/20 text-blue-600 border-blue-500/30'
      default:
        return 'bg-gray-500/20 text-gray-600 border-gray-500/30'
    }
  }

  const skillsArray = user?.skills ? (typeof user.skills === 'string' ? JSON.parse(user.skills) : user.skills) : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">User not found</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar orgId={orgId} />
      
      <div className={cn(
        "flex-1 flex flex-col overflow-hidden transition-all duration-300",
        sidebarCollapsed ? "ml-20" : "ml-64",
        chatCollapsed ? "mr-12" : "mr-80"
      )}>
        <Header title="Profile" />
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-4xl mx-auto">
            {/* Profile Header */}
            <div className="bg-card rounded-lg border border-border p-8 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <Avatar className="w-32 h-32 border-4 border-border">
                      <AvatarImage 
                        src={user.avatar ? (
                          user.avatar.startsWith('http') || user.avatar.startsWith('data:') 
                            ? user.avatar 
                            : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${user.avatar.startsWith('/') ? '' : '/'}${user.avatar}`
                        ) : undefined} 
                        onError={(e) => {
                          console.error('Failed to load avatar image:', user.avatar)
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <AvatarFallback className="bg-gold-500/20 text-gold-500 text-3xl font-bold border border-gold-500/30">
                        {getInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    {editing && (
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute bottom-0 right-0 rounded-full"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                      >
                        {uploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                  <div>
                    {editing ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              value={formData.firstName}
                              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              value={formData.lastName}
                              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h2 className="text-3xl font-bold text-foreground mb-2">
                          {user.firstName} {user.lastName}
                        </h2>
                        <p className="text-muted-foreground mb-3">{user.email}</p>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {editing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditing(false)
                          fetchProfile()
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gold-500 hover:bg-gold-600 text-charcoal-900"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => setEditing(true)}
                      className="bg-gold-500 hover:bg-gold-600 text-charcoal-900"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="mb-6">
                {editing ? (
                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={4}
                      className="mt-2"
                    />
                  </div>
                ) : (
                  <p className="text-foreground text-lg leading-relaxed">
                    {user.bio || 'No bio yet. Click "Edit Profile" to add one.'}
                  </p>
                )}
              </div>

              {/* Contact & Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground">{user.email}</span>
                  </div>
                  {editing ? (
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1234567890"
                      />
                    </div>
                  ) : user.phone ? (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <span className="text-foreground">{user.phone}</span>
                    </div>
                  ) : null}
                  {editing ? (
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="City, Country"
                      />
                    </div>
                  ) : user.location ? (
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <span className="text-foreground">{user.location}</span>
                    </div>
                  ) : null}
                </div>
                <div className="space-y-4">
                  {editing ? (
                    <>
                      <div>
                        <Label htmlFor="jobTitle">Job Title</Label>
                        <Input
                          id="jobTitle"
                          value={formData.jobTitle}
                          onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                          placeholder="e.g., Project Manager"
                        />
                      </div>
                      <div>
                        <Label htmlFor="department">Department</Label>
                        <Input
                          id="department"
                          value={formData.department}
                          onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          placeholder="e.g., Operations"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {user.jobTitle && (
                        <div className="flex items-center space-x-3">
                          <Briefcase className="w-5 h-5 text-muted-foreground" />
                          <span className="text-foreground">{user.jobTitle}</span>
                        </div>
                      )}
                      {user.department && (
                        <div className="flex items-center space-x-3">
                          <Building className="w-5 h-5 text-muted-foreground" />
                          <span className="text-foreground">{user.department}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Social Links */}
              {(user.linkedInUrl || user.twitterUrl || editing) && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Social Links</h3>
                  <div className="flex items-center space-x-4">
                    {editing ? (
                      <>
                        <div className="flex-1">
                          <Label htmlFor="linkedInUrl">LinkedIn</Label>
                          <Input
                            id="linkedInUrl"
                            value={formData.linkedInUrl}
                            onChange={(e) => setFormData({ ...formData, linkedInUrl: e.target.value })}
                            placeholder="https://linkedin.com/in/username"
                            type="url"
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="twitterUrl">Twitter</Label>
                          <Input
                            id="twitterUrl"
                            value={formData.twitterUrl}
                            onChange={(e) => setFormData({ ...formData, twitterUrl: e.target.value })}
                            placeholder="https://twitter.com/username"
                            type="url"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        {user.linkedInUrl && (
                          <a
                            href={user.linkedInUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                          >
                            <Linkedin className="w-5 h-5" />
                            <span>LinkedIn</span>
                          </a>
                        )}
                        {user.twitterUrl && (
                          <a
                            href={user.twitterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-2 text-blue-400 hover:text-blue-500"
                          >
                            <Twitter className="w-5 h-5" />
                            <span>Twitter</span>
                          </a>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Skills */}
              {(skillsArray.length > 0 || editing) && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Skills</h3>
                  {editing ? (
                    <div>
                      <Label htmlFor="skills">Skills (comma-separated)</Label>
                      <Input
                        id="skills"
                        value={formData.skills}
                        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                        placeholder="Project Management, Data Analysis, Communication"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {skillsArray.map((skill: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-sm">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <TeamChat orgId={orgId} />
    </div>
  )
}

