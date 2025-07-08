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
  FileText, 
  Plus, 
  Search, 
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
  List
} from 'lucide-react'
import Link from 'next/link'
import { topicApi, subjectApi } from '@/lib/api'

interface Subject {
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
  is_active: boolean
}

interface Topic {
  id: number
  title: string
  description: string
  learning_objectives: string[]
  duration_weeks: number
  display_order: number
  subject_id: number
  is_active: boolean
  created_at: string
  updated_at: string
  subject?: Subject
  subtopics_count?: number
}

const TopicsPage = () => {
  const searchParams = useSearchParams()
  const preSelectedSubjectId = searchParams.get('subject_id')
  
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(
    preSelectedSubjectId ? parseInt(preSelectedSubjectId) : null
  )
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetchSubjects()
    fetchTopics()
  }, [])

  useEffect(() => {
    filterTopics()
  }, [topics, selectedSubjectId, searchTerm, activeTab])

  const fetchSubjects = async () => {
    try {
      const response = await subjectApi.getAll()
      setSubjects(response.data || [])
    } catch (error) {
      console.error('Error fetching subjects:', error)
    }
  }

  const fetchTopics = async () => {
    try {
      const response = await topicApi.getAll()
      setTopics(response.data || [])
    } catch (error) {
      console.error('Error fetching topics:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTopics = () => {
    let filtered = topics

    // Filter by selected subject
    if (selectedSubjectId) {
      filtered = filtered.filter(topic => topic.subject_id === selectedSubjectId)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(topic => 
        topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by active status
    if (activeTab === 'active') {
      filtered = filtered.filter(topic => topic.is_active)
    } else if (activeTab === 'inactive') {
      filtered = filtered.filter(topic => !topic.is_active)
    }

    setFilteredTopics(filtered)
  }

  const handleDeleteTopic = async (id: number) => {
    if (confirm('Are you sure you want to delete this topic?')) {
      try {
        await topicApi.delete(id)
        fetchTopics()
      } catch (error) {
        console.error('Error deleting topic:', error)
      }
    }
  }

  const getSelectedSubject = () => {
    return subjects.find(subject => subject.id === selectedSubjectId)
  }

  const TopicCard = ({ topic }: { topic: Topic }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 border-l-4" 
          style={{ borderLeftColor: topic.subject?.color || '#3B82F6' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                 style={{ backgroundColor: topic.subject?.color || '#3B82F6' }}>
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-lg">{topic.title}</CardTitle>
              <CardDescription className="text-sm">
                Subject: {topic.subject?.name}
              </CardDescription>
            </div>
          </div>
          <Badge variant={topic.is_active ? "default" : "secondary"}>
            {topic.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm text-gray-600 line-clamp-2">
            {topic.description || 'No description available'}
          </p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{topic.duration_weeks} weeks</span>
            </div>
            <div className="flex items-center space-x-1">
              <Target className="w-4 h-4" />
              <span>{topic.learning_objectives?.length || 0} objectives</span>
            </div>
            <div className="flex items-center space-x-1">
              <List className="w-4 h-4" />
              <span>{topic.subtopics_count || 0} subtopics</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex space-x-2">
              <Link href={`/admin/topics/${topic.id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
              </Link>
              <Link href={`/admin/subtopics/new?topic_id=${topic.id}`}>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Subtopics
                </Button>
              </Link>
            </div>
            <div className="flex space-x-1">
              <Link href={`/admin/topics/${topic.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </Link>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => handleDeleteTopic(topic.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
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

  const selectedSubject = getSelectedSubject()

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/admin/subjects">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Subjects
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Topics</h1>
            <p className="text-gray-600">Manage curriculum topics and learning objectives</p>
          </div>
        </div>
        <Link href="/admin/topics/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Topic
          </Button>
        </Link>
      </div>

      {/* Subject Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5" />
            <span>Select Subject</span>
          </CardTitle>
          <CardDescription>
            Choose a subject to view and manage its topics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={selectedSubjectId?.toString() || ''} onValueChange={(value) => setSelectedSubjectId(value ? parseInt(value) : null)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a subject..." />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id.toString()}>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: subject.color }}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{subject.name} ({subject.code})</span>
                        <span className="text-sm text-gray-500">
                          {subject.term?.name} - {subject.term?.form_grade?.name}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedSubject && (
              <div className="p-4 rounded-lg border-2" 
                   style={{ borderColor: selectedSubject.color, backgroundColor: `${selectedSubject.color}10` }}>
                <h3 className="font-semibold" style={{ color: selectedSubject.color }}>
                  {selectedSubject.name}
                </h3>
                <p className="text-sm text-gray-700">
                  {selectedSubject.term?.name} - {selectedSubject.term?.form_grade?.name}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {filteredTopics.length} topics in this subject
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      {selectedSubjectId && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search topics in this subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Link href={`/admin/topics/new?subject_id=${selectedSubjectId}`}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Topic to {selectedSubject?.name}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {!selectedSubjectId ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Subject First</h3>
              <p className="text-gray-600 mb-4">
                Choose a subject from the dropdown above to view and manage its topics
              </p>
            </div>
          </CardContent>
        </Card>
      ) : filteredTopics.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Topics Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? `No topics match "${searchTerm}" in ${selectedSubject?.name}`
                  : `${selectedSubject?.name} doesn't have any topics yet`
                }
              </p>
              <Link href={`/admin/topics/new?subject_id=${selectedSubjectId}`}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Topic
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Subject Context Header */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Showing {filteredTopics.length} topics for <strong>{selectedSubject?.name}</strong> 
              ({selectedSubject?.term?.name} - {selectedSubject?.term?.form_grade?.name})
            </AlertDescription>
          </Alert>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Topics ({filteredTopics.length})</TabsTrigger>
              <TabsTrigger value="active">Active ({filteredTopics.filter(t => t.is_active).length})</TabsTrigger>
              <TabsTrigger value="inactive">Inactive ({filteredTopics.filter(t => !t.is_active).length})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {/* Topics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTopics.map((topic) => (
                  <TopicCard key={topic.id} topic={topic} />
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Subject Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{filteredTopics.length}</div>
                  <div className="text-sm text-gray-600">Total Topics</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {filteredTopics.filter(t => t.is_active).length}
                  </div>
                  <div className="text-sm text-gray-600">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {filteredTopics.reduce((sum, t) => sum + t.duration_weeks, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Weeks</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {filteredTopics.reduce((sum, t) => sum + (t.subtopics_count || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Subtopics</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default TopicsPage