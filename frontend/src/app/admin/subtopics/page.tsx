'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  List, 
  Plus, 
  Search, 
  FileText,
  BookOpen,
  Calendar,
  GraduationCap,
  Eye,
  Edit,
  Trash2,
  Clock,
  Target,
  Users,
  AlertCircle,
  ArrowLeft,
  CheckSquare,
  PlayCircle,
  BookMarked
} from 'lucide-react'
import Link from 'next/link'
import { subtopicApi, topicApi } from '@/lib/api'

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
  topic?: Topic
}

const SubtopicsPage = () => {
  const searchParams = useSearchParams()
  const preSelectedTopicId = searchParams.get('topic_id')
  
  const [topics, setTopics] = useState<Topic[]>([])
  const [subtopics, setSubtopics] = useState<Subtopic[]>([])
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(
    preSelectedTopicId ? parseInt(preSelectedTopicId) : null
  )
  const [filteredSubtopics, setFilteredSubtopics] = useState<Subtopic[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetchTopics()
    fetchSubtopics()
  }, [])

  useEffect(() => {
    filterSubtopics()
  }, [subtopics, selectedTopicId, searchTerm, activeTab])

  const fetchTopics = async () => {
    try {
      const response = await topicApi.getAll()
      setTopics(response.data || [])
    } catch (error) {
      console.error('Error fetching topics:', error)
    }
  }

  const fetchSubtopics = async () => {
    try {
      const response = await subtopicApi.getAll()
      setSubtopics(response.data || [])
    } catch (error) {
      console.error('Error fetching subtopics:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterSubtopics = () => {
    let filtered = subtopics

    // Filter by selected topic
    if (selectedTopicId) {
      filtered = filtered.filter(subtopic => subtopic.topic_id === selectedTopicId)
    }

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

    setFilteredSubtopics(filtered)
  }

  const handleDeleteSubtopic = async (id: number) => {
    if (confirm('Are you sure you want to delete this subtopic?')) {
      try {
        await subtopicApi.delete(id)
        fetchSubtopics()
      } catch (error) {
        console.error('Error deleting subtopic:', error)
      }
    }
  }

  const getSelectedTopic = () => {
    return topics.find(topic => topic.id === selectedTopicId)
  }

  const SubtopicCard = ({ subtopic }: { subtopic: Subtopic }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 border-l-4" 
          style={{ borderLeftColor: subtopic.topic?.subject?.color || '#3B82F6' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                 style={{ backgroundColor: subtopic.topic?.subject?.color || '#3B82F6' }}>
              <List className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg">{subtopic.title}</CardTitle>
              <CardDescription className="text-sm">
                Topic: {subtopic.topic?.title}
              </CardDescription>
            </div>
          </div>
          <Badge variant={subtopic.is_active ? "default" : "secondary"}>
            {subtopic.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-gray-600 line-clamp-2">
            {subtopic.content || 'No content available'}
          </p>
          
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{subtopic.duration_lessons} lessons</span>
            </div>
            <div className="flex items-center space-x-1">
              <PlayCircle className="w-4 h-4" />
              <span>{subtopic.activities?.length || 0} activities</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckSquare className="w-4 h-4" />
              <span>{subtopic.assessment_criteria?.length || 0} assessments</span>
            </div>
            <div className="flex items-center space-x-1">
              <BookMarked className="w-4 h-4" />
              <span>{subtopic.resources?.length || 0} resources</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex space-x-2">
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
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => handleDeleteSubtopic(subtopic.id)}
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

  const selectedTopic = getSelectedTopic()

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/topics">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Topics
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Subtopics</h1>
            <p className="text-gray-600">Manage detailed lesson content and activities</p>
          </div>
        </div>
        <Link href="/admin/subtopics/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Subtopic
          </Button>
        </Link>
      </div>

      {/* Topic Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Select Topic</span>
          </CardTitle>
          <CardDescription>
            Choose a topic to view and manage its subtopics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={selectedTopicId?.toString() || ''} onValueChange={(value) => setSelectedTopicId(value ? parseInt(value) : null)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a topic..." />
              </SelectTrigger>
              <SelectContent>
                {topics.map((topic) => (
                  <SelectItem key={topic.id} value={topic.id.toString()}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: topic.subject?.color || '#3B82F6' }}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{topic.title}</span>
                        <span className="text-sm text-gray-500">
                          {topic.subject?.name} - {topic.subject?.term?.name}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedTopic && (
              <div className="p-4 rounded-lg border-2" 
                   style={{ 
                     borderColor: selectedTopic.subject?.color || '#3B82F6', 
                     backgroundColor: `${selectedTopic.subject?.color || '#3B82F6'}10` 
                   }}>
                <h3 className="font-semibold" style={{ color: selectedTopic.subject?.color || '#3B82F6' }}>
                  {selectedTopic.title}
                </h3>
                <p className="text-sm text-gray-700">
                  {selectedTopic.subject?.name} - {selectedTopic.subject?.term?.name}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {filteredSubtopics.length} subtopics • {selectedTopic.duration_weeks} weeks
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      {selectedTopicId && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search subtopics in this topic..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Link href={`/admin/subtopics/new?topic_id=${selectedTopicId}`}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Subtopic to {selectedTopic?.title}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {!selectedTopicId ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Topic First</h3>
              <p className="text-gray-600 mb-4">
                Choose a topic from the dropdown above to view and manage its subtopics
              </p>
            </div>
          </CardContent>
        </Card>
      ) : filteredSubtopics.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <List className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Subtopics Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? `No subtopics match "${searchTerm}" in ${selectedTopic?.title}`
                  : `${selectedTopic?.title} doesn't have any subtopics yet`
                }
              </p>
              <Link href={`/admin/subtopics/new?topic_id=${selectedTopicId}`}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Subtopic
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Topic Context Header */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Showing {filteredSubtopics.length} subtopics for <strong>{selectedTopic?.title}</strong> 
              ({selectedTopic?.subject?.name} - {selectedTopic?.subject?.term?.name})
            </AlertDescription>
          </Alert>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Subtopics ({filteredSubtopics.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({filteredSubtopics.filter(s => s.is_active).length})</TabsTrigger>
              <TabsTrigger value="inactive">Inactive ({filteredSubtopics.filter(s => !s.is_active).length})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {/* Subtopics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSubtopics.map((subtopic) => (
                  <SubtopicCard key={subtopic.id} subtopic={subtopic} />
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Topic Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{filteredSubtopics.length}</div>
                  <div className="text-sm text-gray-600">Total Subtopics</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {filteredSubtopics.filter(s => s.is_active).length}
                  </div>
                  <div className="text-sm text-gray-600">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {filteredSubtopics.reduce((sum, s) => sum + s.duration_lessons, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Lessons</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {filteredSubtopics.reduce((sum, s) => sum + (s.activities?.length || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Activities</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default SubtopicsPage