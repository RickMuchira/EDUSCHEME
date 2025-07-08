'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar,
  GraduationCap,
  School,
  Palette,
  Sparkles,
  Clock,
  Plus,
  Eye,
  BookOpen
} from 'lucide-react'
import Link from 'next/link'
import { subjectApi } from '@/lib/api'

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
  term: {
    id: number
    name: string
    code: string
    start_date: string
    end_date: string
    form_grade: {
      id: number
      name: string
      code: string
      school_level: {
        id: number
        name: string
      }
    }
  }
  topics: Array<{
    id: number
    title: string
    description: string
    duration_weeks: number
    is_active: boolean
  }>
  is_active: boolean
  created_at: string
  updated_at: string
}

const SubjectDetailsPage = () => {
  const params = useParams()
  const router = useRouter()
  const subjectId = parseInt(params.id as string)
  
  const [subject, setSubject] = useState<Subject | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubject()
  }, [subjectId])

  const fetchSubject = async () => {
    try {
      const response = await subjectApi.getById(subjectId)
      setSubject(response.data)
    } catch (error) {
      console.error('Error fetching subject:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this subject? This action cannot be undone.')) {
      try {
        await subjectApi.delete(subjectId)
        router.push('/admin/subjects')
      } catch (error) {
        console.error('Error deleting subject:', error)
        alert('Failed to delete subject. Please try again.')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!subject) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Subject Not Found</h2>
        <Link href="/admin/subjects">
          <Button>Back to Subjects</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/subjects">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Subjects
            </Button>
          </Link>
          <div className="flex items-center space-x-4">
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
              style={{ backgroundColor: subject.color }}
            >
              {subject.code.slice(0, 2)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{subject.name}</h1>
              <p className="text-gray-600">Code: {subject.code}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={subject.is_active ? "default" : "secondary"} className="text-sm">
            {subject.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <Link href={`/admin/subjects/${subject.id}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Subject Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Subject Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="mt-1 text-gray-900">
                  {subject.description || 'No description provided'}
                </p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Display Order</label>
                  <p className="mt-1 text-gray-900">{subject.display_order}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Animation Type</label>
                  <p className="mt-1 text-gray-900 capitalize">{subject.animation_type}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Topics Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5" />
                    <span>Topics ({subject.topics?.length || 0})</span>
                  </CardTitle>
                  <CardDescription>
                    Curriculum topics for this subject
                  </CardDescription>
                </div>
                <Link href={`/admin/topics/new?subject_id=${subject.id}`}>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Topic
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {subject.topics && subject.topics.length > 0 ? (
                <div className="space-y-3">
                  {subject.topics.map((topic) => (
                    <div key={topic.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <h4 className="font-medium">{topic.title}</h4>
                        <p className="text-sm text-gray-500 line-clamp-1">
                          {topic.description || 'No description'}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-400 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {topic.duration_weeks} weeks
                          </span>
                          <Badge variant={topic.is_active ? "default" : "secondary"} className="text-xs">
                            {topic.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                      <Link href={`/admin/topics/${topic.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Topics Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start building your curriculum by adding topics to this subject
                  </p>
                  <Link href={`/admin/topics/new?subject_id=${subject.id}`}>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Topic
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Context & Styling */}
        <div className="space-y-6">
          {/* Hierarchy Context */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <School className="w-5 h-5" />
                <span>Context</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <School className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">School Level:</span>
                  <span className="font-medium">{subject.term.form_grade.school_level.name}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Form/Grade:</span>
                  <span className="font-medium">{subject.term.form_grade.name}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Term:</span>
                  <span className="font-medium">{subject.term.name}</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">Term Duration</label>
                <div className="text-sm text-gray-900">
                  {new Date(subject.term.start_date).toLocaleDateString()} - 
                  {new Date(subject.term.end_date).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visual Styling */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="w-5 h-5" />
                <span>Visual Styling</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Color</label>
                  <div className="flex items-center space-x-3 mt-1">
                    <div 
                      className="w-8 h-8 rounded-lg border border-gray-300"
                      style={{ backgroundColor: subject.color }}
                    />
                    <span className="text-sm font-mono">{subject.color}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Icon</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">{subject.icon}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Animation</label>
                  <div className="flex items-center space-x-2 mt-1">
                    <Sparkles className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900 capitalize">{subject.animation_type}</span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Preview Card */}
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Preview</label>
                <div className="p-3 border rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: subject.color }}
                    >
                      {subject.code.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{subject.name}</div>
                      <div className="text-xs text-gray-500">{subject.code}</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href={`/admin/topics/new?subject_id=${subject.id}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Topic
                </Button>
              </Link>
              
              <Link href={`/admin/subjects/${subject.id}/edit`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Subject
                </Button>
              </Link>
              
              <Link href={`/admin/subjects?term_id=${subject.term_id}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="w-4 h-4 mr-2" />
                  View All in Term
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Created:</span>
                <span className="ml-2">{new Date(subject.created_at).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-gray-500">Updated:</span>
                <span className="ml-2">{new Date(subject.updated_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default SubjectDetailsPage