'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { subjectApi, topicApi } from '@/lib/api'

interface Subject {
  id: number
  name: string
  code: string
  color: string
  term: {
    name: string
    form_grade: {
      name: string
      school_level: {
        name: string
      }
    }
  }
}

interface Topic {
  id: number
  title: string
  description: string
  duration_weeks: number
  learning_objectives: string[]
  display_order: number
  is_active: boolean
  subtopics_count: number
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

  useEffect(() => {
    if (subjectId) {
      fetchSubject()
      fetchTopics()
    }
  }, [subjectId])

  useEffect(() => {
    filterTopics()
  }, [topics, searchTerm, statusFilter])

  const fetchSubject = async () => {
    try {
      const response = await subjectApi.get(subjectId)
      setSubject(response.data)
    } catch (error) {
      console.error('Error fetching subject:', error)
    }
  }

  const fetchTopics = async () => {
    try {
      const response = await topicApi.getBySubject(subjectId)
      setTopics(response.data || [])
    } catch (error) {
      console.error('Error fetching topics:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterTopics = () => {
    let filtered = topics

    if (searchTerm) {
      filtered = filtered.filter(topic => 
        topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter(topic => topic.is_active)
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(topic => !topic.is_active)
    }

    setFilteredTopics(filtered.sort((a, b) => a.display_order - b.display_order))
  }

  const handleTopicClick = (topicId: number) => {
    router.push(`/admin/topics/${topicId}/subtopics`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/subjects">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Subjects
            </Link>
          </Button>
        </div>
        
        {subject && (
          <div className="flex items-center space-x-4">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: subject.color }}
            >
              {subject.code}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{subject.name}</h1>
              <p className="text-gray-600">
                {subject.term.form_grade.name} • {subject.term.name} • {subject.term.form_grade.school_level.name}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Topics</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>

        <Button asChild>
          <Link href={`/admin/topics/new?subject_id=${subjectId}`}>
            <Plus className="h-4 w-4 mr-2" />
            Add Topic
          </Link>
        </Button>
      </div>

      {/* Topics List */}
      {filteredTopics.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Topics Found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'No topics match your search.' : 'Start by adding your first topic.'}
            </p>
            <Button asChild>
              <Link href={`/admin/topics/new?subject_id=${subjectId}`}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Topic
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTopics.map((topic) => (
            <Card 
              key={topic.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleTopicClick(topic.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <CardTitle className="text-lg">{topic.title}</CardTitle>
                      <Badge variant={topic.is_active ? "default" : "secondary"}>
                        {topic.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      {topic.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/admin/topics/${topic.id}/edit`)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/admin/topics/${topic.id}`)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>{topic.duration_weeks} weeks</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="h-4 w-4" />
                      <span>{topic.subtopics_count} subtopics</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Target className="h-4 w-4" />
                    <span>{topic.learning_objectives.length} objectives</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default SubjectTopicsPage