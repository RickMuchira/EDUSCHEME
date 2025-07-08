'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  BookOpen, 
  Plus, 
  Search, 
  Calendar,
  GraduationCap,
  Eye,
  Edit,
  Trash2,
  Palette,
  Clock,
  Users,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { termApi, subjectApi } from '@/lib/api'

interface Term {
  id: number
  name: string
  code: string
  start_date: string
  end_date: string
  form_grade_id: number
  form_grade: {
    id: number
    name: string
    code: string
    school_level: {
      id: number
      name: string
    }
  }
  is_active: boolean
}

interface Subject {
  id: number
  name: string
  code: string
  description: string
  color: string
  icon: string
  animation_type: string
  display_order: number
  term_id: number
  term: Term
  is_active: boolean
  created_at: string
}

const SubjectsPage = () => {
  const [terms, setTerms] = useState<Term[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedTermId, setSelectedTermId] = useState<number | null>(null)
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchTerms()
    fetchSubjects()
  }, [])

  useEffect(() => {
    filterSubjects()
  }, [subjects, selectedTermId, searchTerm])

  const fetchTerms = async () => {
    try {
      const response = await termApi.getAll()
      setTerms(response.data || [])
    } catch (error) {
      console.error('Error fetching terms:', error)
    }
  }

  const fetchSubjects = async () => {
    try {
      const response = await subjectApi.getAll()
      setSubjects(response.data || [])
    } catch (error) {
      console.error('Error fetching subjects:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterSubjects = () => {
    let filtered = subjects

    // Filter by selected term
    if (selectedTermId) {
      filtered = filtered.filter(subject => subject.term_id === selectedTermId)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(subject => 
        subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredSubjects(filtered)
  }

  const handleDeleteSubject = async (id: number) => {
    if (confirm('Are you sure you want to delete this subject?')) {
      try {
        await subjectApi.delete(id)
        fetchSubjects()
      } catch (error) {
        console.error('Error deleting subject:', error)
      }
    }
  }

  const getSelectedTerm = () => {
    return terms.find(term => term.id === selectedTermId)
  }

  const SubjectCard = ({ subject }: { subject: Subject }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 border-l-4" 
          style={{ borderLeftColor: subject.color }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold transition-all duration-300 group-hover:scale-110"
                 style={{ backgroundColor: subject.color }}>
              {subject.code.slice(0, 2)}
            </div>
            <div>
              <CardTitle className="text-lg">{subject.name}</CardTitle>
              <CardDescription className="text-sm">
                Code: {subject.code}
              </CardDescription>
            </div>
          </div>
          <Badge variant={subject.is_active ? "default" : "secondary"}>
            {subject.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-gray-600 line-clamp-2">
            {subject.description || 'No description available'}
          </p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{subject.term?.name}</span>
            </div>
            <div className="flex items-center space-x-1">
              <GraduationCap className="w-4 h-4" />
              <span>{subject.term?.form_grade?.name}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Palette className="w-4 h-4" />
              <span className="capitalize">{subject.animation_type}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex space-x-2">
              <Link href={`/admin/subjects/${subject.id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
              </Link>
              <Link href={`/admin/subjects/${subject.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </Link>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => handleDeleteSubject(subject.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const selectedTerm = getSelectedTerm()

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subjects</h1>
          <p className="text-gray-600">Create and manage subjects for specific terms</p>
        </div>
        <Link href="/admin/subjects/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Subject
          </Button>
        </Link>
      </div>

      {/* Term Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Select Term</span>
          </CardTitle>
          <CardDescription>
            Choose a term to view and manage its subjects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={selectedTermId?.toString() || ''} onValueChange={(value) => setSelectedTermId(value ? parseInt(value) : null)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a term..." />
              </SelectTrigger>
              <SelectContent>
                {terms.map((term) => (
                  <SelectItem key={term.id} value={term.id.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{term.name} ({term.code})</span>
                      <span className="text-sm text-gray-500">
                        {term.form_grade?.name} - {term.form_grade?.school_level?.name}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedTerm && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900">{selectedTerm.name}</h3>
                <p className="text-sm text-blue-700">
                  {selectedTerm.form_grade?.name} - {selectedTerm.form_grade?.school_level?.name}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {filteredSubjects.length} subjects in this term
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      {selectedTermId && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search subjects in this term..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Link href={`/admin/subjects/new?term_id=${selectedTermId}`}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subject to {selectedTerm?.name}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {!selectedTermId ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Term First</h3>
              <p className="text-gray-600 mb-4">
                Choose a term from the dropdown above to view and manage its subjects
              </p>
            </div>
          </CardContent>
        </Card>
      ) : filteredSubjects.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Subjects Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? `No subjects match "${searchTerm}" in ${selectedTerm?.name}`
                  : `${selectedTerm?.name} doesn't have any subjects yet`
                }
              </p>
              <Link href={`/admin/subjects/new?term_id=${selectedTermId}`}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Subject
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Term Context Header */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Showing {filteredSubjects.length} subjects for <strong>{selectedTerm?.name}</strong> 
              ({selectedTerm?.form_grade?.name} - {selectedTerm?.form_grade?.school_level?.name})
            </AlertDescription>
          </Alert>

          {/* Subjects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubjects.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} />
            ))}
          </div>

          {/* Term Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{filteredSubjects.length}</div>
                  <div className="text-sm text-gray-600">Total Subjects</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {filteredSubjects.filter(s => s.is_active).length}
                  </div>
                  <div className="text-sm text-gray-600">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {filteredSubjects.filter(s => !s.is_active).length}
                  </div>
                  <div className="text-sm text-gray-600">Inactive</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {new Set(filteredSubjects.map(s => s.color)).size}
                  </div>
                  <div className="text-sm text-gray-600">Unique Colors</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default SubjectsPage