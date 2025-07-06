// File: frontend/src/app/admin/school-levels/page.tsx
// Enhanced version with filter controls for active/inactive

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Search, RefreshCw, Eye, Filter } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { schoolLevelApi, type SchoolLevel } from '@/lib/api'
import { DeleteDialog } from '@/components/ui/delete-dialog'

export default function SchoolLevelsPage() {
  const router = useRouter()
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredLevels, setFilteredLevels] = useState<SchoolLevel[]>([])
  const [showInactive, setShowInactive] = useState(true) // Default to showing both
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<SchoolLevel | null>(null)

  // Load school levels
  const loadSchoolLevels = async () => {
    try {
      setLoading(true)
      // Always fetch all records (including inactive) from the API
      const response = await schoolLevelApi.getAll(true) // true = include inactive
      
      if (response.success && response.data) {
        setSchoolLevels(response.data)
        console.log('Loaded school levels:', response.data) // Debug log
      } else {
        throw new Error(response.message || 'Failed to load school levels')
      }
    } catch (error: any) {
      console.error('Failed to load school levels:', error)
      toast.error(error.message || 'Failed to load school levels')
    } finally {
      setLoading(false)
    }
  }

  // Apply filters (search + status)
  useEffect(() => {
    let filtered = schoolLevels

    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(level => level.is_active)
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(level => !level.is_active)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(level =>
        level.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        level.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredLevels(filtered)
  }, [searchQuery, schoolLevels, statusFilter])

  // Load data on component mount
  useEffect(() => {
    loadSchoolLevels()
  }, [])

  // Auto-refresh when returning from create page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadSchoolLevels()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Handle delete
  const handleDelete = async (id: number, name: string) => {
    const level = schoolLevels.find(l => l.id === id)
    if (level) {
      setItemToDelete(level)
      setDeleteDialogOpen(true)
    }
  }

  // Handle delete confirmation
  const handleDeleteConfirm = async (hardDelete: boolean) => {
    if (!itemToDelete) return

    try {
      setDeleteLoading(true)
      const response = await schoolLevelApi.delete(itemToDelete.id, hardDelete)
      
      if (response.success) {
        toast.success(`School level ${hardDelete ? 'permanently deleted' : 'deleted'} successfully`)
        loadSchoolLevels() // Reload the list
        setDeleteDialogOpen(false)
        setItemToDelete(null)
      } else {
        throw new Error(response.message || 'Failed to delete school level')
      }
    } catch (error: any) {
      console.error('Failed to delete school level:', error)
      toast.error(error.message || 'Failed to delete school level')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Handle view/edit
  const handleEdit = (id: number) => {
    router.push(`/admin/school-levels/${id}/edit`)
  }

  const handleView = (id: number) => {
    router.push(`/admin/school-levels/${id}`)
  }

  // Calculate stats
  const activeCount = schoolLevels.filter(l => l.is_active).length
  const inactiveCount = schoolLevels.filter(l => !l.is_active).length

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            School Levels
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage school levels (Primary, Secondary, High School, etc.)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadSchoolLevels} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/admin/school-levels/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add School Level
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search school levels by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 gap-4">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Label className="text-sm font-medium">Status Filter:</Label>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      statusFilter === 'all'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter('active')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      statusFilter === 'active'
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Active Only
                  </button>
                  <button
                    onClick={() => setStatusFilter('inactive')}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      statusFilter === 'inactive'
                        ? 'bg-gray-100 text-gray-700 border border-gray-200'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Inactive Only
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Total: {schoolLevels.length}</span>
                <span>•</span>
                <span className="text-green-600">Active: {activeCount}</span>
                <span>•</span>
                <span className="text-gray-500">Inactive: {inactiveCount}</span>
                {filteredLevels.length !== schoolLevels.length && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600">Showing: {filteredLevels.length}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Loading school levels...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : filteredLevels.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              {searchQuery || statusFilter !== 'all' ? (
                <div>
                  <p className="text-gray-500 mb-4">
                    No school levels found matching your filters
                  </p>
                  <div className="space-x-2">
                    <Button variant="outline" onClick={() => setSearchQuery('')}>
                      Clear Search
                    </Button>
                    <Button variant="outline" onClick={() => setStatusFilter('all')}>
                      Show All
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 mb-4">
                    No school levels found. Create your first school level to get started.
                  </p>
                  <Link href="/admin/school-levels/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add School Level
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredLevels.map((level) => (
            <Card 
              key={level.id} 
              className={`hover:shadow-lg transition-all duration-200 border-l-4 ${
                level.is_active 
                  ? 'border-l-blue-500' 
                  : 'border-l-gray-400 opacity-75'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-lg font-semibold ${
                    !level.is_active ? 'text-gray-600' : ''
                  }`}>
                    {level.name}
                  </CardTitle>
                  <Badge variant={level.is_active ? 'default' : 'secondary'}>
                    {level.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <CardDescription className="flex items-center justify-between">
                  <span>Code: <span className={`font-mono font-medium ${
                    level.is_active ? 'text-blue-600' : 'text-gray-500'
                  }`}>{level.code}</span></span>
                  <span className="text-xs text-gray-500">ID: {level.id}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Display Order:</span>
                      <div className="font-medium">{level.display_order}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">School ID:</span>
                      <div className="font-medium">{level.school_id}</div>
                    </div>
                  </div>
                  
                  {/* Timestamps */}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="grid grid-cols-1 gap-1 text-xs text-gray-500">
                      <div>Created: {new Date(level.created_at).toLocaleDateString()}</div>
                      <div>Updated: {new Date(level.updated_at).toLocaleDateString()}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <Button variant="outline" size="sm" onClick={() => handleView(level.id)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(level.id)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(level.id, level.name)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Footer */}
      {!loading && filteredLevels.length > 0 && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600 dark:text-gray-400 gap-4">
              <div className="flex items-center space-x-4">
                <span>
                  Showing {filteredLevels.length} of {schoolLevels.length} school levels
                </span>
                {(searchQuery || statusFilter !== 'all') && (
                  <Badge variant="outline">
                    {searchQuery && `Search: "${searchQuery}"`}
                    {searchQuery && statusFilter !== 'all' && ' • '}
                    {statusFilter !== 'all' && `Status: ${statusFilter}`}
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-green-600">
                  {activeCount} active
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-500">
                  {inactiveCount} inactive
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Dialog */}
      {itemToDelete && (
        <DeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="Delete School Level"
          itemName={itemToDelete.name}
          itemType="school level"
          isActive={itemToDelete.is_active}
          onConfirm={handleDeleteConfirm}
          loading={deleteLoading}
          showSoftDeleteOption={true}
        />
      )}
    </div>
  )
}