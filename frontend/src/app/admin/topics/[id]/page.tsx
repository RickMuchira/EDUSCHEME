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
  BookOpen,
  Calendar,
  GraduationCap,
  Target,
  Clock,
  Plus,
  Eye,
  List,
  PlayCircle,
  CheckSquare,
  BookMarked
} from 'lucide-react'
import Link from 'next/link'
import { topicApi, subtopicApi } from '@/lib/api'

interface Topic {
  id: number
  title: string
  description: string
  learning_objectives: string[]
  duration_weeks: number
  display_order: number
  subject_id: number
  subject: {
    id: number
    name: string
    code: string
    color: string
    term: {
      id: number
      name: string
      code: string
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
  }
  subtopics: Array<{
    id: number
    title: string
    content: string
    duration_lessons: number
    activities: any[]
    assessment_criteria: any[]
    resources: any[]
    is_active: boolean
  }>
  is_active: boolean
  created_at: string
  updated_at: string
}

const TopicDetailsPage = () => {
  const params = useParams()
  const router = useRouter()
  const topicId = parseInt(params.id as string)
  
  const [topic, setTopic] = useState<Topic | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTopic()
  }, [topicId])

  const fetchTopic = async () => {
    try {
      const response = await topicApi.getById(topicId)
      setTopic(response.data)
    } catch (error) {
      console.error('Error fetching topic:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this topic? This action cannot be undone.')) {
      try {
        await topicApi.delete(topicId)
        router.push('/admin/topics')
      } catch (error) {
        console.error('Error deleting topic:', error)
        alert('Failed to delete topic. Please try again.')
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

  if (!topic) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Topic Not Found</h2>
        <Link href="/admin/topics">
          <Button>Back to Topics</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/topics">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Topics
            </Button>
          </Link>
          <div className="flex items-center space-x-4">
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
              style={{ backgroundColor: topic.subject?.color || '#3B82F6' }}
            >
              <Target className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{topic.title}</h1>
              <p className="text-gray-600">Subject: {topic.subject?.name}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={topic.is_active ? "default" : "secondary"} className="text-sm">
            {topic.is_active ? 'Active' : 'Inactive'}
          </Badge>
          <Link href={`/admin/topics/${topic.id}/edit`}>
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
        {/* Left Column - Topic Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Topic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="mt-1 text-gray-900">
                  {topic.description || 'No description provided'}
                </p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Duration</label>
                  <p className="mt-1 text-gray-900">{topic.duration_weeks} weeks</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Display Order</label>
                  <p className="mt-1 text-gray-900">{topic.display_order}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Learning Objectives */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Learning Objectives</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topic.learning_objectives && topic.learning_objectives.length > 0 ? (
                <ul className="space-y-2">
                  {topic.learning_objectives.map((objective, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-gray-900">{objective}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No learning objectives defined</p>
              )}
            </CardContent>
          </Card>

          {/* Subtopics Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <List className="w-5 h-5" />
                    <span>Subtopics ({topic.subtopics?.length || 0})</span>
                  </CardTitle>
                  <CardDescription>
                    Detailed lesson content and activities
                  </CardDescription>
                </div>
                <Link href={`/admin/subtopics/new?topic_id=${topic.id}`}>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Subtopic
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {topic.subtopics && topic.subtopics.length > 0 ? (
                <div className="space-y-3">
                  {topic.subtopics.map((subtopic) => (
                    <div key={subtopic.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{subtopic.title}</h4>
                        <Badge variant={subtopic.is_active ? "default" : "secondary"} className="text-xs">
                          {subtopic.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {subtopic.content || 'No content description'}
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{subtopic.duration_lessons} lessons</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <PlayCircle className="w-3 h-3" />
                          <span>{subtopic.activities?.length || 0} activities</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CheckSquare className="w-3 h-3" />
                          <span>{subtopic.assessment_criteria?.length || 0} assessments</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <BookMarked className="w-3 h-3" />
                          <span>{subtopic.resources?.length || 0} resources</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end space-x-2">
                        <Link href={`/admin/subtopics/${subtopic.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/admin/subtopics/${subtopic.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <List className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Subtopics Yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start building detailed lesson content by adding subtopics
                  </p>
                  <Link href={`/admin/subtopics/new?topic_id=${topic.id}`}>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Subtopic
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Context & Actions */}
        <div className="space-y-6">
          {/* Hierarchy Context */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>Context</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">School Level:</span>
                  <span className="font-medium">{topic.subject?.term?.form_grade?.school_level?.name}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Form/Grade:</span>
                  <span className="font-medium">{topic.subject?.term?.form_grade?.name}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Term:</span>
                  <span className="font-medium">{topic.subject?.term?.name}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <BookOpen className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Subject:</span>
                  <span className="font-medium">{topic.subject?.name}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Topic Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{topic.subtopics?.length || 0}</div>
                  <div className="text-sm text-gray-600">Subtopics</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {topic.subtopics?.reduce((sum, s) => sum + s.duration_lessons, 0) || 0}
                  </div>
                  <div className="text-sm text-gray-600">Total Lessons</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {topic.subtopics?.reduce((sum, s) => sum + (s.activities?.length || 0), 0) || 0}
                  </div>
                  <div className="text-sm text-gray-600">Activities</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {topic.learning_objectives?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">Objectives</div>
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
              <Link href={`/admin/subtopics/new?topic_id=${topic.id}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subtopic
                </Button>
              </Link>
              
              <Link href={`/admin/subtopics?topic_id=${topic.id}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="w-4 h-4 mr-2" />
                  View All Subtopics
                </Button>
              </Link>
              
              <Link href={`/admin/topics/${topic.id}/edit`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Topic
                </Button>
              </Link>
              
              <Link href={`/admin/topics?subject_id=${topic.subject_id}`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <BookOpen className="w-4 h-4 mr-2" />
                  View Subject Topics
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
                <span className="ml-2">{new Date(topic.created_at).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-gray-500">Updated:</span>
                <span className="ml-2">{new Date(topic.updated_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default TopicDetailsPage