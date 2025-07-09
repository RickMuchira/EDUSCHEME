"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FileText, 
  Search, 
  Plus, 
  ArrowLeft,
  Clock,
  Target,
  Eye,
  Edit,
  Trash2,
  CheckSquare,
  PlayCircle,
  BookMarked,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface Topic {
  id: number
  title: string
  description: string
  duration_weeks: number
  subject: {
    id: number
    name: string
    code: string
    color: string
    term: {
      id: number
      name: string
      form_grade: {
        id: number
        name: string
        school_level: {
          id: number
          name: string
        }
      }
    }
  }
  is_active: boolean
}

interface Subtopic {
  id: number
  title: string
  content: string
  activities: any[]
  assessment_criteria: any[]
  resources: any[]
  duration_lessons: number
  display_order: number
  topic_id: number
  is_active: boolean
  created_at: string
  updated_at: string
}

const TopicSubtopicsPage = () => {
  const params = useParams()
  const router = useRouter()
  const topicId = parseInt(params.id as string)
  
  const [topic, setTopic] = useState<Topic | null>(null)
  const [subtopics, setSubtopics] = useState<Subtopic[]>([])
  const [filteredSubtopics, setFilteredSubtopics] = useState<Subtopic[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('active')

  useEffect(() => {
    if (topicId) {
      fetchTopic()
      fetchSubtopics()
    }
  }, [topicId])

  useEffect(() => {
    filterSubtopics()
  }, [subtopics, searchTerm, activeTab])

  const fetchTopic = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/admin/topics/${topicId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        setTopic(data.data)
      } else {
        throw new Error(data.message || 'Failed to load topic')
      }
    } catch (error: any) {
      console.error('Error fetching topic:', error)
      setError(error.message)
      toast.error('Failed to load topic details')
    }
  }

  const fetchSubtopics = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/admin/topics/${topicId}/subtopics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        setSubtopics(data.data)
      } else {
        throw new Error(data.message || 'Failed to load subtopics')
      }
    } catch (error: any) {
      console.error('Error fetching subtopics:', error)
      setError(error.message)
      toast.error('Failed to load subtopics')
    } finally {
      setLoading(false)
    }
  }

  const filterSubtopics = () => {
    let filtered = subtopics

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(subtopic => 
        subtopic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subtopic.content?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by active status
    if (activeTab === 'active') {
      filtered = filtered.filter(subtopic => subtopic.is_active)
    } else if (activeTab === 'inactive') {
      filtered = filtered.filter(subtopic => !subtopic.is_active)
    }

    setFilteredSubtopics(filtered.sort((a, b) => a.display_order - b.display_order))
  }

  const handleDeleteSubtopic = async (subtopicId: number) => {
    if (!confirm('Are you sure you want to delete this subtopic?')) return

    try {
      const response = await fetch(`http://localhost:8000/api/v1/admin/subtopics/${subtopicId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.success) {
        toast.success('Subtopic deleted successfully')
        fetchSubtopics() // Refresh the list
      } else {
        throw new Error(data.message || 'Failed to delete subtopic')
      }
    } catch (error: any) {
      console.error('Error deleting subtopic:', error)
      toast.error(error.message || 'Failed to delete subtopic')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Loading subtopics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <p className="font-medium">Error loading subtopics</p>
            <p className="text-sm">{error}</p>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Topics
          </Button>
        </div>
        
        {topic && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{topic.title}</h1>
                <p className="text-gray-600 mb-4">{topic.description}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {topic.duration_weeks} weeks
                  </span>
                  <span className="flex items-center">
                    <BookMarked className="h-4 w-4 mr-1" />
                    {topic.subject.name}
                  </span>
                  <span className="flex items-center">
                    <Target className="h-4 w-4 mr-1" />
                    {topic.subject.term.form_grade.name}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={topic.is_active ? "default" : "secondary"}>
                  {topic.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Button asChild>
                  <Link href={`/admin/subtopics/new?topic_id=${topicId}`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subtopic
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search subtopics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchSubtopics()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All ({subtopics.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({subtopics.filter(s => s.is_active).length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({subtopics.filter(s => !s.is_active).length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredSubtopics.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No subtopics found</h3>
                <p className="text-gray-600 text-center mb-6">
                  {searchTerm ? 'No subtopics match your search criteria.' : 'This topic doesn\'t have any subtopics yet.'}
                </p>
                <Button asChild>
                  <Link href={`/admin/subtopics/new?topic_id=${topicId}`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Subtopic
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredSubtopics.map((subtopic) => (
                <Card key={subtopic.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <CardTitle className="text-lg">{subtopic.title}</CardTitle>
                          <Badge variant={subtopic.is_active ? "default" : "secondary"}>
                            {subtopic.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <CardDescription className="text-sm text-gray-600 line-clamp-2">
                          {subtopic.content || 'No content available'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/subtopics/${subtopic.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/subtopics/${subtopic.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteSubtopic(subtopic.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>{subtopic.duration_lessons} lesson{subtopic.duration_lessons !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <PlayCircle className="h-4 w-4 text-gray-400" />
                        <span>{subtopic.activities?.length || 0} activities</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckSquare className="h-4 w-4 text-gray-400" />
                        <span>{subtopic.assessment_criteria?.length || 0} assessments</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <BookMarked className="h-4 w-4 text-gray-400" />
                        <span>{subtopic.resources?.length || 0} resources</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default TopicSubtopicsPage 