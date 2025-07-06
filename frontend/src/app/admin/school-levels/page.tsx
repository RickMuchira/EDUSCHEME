'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Search, RefreshCw, Eye } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { schoolLevelApi, type SchoolLevel } from '@/lib/api'

export default function SchoolLevelsPage() {
  const router = useRouter()
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredLevels, setFilteredLevels] = useState<SchoolLevel[]>([])

  // Load school levels
  const loadSchoolLevels = async () => {
    try {
      setLoading(true)
      const response = await schoolLevelApi.getAll()
      
      if (response.success && response.data) {
        setSchoolLevels(response.data)
        setFilteredLevels(response.data)
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

  // Filter school levels based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredLevels(schoolLevels)
    } else {
      const filtered = schoolLevels.filter(level =>
        level.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        level.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredLevels(filtered)
    }
  }, [searchQuery, schoolLevels])

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
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      const response = await schoolLevelApi.delete(id)
      
      if (response.success) {
        toast.success('School level deleted successfully')
        loadSchoolLevels() // Reload the list
      } else {
        throw new Error(response.message || 'Failed to delete school level')
      }
    } catch (error: any) {
      console.error('Failed to delete school level:', error)
      toast.error(error.message || 'Failed to delete school level')
    }
  }

  // Handle view/edit
  const handleEdit = (id: number) => {
    router.push(`/admin/school-levels/${id}/edit`)
  }

  const handleView = (id: number) => {
    router.push(`/admin/school-levels/${id}`)
  }

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
          <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search school levels by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Total: {schoolLevels.length}</span>
              <span>•</span>
              <span>Active: {schoolLevels.filter(l => l.is_active).length}</span>
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
              {searchQuery ? (
                <div>
                  <p className="text-gray-500 mb-4">
                    No school levels found matching "{searchQuery}"
                  </p>
                  <Button variant="outline" onClick={() => setSearchQuery('')}>
                    Clear Search
                  </Button>
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
            <Card key={level.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{level.name}</CardTitle>
                  <Badge variant={level.is_active ? 'default' : 'secondary'}>
                    {level.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <CardDescription className="flex items-center justify-between">
                  <span>Code: <span className="font-mono font-medium text-blue-600">{level.code}</span></span>
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
                {searchQuery && (
                  <Badge variant="outline">
                    Filtered by: "{searchQuery}"
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-green-600">
                  {schoolLevels.filter(l => l.is_active).length} active
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-500">
                  {schoolLevels.filter(l => !l.is_active).length} inactive
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}