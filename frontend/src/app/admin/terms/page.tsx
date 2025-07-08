'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  GraduationCap,
  ArrowRight,
  BookOpen,
  Users,
  Clock,
  Target,
  ArrowLeft,
  Loader2,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react'
import Link from 'next/link'
import { termApi, formGradeApi, type Term, type FormGrade } from '@/lib/api'
import { toast } from 'sonner'
import { safeRoutes, isValidId } from '@/lib/safe-links'
import { EnhancedDeleteDialog } from '@/components/ui/enhanced-delete-dialog'

// Helper function to validate form grade ID
const validateFormGradeId = (param: string | null): { id: number | null; isValid: boolean; error?: string } => {
  if (!param) {
    return { id: null, isValid: false, error: 'No form/grade ID provided in URL' }
  }
  
  const parsed = parseInt(param, 10)
  
  if (isNaN(parsed)) {
    return { id: null, isValid: false, error: `Invalid form/grade ID format: "${param}". Must be a number.` }
  }
  
  if (parsed <= 0) {
    return { id: null, isValid: false, error: `Invalid form/grade ID: ${parsed}. Must be greater than 0.` }
  }
  
  return { id: parsed, isValid: true }
}

const TermsManagePage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const formGradeIdParam = searchParams.get('form_grade_id')
  
  // Validate form_grade_id parameter
  const validation = validateFormGradeId(formGradeIdParam)
  const formGradeId = validation.id
  const isValidFormGradeId = validation.isValid
  
  const [terms, setTerms] = useState<Term[]>([])
  const [formGrade, setFormGrade] = useState<FormGrade | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active')
  const [error, setError] = useState<string | null>(null)

  // Enhanced delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [termToDelete, setTermToDelete] = useState<Term | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Debug logging
  console.log('Terms page - URL params:', {
    formGradeIdParam,
    formGradeId,
    isValidFormGradeId,
    validationError: validation.error
  })

  useEffect(() => {
    if (isValidFormGradeId && formGradeId) {
      fetchTerms()
    } else {
      setLoading(false)
      setError(validation.error || 'Invalid form/grade ID')
    }
  }, [formGradeIdParam, isValidFormGradeId, formGradeId])

  const fetchTerms = async () => {
    if (!isValidFormGradeId || !formGradeId) {
      setError('Invalid form/grade ID')
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching terms for form/grade ID:', formGradeId)
      
      const response = await termApi.getByFormGrade(formGradeId, true) // Include inactive terms
      
      console.log('Terms API response:', response)
      
      if (response.success && response.data) {
        setTerms(response.data)
        
        // Set form grade info from the first term
        if (response.data.length > 0 && response.data[0].form_grade) {
          setFormGrade(response.data[0].form_grade)
        }
      } else {
        throw new Error(response.message || 'Failed to fetch terms')
      }
    } catch (error: any) {
      console.error('Error fetching terms:', error)
      setError(error.message || 'Failed to load terms')
      toast.error('Failed to load terms')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTerm = async (permanent: boolean = false) => {
    if (!termToDelete) return

    try {
      setDeleteLoading(true)
      
      console.log(`${permanent ? 'Hard' : 'Soft'} deleting term:`, termToDelete.id)
      
      const response = await termApi.delete(termToDelete.id, !permanent) // Note: API expects softDelete boolean
      
      if (response.success) {
        const deleteType = permanent ? 'permanently deleted' : 'deactivated'
        toast.success(`Term "${termToDelete.name}" ${deleteType} successfully`)
        
        // Close dialog and reset state
        setDeleteDialogOpen(false)
        setTermToDelete(null)
        
        // Refresh the list to show updated status
        fetchTerms()
      } else {
        throw new Error(response.message || `Failed to ${permanent ? 'delete' : 'deactivate'} term`)
      }
    } catch (error: any) {
      console.error('Error deleting term:', error)
      const action = permanent ? 'delete' : 'deactivate'
      toast.error(error.message || `Failed to ${action} term`)
    } finally {
      setDeleteLoading(false)
    }
  }

  const openDeleteDialog = (term: Term) => {
    setTermToDelete(term)
    setDeleteDialogOpen(true)
  }

  const closeDeleteDialog = () => {
    if (!deleteLoading) {
      setDeleteDialogOpen(false)
      setTermToDelete(null)
    }
  }

  // Safe navigation helpers
  const navigateToSubjects = (term: Term) => {
    if (!isValidId(term.id)) {
      console.error('Invalid term ID for subjects navigation:', term.id)
      toast.error('Invalid term ID')
      return
    }
    
    try {
      const url = safeRoutes.subjectsForTerm(term.id)
      console.log('Navigating to subjects with URL:', url)
      router.push(url)
    } catch (error: any) {
      console.error('Navigation error:', error)
      toast.error(error.message)
    }
  }

  const navigateToEditTerm = (term: Term) => {
    if (!isValidId(term.id)) {
      console.error('Invalid term ID for edit navigation:', term.id)
      toast.error('Invalid term ID')
      return
    }
    
    try {
      const url = safeRoutes.editTerm(term.id)
      router.push(url)
    } catch (error: any) {
      console.error('Navigation error:', error)
      toast.error(error.message)
    }
  }

  const handleToggleTermStatus = async (id: number, currentStatus: boolean) => {
    if (!isValidId(id)) {
      toast.error('Invalid term ID')
      return
    }
    
    try {
      const newStatus = !currentStatus
      const action = newStatus ? 'activate' : 'deactivate'
      
      console.log(`${action.charAt(0).toUpperCase() + action.slice(1)}ing term:`, id)
      
      const response = await termApi.update(id, { is_active: newStatus })
      
      if (response.success) {
        toast.success(`Term ${action}d successfully`)
        fetchTerms() // Refresh the list
      } else {
        throw new Error(response.message || `Failed to ${action} term`)
      }
    } catch (error: any) {
      console.error('Error updating term status:', error)
      const action = !currentStatus ? 'activate' : 'deactivate'
      toast.error(error.message || `Failed to ${action} term`)
    }
  }

  // Filter terms based on active tab
  const filteredTerms = terms.filter(term => {
    if (activeTab === 'active') return term.is_active
    if (activeTab === 'inactive') return !term.is_active
    return true // 'all' tab
  })

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading terms...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !isValidFormGradeId) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Alert className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || validation.error || 'Invalid form/grade ID provided.'}
          </AlertDescription>
        </Alert>
        <div className="text-center mt-6 space-x-4">
          <Link href="/admin/forms-grades">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Forms/Grades
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload Page
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/admin/forms-grades">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Terms for {formGrade?.name || `Form/Grade ${formGradeId}`}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage academic terms and their subjects
              {formGrade?.school_level && ` • ${formGrade.school_level.name}`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={fetchTerms}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          {/* Safe link generation for new term */}
          {formGradeId && isValidId(formGradeId) ? (
            <Link href={safeRoutes.newTermForFormGrade(formGradeId)}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Term
              </Button>
            </Link>
          ) : (
            <Button disabled>
              <Plus className="mr-2 h-4 w-4" />
              Add Term
            </Button>
          )}
        </div>
      </div>

      {/* Terms List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Academic Terms
            </span>
            <Badge variant="outline">
              {terms.length} total
            </Badge>
          </CardTitle>
          <CardDescription>
            View and manage terms for this form/grade
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="active">Active ({filteredTerms.filter(t => t.is_active).length})</TabsTrigger>
              <TabsTrigger value="inactive">Inactive ({filteredTerms.filter(t => !t.is_active).length})</TabsTrigger>
              <TabsTrigger value="all">All ({terms.length})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredTerms.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No {activeTab === 'all' ? '' : activeTab} terms found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {activeTab === 'active' 
                      ? 'There are no active terms for this form/grade yet.'
                      : activeTab === 'inactive'
                      ? 'There are no inactive terms for this form/grade.'
                      : 'This form/grade has no terms yet.'}
                  </p>
                  {formGradeId && isValidId(formGradeId) ? (
                    <Link href={safeRoutes.newTermForFormGrade(formGradeId)}>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Term
                      </Button>
                    </Link>
                  ) : (
                    <Button disabled>
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Term
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTerms
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((term) => (
                    <Card key={term.id} className="border hover:border-blue-200 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                              <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {term.name}
                                </h3>
                                <Badge variant="secondary" className="text-xs">
                                  {term.code}
                                </Badge>
                                <Badge 
                                  variant={term.is_active ? "default" : "secondary"}
                                  className={term.is_active ? "bg-green-100 text-green-800" : ""}
                                >
                                  {term.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center">
                                  <Target className="mr-1 h-4 w-4" />
                                  Order: {term.display_order}
                                </span>
                                {term.start_date && (
                                  <span className="flex items-center">
                                    <Clock className="mr-1 h-4 w-4" />
                                    {new Date(term.start_date).toLocaleDateString()}
                                  </span>
                                )}
                                {term.subjects_count !== undefined && (
                                  <span className="flex items-center">
                                    <BookOpen className="mr-1 h-4 w-4" />
                                    {term.subjects_count} subjects
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigateToSubjects(term)}
                              disabled={!isValidId(term.id)}
                            >
                              <BookOpen className="mr-2 h-4 w-4" />
                              Subjects
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigateToEditTerm(term)}
                              disabled={!isValidId(term.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleTermStatus(term.id, term.is_active)}
                              disabled={!isValidId(term.id)}
                              className={term.is_active ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                            >
                              {term.is_active ? (
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
                              onClick={() => openDeleteDialog(term)}
                              className="text-red-600 hover:text-red-700"
                              disabled={!isValidId(term.id)}
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
    </div>
  )
}

export default TermsManagePage