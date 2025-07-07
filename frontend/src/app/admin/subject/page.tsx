'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Grid, List, Download, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SubjectCard } from '@/components/admin/subject-card'
import { SubjectForm } from '@/components/admin/subject-form'
import { subjectApi, termApi } from '@/lib/api'
import { toast } from 'sonner'
import { debounce } from '@/lib/utils'

interface Subject {
  id: number
  name: string
  description?: string
  color: string
  icon: string
  animation_type: string
  display_order: number
  term_id: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Term {
  id: number
  name: string
  code: string
  form_grade_id: number
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTerm, setSelectedTerm] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchSubjects = async (termId?: string, search?: string) => {
    try {
      setLoading(true)
      const params: any = {}
      
      if (termId && termId !== 'all') {
        params.term_id = parseInt(termId)
      }
      
      if (search) {
        params.search = search
      }

      const response = await subjectApi.getAll(params)
      if (response.success) {
        setSubjects(response.data || [])
      } else {
        toast.error("Failed to fetch subjects")
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error)
      toast.error("Failed to connect to server")
    } finally {
      setLoading(false)
    }
  }

  const fetchTerms = async () => {
    try {
      const response = await termApi.getAll()
      if (response.success) {
        setTerms(response.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch terms:', error)
    }
  }

  // Debounced search
  const debouncedSearch = debounce((query: string) => {
    fetchSubjects(selectedTerm, query)
  }, 300)

  useEffect(() => {
    fetchTerms()
    fetchSubjects()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery)
    } else {
      fetchSubjects(selectedTerm)
    }
  }, [searchQuery, selectedTerm])

  const handleCreateSubject = async (data: any) => {
    try {
      setIsSubmitting(true)
      const response = await subjectApi.create(data)
      
      if (response.success) {
        toast.success("Subject created successfully")
        setShowCreateDialog(false)
        fetchSubjects(selectedTerm, searchQuery)
      } else {
        toast.error(response.message || "Failed to create subject")
      }
    } catch (error) {
      console.error('Failed to create subject:', error)
      toast.error("Failed to create subject")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubject = async (data: any) => {
    if (!editingSubject) return

    try {
      setIsSubmitting(true)
      const response = await subjectApi.update(editingSubject.id, data)
      
      if (response.success) {
        toast.success("Subject updated successfully")
        setShowEditDialog(false)
        setEditingSubject(null)
        fetchSubjects(selectedTerm, searchQuery)
      } else {
        toast.error(response.message || "Failed to update subject")
      }
    } catch (error) {
      console.error('Failed to update subject:', error)
      toast.error("Failed to update subject")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSubject = async (id: number) => {
    try {
      const response = await subjectApi.delete(id)
      
      if (response.success) {
        toast.success("Subject deleted successfully")
        fetchSubjects(selectedTerm, searchQuery)
      } else {
        toast.error(response.message || "Failed to delete subject")
      }
    } catch (error) {
      console.error('Failed to delete subject:', error)
      toast.error("Failed to delete subject")
    }
  }

  const handleDuplicateSubject = (subject: Subject) => {
    setEditingSubject({
      ...subject,
      id: 0,
      name: `${subject.name} (Copy)`,
    })
    setShowCreateDialog(true)
  }

  const filteredSubjects = subjects.filter(subject => {
    const matchesSearch = !searchQuery || 
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesTerm = selectedTerm === 'all' || subject.term_id.toString() === selectedTerm
    
    return matchesSearch && matchesTerm
  })

  const activeSubjects = filteredSubjects.filter(s => s.is_active)
  const inactiveSubjects = filteredSubjects.filter(s => !s.is_active)

  if (loading && subjects.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-gray-500">Loading subjects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Subjects
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your curriculum subjects with colors, icons, and animations
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Subject
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Subjects</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{subjects.length}</p>
              </div>
              <Badge variant="secondary">{subjects.length}</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-green-600">{activeSubjects.length}</p>
              </div>
              <Badge className="bg-green-100 text-green-700">{activeSubjects.length}</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive</p>
                <p className="text-2xl font-bold text-red-600">{inactiveSubjects.length}</p>
              </div>
              <Badge variant="destructive">{inactiveSubjects.length}</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Terms</p>
                <p className="text-2xl font-bold text-blue-600">{terms.length}</p>
              </div>
              <Badge variant="outline">{terms.length}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search subjects by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by term" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                {terms.map((term) => (
                  <SelectItem key={term.id} value={term.id.toString()}>
                    {term.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {filteredSubjects.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No subjects found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {searchQuery || selectedTerm !== 'all'
                  ? 'Try adjusting your search criteria or filters.'
                  : 'Get started by creating your first subject.'}
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Subject
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All ({filteredSubjects.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeSubjects.length})</TabsTrigger>
            <TabsTrigger value="inactive">Inactive ({inactiveSubjects.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
            }>
              {filteredSubjects.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  onEdit={(subject) => {
                    setEditingSubject(subject)
                    setShowEditDialog(true)
                  }}
                  onDelete={handleDeleteSubject}
                  onDuplicate={handleDuplicateSubject}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active">
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
            }>
              {activeSubjects.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  onEdit={(subject) => {
                    setEditingSubject(subject)
                    setShowEditDialog(true)
                  }}
                  onDelete={handleDeleteSubject}
                  onDuplicate={handleDuplicateSubject}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="inactive">
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
              : 'space-y-4'
            }>
              {inactiveSubjects.map((subject) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  onEdit={(subject) => {
                    setEditingSubject(subject)
                    setShowEditDialog(true)
                  }}
                  onDelete={handleDeleteSubject}
                  onDuplicate={handleDuplicateSubject}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Create Subject Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Subject</DialogTitle>
            <DialogDescription>
              Add a new subject with custom colors, icons, and animations.
            </DialogDescription>
          </DialogHeader>
          <SubjectForm
            initialData={editingSubject || undefined}
            termId={selectedTerm !== 'all' ? parseInt(selectedTerm) : undefined}
            onSubmit={handleCreateSubject}
            onCancel={() => {
              setShowCreateDialog(false)
              setEditingSubject(null)
            }}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Subject Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>
              Update the subject details and customization.
            </DialogDescription>
          </DialogHeader>
          {editingSubject && (
            <SubjectForm
              initialData={editingSubject}
              onSubmit={handleEditSubject}
              onCancel={() => {
                setShowEditDialog(false)
                setEditingSubject(null)
              }}
              isLoading={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}