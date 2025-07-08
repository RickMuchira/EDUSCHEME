'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  Edit, 
  Trash2, 
  BookOpen,
  ArrowLeft,
  Loader2,
  RefreshCw,
  AlertCircle,
  Calendar,
  GraduationCap,
  Target,
  Palette,
  Eye,
  EyeOff
} from 'lucide-react'
import Link from 'next/link'
import { subjectApi, termApi, type Subject, type Term } from '@/lib/api'
import { toast } from 'sonner'
import { safeRoutes, isValidId, toValidId } from '@/lib/safe-links'
import { EnhancedDeleteDialog } from '@/components/ui/enhanced-delete-dialog'

const SubjectsManagePage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const termIdParam = searchParams.get('term_id')
  
  // Validate term_id parameter
  const termId = toValidId(termIdParam)
  const isValidTermId = isValidId(termId)
  
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [availableTerms, setAvailableTerms] = useState<Term[]>([])
  const [currentTerm, setCurrentTerm] = useState<Term | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active')
  const [error, setError] = useState<string | null>(null)
  const [selectedTermId, setSelectedTermId] = useState<number | null>(termId)

  // Enhanced delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  console.log('Subjects page - URL validation:', {
    termIdParam,
    termId,
    isValidTermId,
    selectedTermId
  })

  // Load available terms for dropdown
  const loadAvailableTerms = async () => {
    try {
      const response = await termApi.getAll({ include_inactive: false })
      if (response.success && response.data) {
        setAvailableTerms(response.data)
        console.log('Loaded available terms:', response.data)
      }
    } catch (error: any) {
      console.error('Failed to load terms:', error)
    }
  }

  // Load subjects for selected term
  const loadSubjects = async (termIdToLoad?: number) => {
    const targetTermId = termIdToLoad || selectedTermId
    
    if (!targetTermId || !isValidId(targetTermId)) {
      setSubjects([])
      setCurrentTerm(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading subjects for term ID:', targetTermId)
      
      // Load term details and subjects in parallel
      const [termResponse, subjectsResponse] = await Promise.all([
        termApi.getById(targetTermId),
        subjectApi.getByTerm(targetTermId, true) // Include inactive subjects
      ])
      
      if (termResponse.success && termResponse.data) {
        setCurrentTerm(termResponse.data)
      }
      
      if (subjectsResponse.success && subjectsResponse.data) {
        setSubjects(subjectsResponse.data)
        console.log('Loaded subjects:', subjectsResponse.data)
      } else {
        throw new Error(subjectsResponse.message || 'Failed to load subjects')
      }
    } catch (error: any) {
      console.error('Error loading subjects:', error)
      setError(error.message || 'Failed to load subjects')
      toast.error('Failed to load subjects')
    } finally {
      setLoading(false)
    }
  }

  // Handle term selection from dropdown
  const handleTermSelect = (termIdString: string) => {
    const newTermId = parseInt(termIdString, 10)
    if (isValidId(newTermId)) {
      setSelectedTermId(newTermId)
      // Update URL to reflect selected term
      const newUrl = safeRoutes.subjectsForTerm(newTermId)
      router.push(newUrl)
    }
  }

  // Load data on component mount and when term changes
  useEffect(() => {
    loadAvailableTerms()
  }, [])

  useEffect(() => {
    if (selectedTermId) {
      loadSubjects(selectedTermId)
    } else {
      setLoading(false)
    }
  }, [selectedTermId])

  // Handle delete subject
  const handleDeleteSubject = async (permanent: boolean = false) => {
    if (!subjectToDelete) return

    try {
      setDeleteLoading(true)
      
      console.log(`${permanent ? 'Hard' : 'Soft'} deleting subject:`, subjectToDelete.id)
      
      const response = await subjectApi.delete(subjectToDelete.id, !permanent)
      
      if (response.success) {
        const deleteType = permanent ? 'permanently deleted' : 'deactivated'
        toast.success(`Subject "${subjectToDelete.name}" ${deleteType} successfully`)
        
        setDeleteDialogOpen(false)
        setSubjectToDelete(null)
        
        // Refresh the list
        loadSubjects()
      } else {
        throw new Error(response.message || `Failed to ${permanent ? 'delete' : 'deactivate'} subject`)
      }
    } catch (error: any) {
      console.error('Error deleting subject:', error)
      const action = permanent ? 'delete' : 'deactivate'
      toast.error(error.message || `Failed to ${action} subject`)
    } finally {
      setDeleteLoading(false)
    }
  }

  const openDeleteDialog = (subject: Subject) => {
    setSubjectToDelete(subject)
    setDeleteDialogOpen(true)
  }

  const closeDeleteDialog = () => {
    if (!deleteLoading) {
      setDeleteDialogOpen(false)
      setSubjectToDelete(null)
    }
  }

  // Handle subject status toggle
  const handleToggleSubjectStatus = async (id: number, currentStatus: boolean) => {
    if (!isValidId(id)) {
      toast.error('Invalid subject ID')
      return
    }
    
    try {
      const newStatus = !currentStatus
      const action = newStatus ? 'activate' : 'deactivate'
      
      const response = await subjectApi.update(id, { is_active: newStatus })
      
      if (response.success) {
        toast.success(`Subject ${action}d successfully`)
        loadSubjects()
      } else {
        throw new Error(response.message || `Failed to ${action} subject`)
      }
    } catch (error: any) {
      console.error('Error updating subject status:', error)
      const action = !currentStatus ? 'activate' : 'deactivate'
      toast.error(error.message || `Failed to ${action} subject`)
    }
  }

  // Filter subjects based on active tab
  const filteredSubjects = subjects.filter(subject => {
    if (activeTab === 'active') return subject.is_active
    if (activeTab === 'inactive') return !subject.is_active
    return true // 'all' tab
  })

  // Term selection UI
  const TermSelector = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="mr-2 h-5 w-5" />
          Select Term
        </CardTitle>
        <CardDescription>
          Choose a term to view and manage its subjects
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Select 
          value={selectedTermId?.toString() || ""} 
          onValueChange={handleTermSelect}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a term..." />
          </SelectTrigger>
          <SelectContent>
            {availableTerms.map((term) => (
              <SelectItem key={term.id} value={term.id.toString()}>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {term.code}
                  </Badge>
                  <span>{term.name}</span>
                  <span className="text-gray-500">
                    • {term.form_grade?.name}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )

  // Show term selector if no term selected
  if (!selectedTermId || !isValidTermId) {
    return (
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link href="/admin/terms">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Subjects
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Create and manage subjects for specific terms
              </p>
            </div>
          </div>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Subject
          </Button>
        </div>

        <TermSelector />

        {/* Empty state */}
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select a Term First
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Choose a term from the dropdown above to view and manage its subjects
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading subjects...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/admin/terms">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Subjects for {currentTerm?.name || `Term ${selectedTermId}`}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage subjects and their content
              {currentTerm?.form_grade && ` • ${currentTerm.form_grade.name}`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => loadSubjects()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Link href={safeRoutes.newSubjectForTerm(selectedTermId)}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Subject
            </Button>
          </Link>
        </div>
      </div>

      {/* Term Selector (when term is selected) */}
      <TermSelector />

      {/* Current Term Info */}
      {currentTerm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    {currentTerm.code}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold">{currentTerm.name}</h3>
                  {currentTerm.form_grade && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {currentTerm.form_grade.name} • Order: {currentTerm.display_order}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant={currentTerm.is_active ? "default" : "secondary"}>
                {currentTerm.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subjects List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              Subjects
            </span>
            <Badge variant="outline">
              {subjects.length} total
            </Badge>
          </CardTitle>
          <CardDescription>
            Manage subjects for this term
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="active">Active ({filteredSubjects.filter(s => s.is_active).length})</TabsTrigger>
              <TabsTrigger value="inactive">Inactive ({filteredSubjects.filter(s => !s.is_active).length})</TabsTrigger>
              <TabsTrigger value="all">All ({subjects.length})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredSubjects.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No {activeTab === 'all' ? '' : activeTab} subjects found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {activeTab === 'active' 
                      ? 'There are no active subjects for this term yet.'
                      : activeTab === 'inactive'
                      ? 'There are no inactive subjects for this term.'
                      : 'This term has no subjects yet.'}
                  </p>
                  <Link href={safeRoutes.newSubjectForTerm(selectedTermId)}>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Subject
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredSubjects
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((subject) => (
                    <Card key={subject.id} className="border hover:border-blue-200 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div 
                              className="p-3 rounded-lg"
                              style={{ 
                                backgroundColor: subject.color ? `${subject.color}20` : '#f3f4f6',
                                border: `2px solid ${subject.color || '#e5e7eb'}`
                              }}
                            >
                              <BookOpen 
                                className="h-6 w-6"
                                style={{ color: subject.color || '#6b7280' }}
                              />
                            </div>
                            
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {subject.name}
                                </h3>
                                <Badge variant="secondary" className="text-xs">
                                  {subject.code}
                                </Badge>
                                <Badge 
                                  variant={subject.is_active ? "default" : "secondary"}
                                  className={subject.is_active ? "bg-green-100 text-green-800" : ""}
                                >
                                  {subject.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center">
                                  <Target className="mr-1 h-4 w-4" />
                                  Order: {subject.display_order}
                                </span>
                                {subject.color && (
                                  <span className="flex items-center">
                                    <Palette className="mr-1 h-4 w-4" />
                                    Color: {subject.color}
                                  </span>
                                )}
                                {subject.topics_count !== undefined && (
                                  <span className="flex items-center">
                                    <BookOpen className="mr-1 h-4 w-4" />
                                    {subject.topics_count} topics
                                  </span>
                                )}
                              </div>
                              
                              {subject.description && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {subject.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {/* Navigate to topics */}}
                              disabled={!isValidId(subject.id)}
                            >
                              <BookOpen className="mr-2 h-4 w-4" />
                              Topics
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {/* Navigate to edit */}}
                              disabled={!isValidId(subject.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleSubjectStatus(subject.id, subject.is_active)}
                              disabled={!isValidId(subject.id)}
                              className={subject.is_active ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                            >
                              {subject.is_active ? (
                                <>
                                  <EyeOff className="mr-1 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Eye className="mr-1 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openDeleteDialog(subject)}
                              className="text-red-600 hover:text-red-700"
                              disabled={!isValidId(subject.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Enhanced Delete Dialog */}
      {subjectToDelete && (
        <EnhancedDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={closeDeleteDialog}
          onConfirm={handleDeleteSubject}
          loading={deleteLoading}
          title="Delete Subject"
          itemName={subjectToDelete.name}
          itemType="subject"
          isActive={subjectToDelete.is_active}
          showSoftDeleteOption={true}
          showHardDeleteOption={true}
        >
          <div className="space-y-2">
            <h5 className="font-medium text-gray-900">Subject Details:</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Code:</span>
                <span className="ml-2 font-mono">{subjectToDelete.code}</span>
              </div>
              <div>
                <span className="text-gray-600">Order:</span>
                <span className="ml-2">{subjectToDelete.display_order}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className={`ml-2 ${subjectToDelete.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                  {subjectToDelete.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Topics:</span>
                <span className="ml-2">{subjectToDelete.topics_count || 0}</span>
              </div>
            </div>
            
            {subjectToDelete.topics_count && subjectToDelete.topics_count > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mt-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-900">Contains Topics</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  This subject contains {subjectToDelete.topics_count} topic{subjectToDelete.topics_count !== 1 ? 's' : ''}. 
                  Deleting this subject may affect those topics.
                </p>
              </div>
            )}
          </div>
        </EnhancedDeleteDialog>
      )}
    </div>
  )
}

export default SubjectsManagePage