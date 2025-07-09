// File: frontend/src/app/admin/subjects/[id]/topics/page.tsx
// Direct subject-specific topics page - no need to select subject again

'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  BookOpen, 
  Search, 
  Plus, 
  ArrowLeft,
  Clock,
  Target,
  Eye,
  Edit,
  Trash2,
  FileText,
  Users,
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { subjectApi, topicApi } from '@/lib/api'
import { toast } from 'sonner'

interface Subject {
  id: number
  name: string
  code: string
  color: string
  description: string
  term: {
    id: number
    name: string
    code: string
    form_grade: {
      id: number
      name: string
      school_level: {
        id: number
        name: string
      }
    }
  }
  is_active: boolean
}

interface Topic {
  id: number
  title: string
  description: string
  duration_weeks: number
  learning_objectives: string[]
  display_order: number
  is_active: boolean
  subtopics_count?: number
  created_at: string
  updated_at: string
}

const SubjectTopicsPage = () => {
  const params = useParams()
  const router = useRouter()
  const subjectId = parseInt(params.id as string)
  
  const [subject, setSubject] = useState<Subject | null>(null)
  const [topics, setTopics] = useState<Topic[]>([])
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('active')

  useEffect(() => {
    if (subjectId) {
      fetchSubject()
      fetchTopics()
    }
  }, [subjectId])

  useEffect(() => {
    filterTopics()
  }, [topics, searchTerm, statusFilter, activeTab])

  const fetchSubject = async () => {
    try {
      const response = await subjectApi.getById(subjectId)
      if (response.success && response.data) {
        setSubject(response.data)
      } else {
        throw new Error(response.message || 'Subject not found')
      }
    } catch (error: any) {
      console.error('Error fetching subject:', error)
      toast.error('Failed to load subject details')
    }
  }

  const fetchTopics = async () => {
    try {
      const response = await topicApi.getBySubject(subjectId)
      if (response.success && response.data) {
        setTopics(response.data)
      } else {
        throw new Error(response.message || 'Failed to load topics')
      }
    } catch (error: any) {
      console.error('Error fetching topics:', error)
      toast.error('Failed to load topics')
    } finally {
      setLoading(false)
    }
  }

  const filterTopics = () => {
    let filtered = topics

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(topic => 
        topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by status
    if (activeTab === 'active') {
      filtered = filtered.filter(topic => topic.is_active)
    } else if (activeTab === 'inactive') {
      filtered = filtered.filter(topic => !topic.is_active)
    }

    setFilteredTopics(filtered.sort((a, b) => a.display_order - b.display_order))
  }

  const handleTopicClick = (topicId: number) => {
    router.push(`/admin/topics/${topicId}/subtopics`)
  }

  const handleDeleteTopic = async (topicId: number) => {
    if (confirm('Are you sure you want to delete this topic?')) {
      try {
        const response = await topicApi.delete(topicId)
        if (response.success) {
          toast.success('Topic deleted successfully')
          fetchTopics() // Refresh the list
        } else {
          throw new Error(response.message || 'Failed to delete topic')
        }
      } catch (error: any) {
        console.error('Error deleting topic:', error)
        toast.error('Failed to delete topic')
      }
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading topics...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!subject) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Subject Not Found</h2>
          <p className="text-gray-600 mb-6">The subject you're looking for doesn't exist or has been deleted.</p>
          <Link href="/admin/subjects">
            <Button>Back to Subjects</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href={`/admin/subjects?term_id=${subject.term.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Topics for {subject.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {subject.term.form_grade.name} • {subject.term.name} • {subject.code}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="icon" onClick={() => fetchTopics()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Link href={`/admin/topics/new?subject_id=${subject.id}`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Topic
            </Button>
          </Link>
        </div>
      </div>

      {/* Subject Info Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
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
                  <Badge variant={subject.is_active ? "default" : "secondary"}>
                    {subject.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {subject.description}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {topics.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Topics
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topics List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Topics
            </span>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
            </div>
          </CardTitle>
          <CardDescription>
            Manage topics and learning objectives for {subject.name}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="active">Active ({topics.filter(t => t.is_active).length})</TabsTrigger>
              <TabsTrigger value="inactive">Inactive ({topics.filter(t => !t.is_active).length})</TabsTrigger>
              <TabsTrigger value="all">All ({topics.length})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredTopics.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {searchTerm ? 'No topics found' : `No ${activeTab === 'all' ? '' : activeTab} topics yet`}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {searchTerm 
                      ? 'Try adjusting your search terms'
                      : `Create your first topic for ${subject.name}`
                    }
                  </p>
                  {!searchTerm && (
                    <Link href={`/admin/topics/new?subject_id=${subject.id}`}>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Topic
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTopics.map((topic) => (
                    <Card key={topic.id} className="border hover:border-blue-200 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <Target className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {topic.title}
                                </h3>
                                <Badge variant={topic.is_active ? "default" : "secondary"}>
                                  {topic.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {topic.description}
                              </p>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                <span className="flex items-center">
                                  <Clock className="mr-1 h-4 w-4" />
                                  {topic.duration_weeks} week{topic.duration_weeks !== 1 ? 's' : ''}
                                </span>
                                <span className="flex items-center">
                                  <Target className="mr-1 h-4 w-4" />
                                  {topic.learning_objectives?.length || 0} objectives
                                </span>
                                {topic.subtopics_count !== undefined && (
                                  <span className="flex items-center">
                                    <FileText className="mr-1 h-4 w-4" />
                                    {topic.subtopics_count} subtopics
                                  </span>
                                )}
                                <span className="flex items-center">
                                  <Users className="mr-1 h-4 w-4" />
                                  Order: {topic.display_order}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTopicClick(topic.id)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Subtopics
                            </Button>
                            
                            <Link href={`/admin/topics/${topic.id}/edit`}>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteTopic(topic.id)}
                              className="text-red-600 hover:text-red-700"
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

export default SubjectTopicsPage