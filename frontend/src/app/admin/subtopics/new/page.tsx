'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Save, 
  FileText,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  PlayCircle,
  CheckSquare,
  BookMarked,
  Clock,
  Target
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

interface Activity {
  title: string
  description: string
  type: string
  duration_minutes: number
}

interface Assessment {
  title: string
  description: string
  type: string
  points: number
}

interface Resource {
  title: string
  description: string
  type: string
  url: string
}

const CreateSubtopicPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedTopicId = searchParams.get('topic_id')

  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    activities: [{ title: '', description: '', type: 'individual', duration_minutes: 30 }] as Activity[],
    assessment_criteria: [{ title: '', description: '', type: 'formative', points: 10 }] as Assessment[],
    resources: [{ title: '', description: '', type: 'document', url: '' }] as Resource[],
    duration_lessons: 1,
    display_order: 0,
    topic_id: preselectedTopicId ? parseInt(preselectedTopicId) : null as number | null,
    is_active: true
  })

  useEffect(() => {
    fetchTopics()
  }, [])

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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Activities Management
  const handleActivityChange = (index: number, field: string, value: any) => {
    const newActivities = [...formData.activities]
    newActivities[index] = { ...newActivities[index], [field]: value }
    setFormData(prev => ({ ...prev, activities: newActivities }))
  }

  const addActivity = () => {
    setFormData(prev => ({
      ...prev,
      activities: [...prev.activities, { title: '', description: '', type: 'individual', duration_minutes: 30 }]
    }))
  }

  const removeActivity = (index: number) => {
    if (formData.activities.length > 1) {
      const newActivities = formData.activities.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, activities: newActivities }))
    }
  }

  // Assessment Management
  const handleAssessmentChange = (index: number, field: string, value: any) => {
    const newAssessments = [...formData.assessment_criteria]
    newAssessments[index] = { ...newAssessments[index], [field]: value }
    setFormData(prev => ({ ...prev, assessment_criteria: newAssessments }))
  }

  const addAssessment = () => {
    setFormData(prev => ({
      ...prev,
      assessment_criteria: [...prev.assessment_criteria, { title: '', description: '', type: 'formative', points: 10 }]
    }))
  }

  const removeAssessment = (index: number) => {
    if (formData.assessment_criteria.length > 1) {
      const newAssessments = formData.assessment_criteria.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, assessment_criteria: newAssessments }))
    }
  }

  // Resources Management
  const handleResourceChange = (index: number, field: string, value: any) => {
    const newResources = [...formData.resources]
    newResources[index] = { ...newResources[index], [field]: value }
    setFormData(prev => ({ ...prev, resources: newResources }))
  }

  const addResource = () => {
    setFormData(prev => ({
      ...prev,
      resources: [...prev.resources, { title: '', description: '', type: 'document', url: '' }]
    }))
  }

  const removeResource = (index: number) => {
    if (formData.resources.length > 1) {
      const newResources = formData.resources.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, resources: newResources }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) newErrors.title = 'Subtopic title is required'
    if (!formData.topic_id) newErrors.topic_id = 'Please select a topic'
    if (formData.duration_lessons < 1) newErrors.duration_lessons = 'Duration must be at least 1 lesson'

    // Check if at least one activity has content
    const hasValidActivity = formData.activities.some(act => act.title.trim().length > 0)
    if (!hasValidActivity) {
      newErrors.activities = 'At least one activity is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setSaving(true)
    try {
      // Clean up data - remove empty items
      const cleanedData = {
        ...formData,
        activities: formData.activities.filter(act => act.title.trim().length > 0),
        assessment_criteria: formData.assessment_criteria.filter(ass => ass.title.trim().length > 0),
        resources: formData.resources.filter(res => res.title.trim().length > 0)
      }

      const response = await subtopicApi.create(cleanedData)
      if (response.success) {
        router.push('/admin/subtopics')
      } else {
        setErrors({ submit: response.message || 'Failed to create subtopic' })
      }
    } catch (error: any) {
      setErrors({ submit: error.message || 'Network error. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const getSelectedTopic = () => {
    return topics.find(topic => topic.id === formData.topic_id)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const selectedTopic = getSelectedTopic()

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/admin/subtopics">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Subtopics
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Subtopic</h1>
          <p className="text-gray-600">Add detailed lesson content with activities and assessments</p>
        </div>
      </div>

      {/* Pre-selected Topic Alert */}
      {preselectedTopicId && selectedTopic && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Creating subtopic for <strong>{selectedTopic.title}</strong> 
            ({selectedTopic.subject?.name} - {selectedTopic.subject?.term?.name})
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Basic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Topic Selection */}
              <div className="space-y-2">
                <Label htmlFor="topic_id">Topic *</Label>
                <Select 
                  value={formData.topic_id?.toString() || ''} 
                  onValueChange={(value) => handleInputChange('topic_id', parseInt(value))}
                  disabled={!!preselectedTopicId}
                >
                  <SelectTrigger className={errors.topic_id ? 'border-red-500' : ''}>
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
                {errors.topic_id && <p className="text-sm text-red-500">{errors.topic_id}</p>}
              </div>

              {/* Subtopic Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Subtopic Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Adding Simple Fractions, Plant Cell Structure"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="content">Content Description</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="Detailed explanation of what this lesson covers..."
                rows={4}
              />
            </div>

            {/* Duration and Order */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration_lessons">Duration (lessons) *</Label>
                <Input
                  id="duration_lessons"
                  type="number"
                  value={formData.duration_lessons}
                  onChange={(e) => handleInputChange('duration_lessons', parseInt(e.target.value) || 1)}
                  min="1"
                  max="20"
                  className={errors.duration_lessons ? 'border-red-500' : ''}
                />
                {errors.duration_lessons && <p className="text-sm text-red-500">{errors.duration_lessons}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => handleInputChange('display_order', parseInt(e.target.value) || 0)}
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Content */}
        <Tabs defaultValue="activities" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="activities">Activities ({formData.activities.length})</TabsTrigger>
            <TabsTrigger value="assessments">Assessments ({formData.assessment_criteria.length})</TabsTrigger>
            <TabsTrigger value="resources">Resources ({formData.resources.length})</TabsTrigger>
          </TabsList>

          {/* Activities Tab */}
          <TabsContent value="activities">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PlayCircle className="w-5 h-5" />
                  <span>Learning Activities</span>
                </CardTitle>
                <CardDescription>
                  Define activities students will do in this lesson
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.activities.map((activity, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Activity {index + 1}</Label>
                      {formData.activities.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeActivity(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Activity Title</Label>
                        <Input
                          value={activity.title}
                          onChange={(e) => handleActivityChange(index, 'title', e.target.value)}
                          placeholder="e.g., Group Discussion, Practice Problems"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={activity.type} onValueChange={(value) => handleActivityChange(index, 'type', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="individual">Individual Work</SelectItem>
                            <SelectItem value="group">Group Work</SelectItem>
                            <SelectItem value="discussion">Class Discussion</SelectItem>
                            <SelectItem value="presentation">Presentation</SelectItem>
                            <SelectItem value="practice">Practice Exercise</SelectItem>
                            <SelectItem value="experiment">Experiment/Lab</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={activity.description}
                        onChange={(e) => handleActivityChange(index, 'description', e.target.value)}
                        placeholder="Describe what students will do..."
                        rows={2}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Duration (minutes)</Label>
                      <Input
                        type="number"
                        value={activity.duration_minutes}
                        onChange={(e) => handleActivityChange(index, 'duration_minutes', parseInt(e.target.value) || 30)}
                        min="5"
                        max="180"
                        className="w-32"
                      />
                    </div>
                  </div>
                ))}

                {errors.activities && <p className="text-sm text-red-500">{errors.activities}</p>}

                <Button type="button" variant="outline" onClick={addActivity} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Activity
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assessments Tab */}
          <TabsContent value="assessments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckSquare className="w-5 h-5" />
                  <span>Assessment Criteria</span>
                </CardTitle>
                <CardDescription>
                  Define how student learning will be assessed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.assessment_criteria.map((assessment, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Assessment {index + 1}</Label>
                      {formData.assessment_criteria.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAssessment(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Assessment Title</Label>
                        <Input
                          value={assessment.title}
                          onChange={(e) => handleAssessmentChange(index, 'title', e.target.value)}
                          placeholder="e.g., Quiz, Exit Ticket, Presentation"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={assessment.type} onValueChange={(value) => handleAssessmentChange(index, 'type', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="formative">Formative</SelectItem>
                            <SelectItem value="summative">Summative</SelectItem>
                            <SelectItem value="peer">Peer Assessment</SelectItem>
                            <SelectItem value="self">Self Assessment</SelectItem>
                            <SelectItem value="project">Project</SelectItem>
                            <SelectItem value="test">Test/Quiz</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={assessment.description}
                        onChange={(e) => handleAssessmentChange(index, 'description', e.target.value)}
                        placeholder="Describe what will be assessed and how..."
                        rows={2}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Points/Weight</Label>
                      <Input
                        type="number"
                        value={assessment.points}
                        onChange={(e) => handleAssessmentChange(index, 'points', parseInt(e.target.value) || 10)}
                        min="1"
                        max="100"
                        className="w-32"
                      />
                    </div>
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={addAssessment} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Assessment
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookMarked className="w-5 h-5" />
                  <span>Learning Resources</span>
                </CardTitle>
                <CardDescription>
                  Add materials and resources for this lesson
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.resources.map((resource, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Resource {index + 1}</Label>
                      {formData.resources.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeResource(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Resource Title</Label>
                        <Input
                          value={resource.title}
                          onChange={(e) => handleResourceChange(index, 'title', e.target.value)}
                          placeholder="e.g., Textbook Chapter 5, Khan Academy Video"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={resource.type} onValueChange={(value) => handleResourceChange(index, 'type', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="document">Document/PDF</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="website">Website</SelectItem>
                            <SelectItem value="book">Book/Textbook</SelectItem>
                            <SelectItem value="worksheet">Worksheet</SelectItem>
                            <SelectItem value="software">Software/Tool</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={resource.description}
                        onChange={(e) => handleResourceChange(index, 'description', e.target.value)}
                        placeholder="Brief description of the resource..."
                        rows={2}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>URL/Location</Label>
                      <Input
                        value={resource.url}
                        onChange={(e) => handleResourceChange(index, 'url', e.target.value)}
                        placeholder="https://... or physical location"
                      />
                    </div>
                  </div>
                ))}

                <Button type="button" variant="outline" onClick={addResource} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Resource
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Preview */}
        {selectedTopic && (
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center space-x-3 mb-3">
                  <div 
                    className="w-10 h-10 rounded flex items-center justify-center text-white"
                    style={{ backgroundColor: selectedTopic.subject?.color || '#3B82F6' }}
                  >
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{formData.title || 'Subtopic Title'}</div>
                    <div className="text-sm text-gray-500">{selectedTopic.title}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {formData.duration_lessons} lessons
                  </span>
                  <span className="flex items-center">
                    <PlayCircle className="w-3 h-3 mr-1" />
                    {formData.activities.filter(a => a.title.trim()).length} activities
                  </span>
                  <span className="flex items-center">
                    <CheckSquare className="w-3 h-3 mr-1" />
                    {formData.assessment_criteria.filter(a => a.title.trim()).length} assessments
                  </span>
                  <span className="flex items-center">
                    <BookMarked className="w-3 h-3 mr-1" />
                    {formData.resources.filter(r => r.title.trim()).length} resources
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Errors */}
        {errors.submit && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.submit}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Link href="/admin/subtopics">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Subtopic
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CreateSubtopicPage