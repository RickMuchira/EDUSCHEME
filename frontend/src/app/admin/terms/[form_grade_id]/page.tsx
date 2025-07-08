'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
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
  Target
} from 'lucide-react'
import Link from 'next/link'
import { termApi } from '@/lib/api'

interface FormGrade {
  id: number
  name: string
  code: string
  school_level: {
    id: number
    name: string
  }
}

interface Term {
  id: number
  name: string
  code: string
  start_date?: string
  end_date?: string
  display_order: number
  form_grade_id: number
  is_active: boolean
  created_at: string
  updated_at: string
  form_grade?: FormGrade
  subjects_count?: number // We'll add this from API if available
}

const TermsManagePage = () => {
  const params = useParams()
  const formGradeId = parseInt(params.form_grade_id as string)
  
  const [terms, setTerms] = useState<Term[]>([])
  const [formGrade, setFormGrade] = useState<FormGrade | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active')

  useEffect(() => {
    fetchTerms()
  }, [formGradeId])

  const fetchTerms = async () => {
    try {
      const response = await termApi.getByFormGrade(formGradeId)
      setTerms(response.data || [])
      
      // Set form grade info from the first term
      if (response.data && response.data.length > 0) {
        setFormGrade(response.data[0].form_grade)
      }
    } catch (error) {
      console.error('Error fetching terms:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTerm = async (id: number) => {
    if (confirm('Are you sure you want to delete this term?')) {
      try {
        await termApi.delete(id)
        fetchTerms()
      } catch (error) {
        console.error('Error deleting term:', error)
      }
    }
  }

  const getFilteredTerms = () => {
    if (activeTab === 'active') {
      return terms.filter(term => term.is_active)
    } else if (activeTab === 'inactive') {
      return terms.filter(term => !term.is_active)
    }
    return terms
  }

  const TermCard = ({ term }: { term: Term }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-blue-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
              {term.code}
            </div>
            <div>
              <CardTitle className="text-lg">{term.name}</CardTitle>
              <CardDescription className="text-sm">
                Code: {term.code}
              </CardDescription>
            </div>
          </div>
          <Badge variant={term.is_active ? "default" : "secondary"}>
            {term.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Term Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Start Date:</span>
              <div className="font-medium">
                {term.start_date ? new Date(term.start_date).toLocaleDateString() : 'Not set'}
              </div>
            </div>
            <div>
              <span className="text-gray-500">End Date:</span>
              <div className="font-medium">
                {term.end_date ? new Date(term.end_date).toLocaleDateString() : 'Not set'}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <BookOpen className="w-4 h-4" />
              <span>{term.subjects_count || 0} subjects</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>Order: {term.display_order}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex space-x-2">
              {/* Main CTA - Create Subjects */}
              <Link href={`/admin/subjects/new?term_id=${term.id}`}>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Subjects
                </Button>
              </Link>
              
              {/* View Subjects */}
              <Link href={`/admin/subjects?term_id=${term.id}`}>
                <Button variant="outline" size="sm">
                  <BookOpen className="w-4 h-4 mr-1" />
                  View Subjects
                </Button>
              </Link>
            </div>

            <div className="flex space-x-1">
              {/* Edit Term */}
              <Link href={`/admin/terms/${term.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </Link>
              
              {/* Delete Term */}
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => handleDeleteTerm(term.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Clickable Term Row (Alternative compact view)
  const TermRow = ({ term }: { term: Term }) => (
    <div className="group border rounded-lg p-4 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 cursor-pointer">
      <Link href={`/admin/subjects/new?term_id=${term.id}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
              {term.code}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">
                {term.name}
              </h3>
              <p className="text-sm text-gray-500">
                {term.start_date && term.end_date 
                  ? `${new Date(term.start_date).toLocaleDateString()} - ${new Date(term.end_date).toLocaleDateString()}`
                  : 'Dates not set'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500">
              {term.subjects_count || 0} subjects
            </div>
            <Badge variant={term.is_active ? "default" : "secondary"}>
              {term.is_active ? 'Active' : 'Inactive'}
            </Badge>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </div>
      </Link>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const filteredTerms = getFilteredTerms()

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Terms</h1>
          <div className="flex items-center space-x-2 text-gray-600">
            <span>for</span>
            <Badge variant="outline" className="text-sm">
              {formGrade?.name} - {formGrade?.school_level?.name}
            </Badge>
          </div>
        </div>
        <Link href={`/admin/terms/new?form_grade_id=${formGradeId}`}>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Terms
          </Button>
        </Link>
      </div>

      {/* Quick Info */}
      <Alert className="border-blue-200 bg-blue-50">
        <Target className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Next Step:</strong> Click on any term below to start adding subjects to it, or use the "Add Subjects" button.
        </AlertDescription>
      </Alert>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{terms.length}</div>
              <div className="text-sm text-gray-600">Total Terms</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {terms.filter(t => t.is_active).length}
              </div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {terms.filter(t => !t.is_active).length}
              </div>
              <div className="text-sm text-gray-600">Inactive</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {terms.reduce((sum, t) => sum + (t.subjects_count || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Total Subjects</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Terms ({terms.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({terms.filter(t => t.is_active).length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({terms.filter(t => !t.is_active).length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredTerms.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Terms Found</h3>
                  <p className="text-gray-600 mb-4">
                    Create your first term to start building the curriculum
                  </p>
                  <Link href={`/admin/terms/new?form_grade_id=${formGradeId}`}>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Term
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Compact clickable list - this matches your current design */}
              <div className="space-y-3">
                {filteredTerms.map((term) => (
                  <TermRow key={term.id} term={term} />
                ))}
              </div>

              {/* Alternative: Card view (uncomment if you prefer cards) */}
              {/* 
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTerms.map((term) => (
                  <TermCard key={term.id} term={term} />
                ))}
              </div>
              */}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Actions Footer */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href={`/admin/terms/new?form_grade_id=${formGradeId}`}>
              <Button variant="outline" className="w-full justify-start">
                <Plus className="w-4 h-4 mr-2" />
                Add New Term
              </Button>
            </Link>
            <Link href={`/admin/subjects?form_grade_id=${formGradeId}`}>
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="w-4 h-4 mr-2" />
                View All Subjects
              </Button>
            </Link>
            <Link href="/admin/forms-grades">
              <Button variant="outline" className="w-full justify-start">
                <GraduationCap className="w-4 h-4 mr-2" />
                Back to Forms/Grades
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default TermsManagePage 