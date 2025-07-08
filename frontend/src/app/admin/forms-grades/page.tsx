'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Edit, Trash2, Search, RefreshCw, Eye, Filter, GraduationCap, ArrowLeft, Calendar, BookOpen, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { formGradeApi, schoolLevelApi, type FormGrade, type SchoolLevel } from '@/lib/api'
import { DeleteDialog } from '@/components/ui/delete-dialog'
import { safeRoutes, isValidId } from '@/lib/safe-links'

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
      const schoolLevelIdParam = urlParams.get('school_level_id')
      const schoolLevelId = schoolLevelIdParam ? parseInt(schoolLevelIdParam, 10) : null
      
      console.log('Forms/Grades page - URL params:', { schoolLevelIdParam, schoolLevelId })
      
      // Load school levels for filtering
      const schoolLevelsResponse = await schoolLevelApi.getAll(true)
      if (schoolLevelsResponse.success && schoolLevelsResponse.data) {
        setSchoolLevels(schoolLevelsResponse.data)
        
        // Set current school level if specified and valid
        if (schoolLevelId && isValidId(schoolLevelId)) {
          const schoolLevel = schoolLevelsResponse.data.find((sl: SchoolLevel) => sl.id === schoolLevelId)
          if (schoolLevel) {
            setCurrentSchoolLevel(schoolLevel)
            setSchoolLevelFilter(schoolLevelId)
          } else {
            console.warn(`School level with ID ${schoolLevelId} not found`)
          }
        }
      }
      
      // Load forms/grades
      const includeInactive = statusFilter !== 'active'
      const options: any = { include_inactive: includeInactive }
      
      if (schoolLevelId && isValidId(schoolLevelId)) {
        options.school_level_id = schoolLevelId
      }
      
      console.log('Loading forms/grades with options:', options)
      
      const response = await formGradeApi.getAll(options)
      
      if (response.success && response.data) {
        setFormsGrades(response.data)
        console.log('Loaded forms/grades:', response.data)
      } else {
        throw new Error(response.message || 'Failed to load forms/grades')
      }
    } catch (error: any) {
      console.error('Failed to load forms/grades:', error)
      toast.error(error.message || 'Failed to load forms/grades')
    } finally {
      setLoading(false)
    }
  }

  // Apply filters (search + status + school level)
  useEffect(() => {
    let filtered = formsGrades

    // Apply status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter(fg => fg.is_active)
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(fg => !fg.is_active)
    }

    // Apply school level filter
    if (schoolLevelFilter) {
      filtered = filtered.filter(fg => fg.school_level_id === schoolLevelFilter)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(fg =>
        fg.name.toLowerCase().includes(query) ||
        fg.code.toLowerCase().includes(query) ||
        (fg.description && fg.description.toLowerCase().includes(query))
      )
    }

    setFilteredFormsGrades(filtered)
  }, [formsGrades, statusFilter, schoolLevelFilter, searchQuery])

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [statusFilter])

  // Handle delete
  const handleDelete = async (permanent: boolean = false) => {
    if (!itemToDelete) return

    try {
      setDeleteLoading(true)
      const response = await formGradeApi.delete(itemToDelete.id, !permanent)
      
      if (response.success) {
        toast.success(`Form/Grade ${permanent ? 'permanently deleted' : 'deleted'} successfully`)
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

  // Safe navigation helpers
  const navigateToTerms = (formGrade: FormGrade) => {
    if (!isValidId(formGrade.id)) {
      console.error('Invalid form/grade ID for terms navigation:', formGrade.id)
      toast.error('Invalid form/grade ID')
      return
    }
    
    try {
      const url = safeRoutes.termsForFormGrade(formGrade.id)
      router.push(url)
    } catch (error: any) {
      console.error('Navigation error:', error)
      toast.error(error.message)
    }
  }

  const navigateToEdit = (formGrade: FormGrade) => {
    if (!isValidId(formGrade.id)) {
      console.error('Invalid form/grade ID for edit navigation:', formGrade.id)
      toast.error('Invalid form/grade ID')
      return
    }
    
    try {
      const url = safeRoutes.editFormGrade(formGrade.id)
      router.push(url)
    } catch (error: any) {
      console.error('Navigation error:', error)
      toast.error(error.message)
    }
  }

  const navigateToView = (formGrade: FormGrade) => {
    if (!isValidId(formGrade.id)) {
      console.error('Invalid form/grade ID for view navigation:', formGrade.id)
      toast.error('Invalid form/grade ID')
      return
    }
    
    try {
      const url = safeRoutes.viewFormGrade(formGrade.id)
      router.push(url)
    } catch (error: any) {
      console.error('Navigation error:', error)
      toast.error(error.message)
    }
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
          {/* Safe link generation for new form/grade */}
          {currentSchoolLevel && isValidId(currentSchoolLevel.id) ? (
            <Link href={safeRoutes.newFormGradeForSchoolLevel(currentSchoolLevel.id)}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add {currentSchoolLevel.grade_type === 'form' ? 'Form' : 'Grade'}
              </Button>
            </Link>
          ) : (
            <Link href="/admin/forms-grades/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Form/Grade
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formsGrades.length}</div>
            <p className="text-xs text-muted-foreground">
              {currentSchoolLevel?.grade_type === 'form' ? 'forms' : 'grades'} in total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Eye className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <Filter className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{inactiveCount}</div>
            <p className="text-xs text-muted-foreground">
              Currently inactive
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex space-x-2">
                {(['all', 'active', 'inactive'] as const).map(status => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* School Level Filter */}
            {!currentSchoolLevel && (
              <div className="space-y-2">
                <Label>School Level</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={schoolLevelFilter === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSchoolLevelFilter(null)}
                  >
                    All
                  </Button>
                  {schoolLevels.slice(0, 3).map(level => (
                    <Button
                      key={level.id}
                      variant={schoolLevelFilter === level.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSchoolLevelFilter(level.id)}
                    >
                      {level.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Forms/Grades List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {currentSchoolLevel?.grade_type === 'form' ? 'Forms' : 'Grades'} List
            </span>
            <Badge variant="outline">
              {filteredFormsGrades.length} showing
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : filteredFormsGrades.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No {statusFilter === 'all' ? '' : statusFilter} {currentSchoolLevel?.grade_type === 'form' ? 'forms' : 'grades'} found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery 
                  ? `No results found for "${searchQuery}"`
                  : currentSchoolLevel
                  ? `This school level has no ${statusFilter === 'all' ? '' : statusFilter} ${currentSchoolLevel.grade_type === 'form' ? 'forms' : 'grades'} yet.`
                  : `No ${statusFilter === 'all' ? '' : statusFilter} forms/grades found.`
                }
              </p>
              {currentSchoolLevel && isValidId(currentSchoolLevel.id) ? (
                <Link href={safeRoutes.newFormGradeForSchoolLevel(currentSchoolLevel.id)}>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First {currentSchoolLevel.grade_type === 'form' ? 'Form' : 'Grade'}
                  </Button>
                </Link>
              ) : (
                <Link href="/admin/forms-grades/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Form/Grade
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFormsGrades
                .sort((a, b) => a.display_order - b.display_order)
                .map((formGrade) => {
                  // Validate form/grade ID before rendering
                  const hasValidId = isValidId(formGrade.id)
                  
                  if (!hasValidId) {
                    console.error('Invalid form/grade ID in list:', formGrade)
                  }
                  
                  return (
                    <Card key={formGrade.id || `invalid-${Math.random()}`} className="border hover:border-blue-200 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                              <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {formGrade.name}
                                </h3>
                                <Badge variant="secondary" className="text-xs">
                                  {formGrade.code}
                                </Badge>
                                <Badge 
                                  variant={formGrade.is_active ? "default" : "secondary"}
                                  className={formGrade.is_active ? "bg-green-100 text-green-800" : ""}
                                >
                                  {formGrade.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                                {!hasValidId && (
                                  <Badge variant="destructive" className="text-xs">
                                    Invalid ID
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                <span>Order: {formGrade.display_order}</span>
                                {formGrade.school_level && (
                                  <span>{formGrade.school_level.name}</span>
                                )}
                                <span>ID: {formGrade.id}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {hasValidId ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigateToTerms(formGrade)}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  Terms
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigateToView(formGrade)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigateToEdit(formGrade)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setItemToDelete(formGrade)
                                    setDeleteDialogOpen(true)
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Alert className="w-48">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                  Invalid ID - cannot navigate
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        loading={deleteLoading}
        title="Delete Form/Grade"
        description={`Are you sure you want to delete "${itemToDelete?.name}"? This action can be undone by reactivating it later.`}
        itemName={itemToDelete?.name || ''}
      />
    </div>
  )
}