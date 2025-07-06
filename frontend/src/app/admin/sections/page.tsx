'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Search, RefreshCw, Eye, Filter, School, GraduationCap } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { sectionApi, type Section, type SchoolLevel } from '@/lib/api'
import { DeleteDialog } from '@/components/ui/delete-dialog'

export default function SectionsPage() {
  const router = useRouter()
  const [sections, setSections] = useState<Section[]>([])
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredSections, setFilteredSections] = useState<Section[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [schoolLevelFilter, setSchoolLevelFilter] = useState<number | null>(null)
  const [currentSchoolLevel, setCurrentSchoolLevel] = useState<SchoolLevel | null>(null)
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<Section | null>(null)

  // Load sections and school levels
  const loadData = async () => {
    try {
      setLoading(true)
      
      // Get school level ID from URL params
      const urlParams = new URLSearchParams(window.location.search)
      const schoolLevelId = urlParams.get('school_level_id')
      
      // Load school levels for filtering
      const schoolLevelsResponse = await fetch('http://localhost:8000/api/v1/admin/school-levels/?include_inactive=true')
      if (schoolLevelsResponse.ok) {
        const schoolLevelsData = await schoolLevelsResponse.json()
        setSchoolLevels(schoolLevelsData.data || [])
        
        // Set current school level if specified
        if (schoolLevelId) {
          const schoolLevel = schoolLevelsData.data?.find((sl: SchoolLevel) => sl.id === parseInt(schoolLevelId))
          setCurrentSchoolLevel(schoolLevel || null)
          setSchoolLevelFilter(parseInt(schoolLevelId))
        }
      }
      
      // Load sections
      const response = await sectionApi.getAll(schoolLevelId ? parseInt(schoolLevelId) : undefined, true)
      
      if (response.success && response.data) {
        setSections(response.data)
        console.log('Loaded sections:', response.data)
      } else {
        throw new Error(response.message || 'Failed to load sections')
      }
    } catch (error: any) {
      console.error('Failed to load data:', error)
      toast.error(error.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Apply filters (search + status + school level)
  useEffect(() => {
    let filtered = sections

    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(section => section.is_active)
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(section => !section.is_active)
    }

    // Apply school level filter
    if (schoolLevelFilter) {
      filtered = filtered.filter(section => section.school_level_id === schoolLevelFilter)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(section =>
        section.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (section.description && section.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    setFilteredSections(filtered)
  }, [searchQuery, sections, statusFilter, schoolLevelFilter])

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  // Auto-refresh when returning from create page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  // Handle delete
  const handleDelete = async (id: number, name: string) => {
    const section = sections.find(s => s.id === id)
    if (section) {
      setItemToDelete(section)
      setDeleteDialogOpen(true)
    }
  }

  // Handle delete confirmation
  const handleDeleteConfirm = async (hardDelete: boolean) => {
    if (!itemToDelete) return

    try {
      setDeleteLoading(true)
      const response = await sectionApi.delete(itemToDelete.id, hardDelete)
      
      if (response.success) {
        toast.success(`Section ${hardDelete ? 'permanently deleted' : 'deleted'} successfully`)
        loadData() // Reload the list
        setDeleteDialogOpen(false)
        setItemToDelete(null)
      } else {
        throw new Error(response.message || 'Failed to delete section')
      }
    } catch (error: any) {
      console.error('Failed to delete section:', error)
      toast.error(error.message || 'Failed to delete section')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Handle view/edit
  const handleEdit = (id: number) => {
    router.push(`/admin/sections/${id}/edit`)
  }

  const handleView = (id: number) => {
    router.push(`/admin/sections/${id}`)
  }

  const handleManageGrades = (id: number) => {
    router.push(`/admin/forms-grades/?section_id=${id}`)
  }

  // Calculate stats
  const activeCount = sections.filter(s => s.is_active).length
  const inactiveCount = sections.filter(s => !s.is_active).length

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            {currentSchoolLevel && (
              <Link href="/admin/school-levels">
                <Button variant="outline" size="sm">
                  <School className="h-4 w-4 mr-2" />
                  {currentSchoolLevel.name}
                </Button>
              </Link>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {currentSchoolLevel ? `${currentSchoolLevel.name} Sections` : 'All Sections'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {currentSchoolLevel 
              ? `Manage sections within ${currentSchoolLevel.name}`
              : 'Manage sections within school levels (Lower Primary, Upper Primary, etc.)'
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href={currentSchoolLevel ? `/admin/sections/new?school_level_id=${currentSchoolLevel.id}` : "/admin/sections/new"}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Section
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
                  placeholder="Search sections by name, code, or description..."
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
                  <Label className="text-sm font-medium">Filters:</Label>
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

              {/* School Level Filter */}
              <div className="flex items-center space-x-2">
                <Label className="text-sm font-medium">School Level:</Label>
                <select
                  value={schoolLevelFilter || ''}
                  onChange={(e) => setSchoolLevelFilter(e.target.value ? Number(e.target.value) : null)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="">All School Levels</option>
                  {schoolLevels.map(level => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Total: {sections.length}</span>
                <span>•</span>
                <span className="text-green-600">Active: {activeCount}</span>
                <span>•</span>
                <span className="text-gray-500">Inactive: {inactiveCount}</span>
                {filteredSections.length !== sections.length && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600">Showing: {filteredSections.length}</span>
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
                <p className="text-gray-500">Loading sections...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : filteredSections.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              {searchQuery || statusFilter !== 'all' || schoolLevelFilter ? (
                <div>
                  <p className="text-gray-500 mb-4">
                    No sections found matching your filters
                  </p>
                  <div className="space-x-2">
                    <Button variant="outline" onClick={() => setSearchQuery('')}>
                      Clear Search
                    </Button>
                    <Button variant="outline" onClick={() => setStatusFilter('all')}>
                      Show All
                    </Button>
                    <Button variant="outline" onClick={() => setSchoolLevelFilter(null)}>
                      All School Levels
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 mb-4">
                    No sections found. Create your first section to get started.
                  </p>
                  <Link href="/admin/sections/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Section
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSections.map((section) => (
            <Card 
              key={section.id} 
              className={`hover:shadow-lg transition-all duration-200 border-l-4 ${
                section.is_active 
                  ? 'border-l-blue-500' 
                  : 'border-l-gray-400 opacity-75'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-lg font-semibold ${
                    !section.is_active ? 'text-gray-600' : ''
                  }`}>
                    {section.name}
                  </CardTitle>
                  <Badge variant={section.is_active ? 'default' : 'secondary'}>
                    {section.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <CardDescription className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">ID: {section.id}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Description */}
                  {section.description && (
                    <div className="text-sm text-gray-600">
                      {section.description}
                    </div>
                  )}
                  
                  {/* School Level */}
                  <div className="flex items-center space-x-2 text-sm">
                    <School className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">School Level:</span>
                    <span className="font-medium">
                      {section.school_level?.name || `ID: ${section.school_level_id}`}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Display Order:</span>
                      <div className="font-medium">{section.display_order}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">School Level ID:</span>
                      <div className="font-medium">{section.school_level_id}</div>
                    </div>
                  </div>
                  
                  {/* Timestamps */}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="grid grid-cols-1 gap-1 text-xs text-gray-500">
                      <div>Created: {new Date(section.created_at).toLocaleDateString()}</div>
                      <div>Updated: {new Date(section.updated_at).toLocaleDateString()}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <Button variant="outline" size="sm" onClick={() => handleManageGrades(section.id)}>
                      <GraduationCap className="h-4 w-4 mr-1" />
                      Manage Grades
                    </Button>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(section.id)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(section.id, section.name)}
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
      {!loading && filteredSections.length > 0 && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600 dark:text-gray-400 gap-4">
              <div className="flex items-center space-x-4">
                <span>
                  Showing {filteredSections.length} of {sections.length} sections
                </span>
                {(searchQuery || statusFilter !== 'all' || schoolLevelFilter) && (
                  <Badge variant="outline">
                    {searchQuery && `Search: "${searchQuery}"`}
                    {searchQuery && (statusFilter !== 'all' || schoolLevelFilter) && ' • '}
                    {statusFilter !== 'all' && `Status: ${statusFilter}`}
                    {statusFilter !== 'all' && schoolLevelFilter && ' • '}
                    {schoolLevelFilter && `School Level: ${schoolLevels.find(l => l.id === schoolLevelFilter)?.name || schoolLevelFilter}`}
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
          title="Delete Section"
          itemName={itemToDelete.name}
          itemType="section"
          isActive={itemToDelete.is_active}
          onConfirm={handleDeleteConfirm}
          loading={deleteLoading}
          showSoftDeleteOption={true}
        />
      )}
    </div>
  )
} 