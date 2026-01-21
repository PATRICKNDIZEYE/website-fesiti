'use client'
/* eslint-disable react-hooks/exhaustive-deps */

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Header } from '@/components/Header'
import { TeamChat } from '@/components/TeamChat'
import { Search, Edit2, Trash2, UserPlus, Loader2, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { orgApi } from '@/lib/api-helpers'
import { ConfirmationModal } from '@/components/ConfirmationModal'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatar?: string
  role: 'admin' | 'manager' | 'field_staff' | 'viewer'
  isActive: boolean
  createdAt: string
}

export default function UsersPage() {
  const router = useRouter()
  const params = useParams()
  const orgId = params.orgId as string
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'viewer' as User['role'],
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

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

    const userStr = localStorage.getItem('user')
    if (userStr) {
      setCurrentUser(JSON.parse(userStr))
    }

    fetchUsers()
  }, [router, orgId])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await orgApi.get(orgId, 'users')
      setUsers(response.data)
    } catch (error: any) {
      console.error('Failed to fetch users:', error)
      if (error.response?.status === 403) {
        alert('You do not have permission to view users')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    setError('')
    setSaving(true)

    try {
      if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
        setError('All fields are required')
        return
      }

      await orgApi.post(orgId, 'users', formData)
      await fetchUsers()
      setShowCreateDialog(false)
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'viewer',
      })
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to create user')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async () => {
    if (!editingUser) return

    setError('')
    setSaving(true)

    try {
      const updateData: any = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
      }

      // Only include password if it's provided
      if (formData.password) {
        updateData.password = formData.password
      }

      await orgApi.patch(orgId, `users/${editingUser.id}`, updateData)
      await fetchUsers()
      setShowEditDialog(false)
      setEditingUser(null)
      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'viewer',
      })
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)

  const handleDeleteClick = (userId: string) => {
    setUserToDelete(userId)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!userToDelete) return

    try {
      await orgApi.delete(orgId, `users/${userToDelete}`)
      setShowDeleteModal(false)
      setUserToDelete(null)
      await fetchUsers()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete user')
      setShowDeleteModal(false)
      setUserToDelete(null)
    }
  }

  const handleToggleActive = async (user: User) => {
    try {
      await orgApi.patch(orgId, `users/${user.id}`, {
        isActive: !user.isActive,
      })
      await fetchUsers()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update user')
    }
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    })
    setShowEditDialog(true)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/20 text-red-600 border-red-500/30'
      case 'manager':
        return 'bg-primary/10 text-primary border-primary/20'
      case 'field_staff':
        return 'bg-blue-500/20 text-blue-600 border-blue-500/30'
      default:
        return 'bg-gray-500/20 text-gray-600 border-gray-500/30'
    }
  }

  const getInitials = (user: User) => {
    return `${user.firstName[0]}${user.lastName[0]}`
  }

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      user.firstName.toLowerCase().includes(search) ||
      user.lastName.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <ConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleDelete}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone and all associated data will be permanently removed."
        type="delete"
        confirmText="Delete"
        cancelText="Cancel"
      />
      
      <Header
        title="User Management"
        subtitle="Access control, roles, and permission settings."
        actions={
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add User
          </Button>
        }
      />

      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-full border-border/70 bg-card"
          />
        </div>

        <div className="bg-card rounded-2xl border border-border/70 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border/70">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">User</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Email</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Role</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      {searchQuery ? 'No users found' : 'No users yet'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border/60 hover:bg-muted/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary/10 text-primary border border-primary/20">
                              {getInitials(user)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">
                              {user.firstName} {user.lastName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{user.email}</td>
                      <td className="p-4">
                        <Badge className={getRoleColor(user.role)}>
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge
                          variant={user.isActive ? 'default' : 'secondary'}
                          className="cursor-pointer"
                          onClick={() => handleToggleActive(user)}
                        >
                          {user.isActive ? (
                            <>
                              <Check className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            'Inactive'
                          )}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          {currentUser?.id !== user.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(user.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive/80"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <TeamChat orgId={orgId} />

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Minimum 6 characters"
              />
            </div>
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
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as User['role'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="field_staff">Field Staff</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create User'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-password">New Password (Optional)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Leave empty to keep current password"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-firstName">First Name</Label>
                <Input
                  id="edit-firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-lastName">Last Name</Label>
                <Input
                  id="edit-lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as User['role'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="field_staff">Field Staff</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
