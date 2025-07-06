'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Search, RefreshCw, Eye, Filter, GraduationCap, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { formGradeApi, type FormGrade, type Section } from '@/lib/api'
import { DeleteDialog } from '@/components/ui/delete-dialog'

export default function FormsGradesPage() {
  const router = useRouter()
  const [formsGrades, setFormsGrades] = useState<FormGrade[]>([])
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredFormsGrades, setFilteredFormsGrades] = useState<FormGrade[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [schoolLevelFilter, setSchoolLevelFilter] = useState<number | null>(null)
  const [currentSchoolLevel, setCurrentSchoolLevel] = useState<SchoolLevel | null>(null)
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<FormGrade | null>(null)

  // Load forms/grades and school levels
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
      
      // Load forms/grades
      const includeInactive = statusFilter !== 'active'
      const response = await formGradeApi.getAll({ 
        school_level_id: schoolLevelId ? parseInt(schoolLevelId) : undefined,
        include_inactive: includeInactive
      })
      
      if (response.success && response.data) {
        setFormsGrades(response.data)
        console.log('Loaded forms/grades:', response.data)
      } else {
        throw new Error(response.message || 'Failed to load forms/grades')
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
    let filtered = formsGrades

    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(formGrade => formGrade.is_active)
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(formGrade => !formGrade.is_active)
    }

    // Apply school level filter
    if (schoolLevelFilter) {
      filtered = filtered.filter(formGrade => formGrade.school_level_id === schoolLevelFilter)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(formGrade =>
        formGrade.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        formGrade.code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredFormsGrades(filtered)
  }, [searchQuery, formsGrades, statusFilter, schoolLevelFilter])

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
    const formGrade = formsGrades.find(fg => fg.id === id)
    if (formGrade) {
      setItemToDelete(formGrade)
      setDeleteDialogOpen(true)
    }
  }

  // Handle delete confirmation
  const handleDeleteConfirm = async (hardDelete: boolean) => {
    if (!itemToDelete) return

    try {
      setDeleteLoading(true)
      const response = await formGradeApi.delete(itemToDelete.id, hardDelete)
      
      if (response.success) {
        toast.success(`Form/Grade ${hardDelete ? 'permanently deleted' : 'deleted'} successfully`)
        loadData() // Reload the list
        setDeleteDialogOpen(false)
        setItemToDelete(null)
      } else {
        throw new Error(response.message || 'Failed to delete form/grade')
      }
    } catch (error: any) {
      console.error('Failed to delete form/grade:', error)
      toast.error(error.message || 'Failed to delete form/grade')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Handle view/edit
  const handleEdit = (id: number) => {
    router.push(`/admin/forms-grades/${id}/edit`)
  }

  const handleView = (id: number) => {
    router.push(`/admin/forms-grades/${id}`)
  }

  // Calculate stats
  const activeCount = formsGrades.filter(fg => fg.is_active).length
  const inactiveCount = formsGrades.filter(fg => !fg.is_active).length

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            {currentSchoolLevel && (
              <Link href="/admin/school-levels">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {currentSchoolLevel.name}
                </Button>
              </Link>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {currentSchoolLevel ? `${currentSchoolLevel.name} ${currentSchoolLevel.grade_type === 'form' ? 'Forms' : 'Grades'}` : 'All Forms/Grades'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {currentSchoolLevel 
              ? `Manage ${currentSchoolLevel.grade_type === 'form' ? 'forms' : 'grades'} within ${currentSchoolLevel.name}`
              : 'Manage forms and grades within school levels'
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href={currentSchoolLevel ? `/admin/forms-grades/new?school_level_id=${currentSchoolLevel.id}` : "/admin/forms-grades/new"}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add {currentSchoolLevel?.grade_type === 'form' ? 'Form' : 'Grade'}
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
                  placeholder="Search grades by name or code..."
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
                  {schoolLevels.map(schoolLevel => (
                    <option key={schoolLevel.id} value={schoolLevel.id}>
                      {schoolLevel.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Total: {formsGrades.length}</span>
                <span>•</span>
                <span className="text-green-600">Active: {activeCount}</span>
                <span>•</span>
                <span className="text-gray-500">Inactive: {inactiveCount}</span>
                {filteredFormsGrades.length !== formsGrades.length && (
                  <>
                    <span>•</span>
                    <span className="text-blue-600">Showing: {filteredFormsGrades.length}</span>
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
                <p className="text-gray-500">Loading grades...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : filteredFormsGrades.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              {searchQuery || statusFilter !== 'all' || schoolLevelFilter ? (
                <div>
                  <p className="text-gray-500 mb-4">
                    No grades found matching your filters
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
                    No grades found. Create your first grade to get started.
                  </p>
                  <Link href={currentSection ? `/admin/forms-grades/new?section_id=${currentSection.id}` : "/admin/forms-grades/new"}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Grade
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredFormsGrades.map((formGrade) => (
            <Card 
              key={formGrade.id} 
              className={`hover:shadow-lg transition-all duration-200 border-l-4 ${
                formGrade.is_active 
                  ? 'border-l-blue-500' 
                  : 'border-l-gray-400 opacity-75'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className={`text-lg font-semibold ${
                    !formGrade.is_active ? 'text-gray-600' : ''
                  }`}>
                    {formGrade.name}
                  </CardTitle>
                  <Badge variant={formGrade.is_active ? 'default' : 'secondary'}>
                    {formGrade.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <CardDescription className="flex items-center justify-between">
                  <span>Code: <span className={`font-mono font-medium ${
                    formGrade.is_active ? 'text-blue-600' : 'text-gray-500'
                  }`}>{formGrade.code}</span></span>
                  <span className="text-xs text-gray-500">ID: {formGrade.id}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* School Level */}
                  <div className="flex items-center space-x-2 text-sm">
                    <GraduationCap className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-500">School Level:</span>
                    <span className="font-medium">
                      {formGrade.school_level?.name || `ID: ${formGrade.school_level_id}`}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Display Order:</span>
                      <div className="font-medium">{formGrade.display_order}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">School Level ID:</span>
                      <div className="font-medium">{formGrade.school_level_id}</div>
                    </div>
                  </div>
                  
                  {/* Timestamps */}
                  <div className="pt-2 border-t border-gray-100">
                    <div className="grid grid-cols-1 gap-1 text-xs text-gray-500">
                      <div>Created: {new Date(formGrade.created_at).toLocaleDateString()}</div>
                      <div>Updated: {new Date(formGrade.updated_at).toLocaleDateString()}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <Button variant="outline" size="sm" onClick={() => handleView(formGrade.id)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(formGrade.id)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(formGrade.id, formGrade.name)}
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
      {!loading && filteredFormsGrades.length > 0 && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600 dark:text-gray-400 gap-4">
              <div className="flex items-center space-x-4">
                <span>
                  Showing {filteredFormsGrades.length} of {formsGrades.length} grades
                </span>
                {(searchQuery || statusFilter !== 'all' || schoolLevelFilter) && (
                  <Badge variant="outline">
                    {searchQuery && `Search: "${searchQuery}"`}
                    {searchQuery && (statusFilter !== 'all' || schoolLevelFilter) && ' • '}
                    {statusFilter !== 'all' && `Status: ${statusFilter}`}
                    {statusFilter !== 'all' && schoolLevelFilter && ' • '}
                    {schoolLevelFilter && `School Level: ${schoolLevels.find(sl => sl.id === schoolLevelFilter)?.name || schoolLevelFilter}`}
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
          title="Delete Grade"
          itemName={itemToDelete.name}
          itemType="grade"
          isActive={itemToDelete.is_active}
          onConfirm={handleDeleteConfirm}
          loading={deleteLoading}
          showSoftDeleteOption={true}
        />
      )}
    </div>
  )
} 