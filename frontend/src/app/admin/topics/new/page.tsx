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
import { 
  ArrowLeft, 
  Save, 
  BookOpen,
  Target,
  Clock,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2
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

const CreateTopicPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedSubjectId = searchParams.get('subject_id')

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    learning_objectives: [''],
    duration_weeks: 1,
    display_order: 0,
    subject_id: preselectedSubjectId ? parseInt(preselectedSubjectId) : null as number | null,
    is_active: true
  })

  useEffect(() => {
    fetchSubjects()
  }, [])

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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...formData.learning_objectives]
    newObjectives[index] = value
    setFormData(prev => ({ ...prev, learning_objectives: newObjectives }))
  }

  const addObjective = () => {
    setFormData(prev => ({
      ...prev,
      learning_objectives: [...prev.learning_objectives, '']
    }))
  }

  const removeObjective = (index: number) => {
    if (formData.learning_objectives.length > 1) {
      const newObjectives = formData.learning_objectives.filter((_, i) => i !== index)
      setFormData(prev => ({ ...prev, learning_objectives: newObjectives }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) newErrors.title = 'Topic title is required'
    if (!formData.subject_id) newErrors.subject_id = 'Please select a subject'
    if (formData.duration_weeks < 1) newErrors.duration_weeks = 'Duration must be at least 1 week'
    
    // Check if at least one objective has content
    const hasValidObjective = formData.learning_objectives.some(obj => obj.trim().length > 0)
    if (!hasValidObjective) {
      newErrors.learning_objectives = 'At least one learning objective is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setSaving(true)
    try {
      // Filter out empty objectives
      const cleanedData = {
        ...formData,
        learning_objectives: formData.learning_objectives.filter(obj => obj.trim().length > 0)
      }

      const response = await topicApi.create(cleanedData)
      if (response.success) {
        router.push('/admin/topics')
      } else {
        setErrors({ submit: response.message || 'Failed to create topic' })
      }
    } catch (error: any) {
      setErrors({ submit: error.message || 'Network error. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const getSelectedSubject = () => {
    return subjects.find(subject => subject.id === formData.subject_id)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const selectedSubject = getSelectedSubject()

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/admin/topics">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Topics
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Topic</h1>
          <p className="text-gray-600">Add a curriculum topic with learning objectives</p>
        </div>
      </div>

      {/* Pre-selected Subject Alert */}
      {preselectedSubjectId && selectedSubject && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Creating topic for <strong>{selectedSubject.name}</strong> 
            ({selectedSubject.term?.name} - {selectedSubject.term?.form_grade?.name})
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Subject Selection */}
                <div className="space-y-2">
                  <Label htmlFor="subject_id">Subject *</Label>
                  <Select 
                    value={formData.subject_id?.toString() || ''} 
                    onValueChange={(value) => handleInputChange('subject_id', parseInt(value))}
                    disabled={!!preselectedSubjectId}
                  >
                    <SelectTrigger className={errors.subject_id ? 'border-red-500' : ''}>
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
                  {errors.subject_id && <p className="text-sm text-red-500">{errors.subject_id}</p>}
                </div>

                {/* Topic Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Topic Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Fractions and Decimals, Photosynthesis"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of what this topic covers..."
                    rows={3}
                  />
                </div>

                {/* Duration and Order */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration_weeks">Duration (weeks) *</Label>
                    <Input
                      id="duration_weeks"
                      type="number"
                      value={formData.duration_weeks}
                      onChange={(e) => handleInputChange('duration_weeks', parseInt(e.target.value) || 1)}
                      min="1"
                      max="52"
                      className={errors.duration_weeks ? 'border-red-500' : ''}
                    />
                    {errors.duration_weeks && <p className="text-sm text-red-500">{errors.duration_weeks}</p>}
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
                    <p className="text-sm text-gray-500">Lower numbers appear first</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Learning Objectives */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Learning Objectives</span>
                </CardTitle>
                <CardDescription>
                  Define what students should learn from this topic
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {formData.learning_objectives.map((objective, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`objective-${index}`}>
                        Objective {index + 1}
                        {index === 0 && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {formData.learning_objectives.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeObjective(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <Textarea
                      id={`objective-${index}`}
                      value={objective}
                      onChange={(e) => handleObjectiveChange(index, e.target.value)}
                      placeholder="Students will be able to..."
                      rows={2}
                      className={errors.learning_objectives && index === 0 && !objective.trim() ? 'border-red-500' : ''}
                    />
                  </div>
                ))}

                {errors.learning_objectives && (
                  <p className="text-sm text-red-500">{errors.learning_objectives}</p>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addObjective}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Objective
                </Button>

                {/* Preview */}
                {selectedSubject && (
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center space-x-3 mb-3">
                        <div 
                          className="w-8 h-8 rounded flex items-center justify-center text-white"
                          style={{ backgroundColor: selectedSubject.color }}
                        >
                          <Target className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold">{formData.title || 'Topic Title'}</div>
                          <div className="text-sm text-gray-500">{selectedSubject.name}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {formData.duration_weeks} weeks
                        </span>
                        <span className="flex items-center">
                          <Target className="w-3 h-3 mr-1" />
                          {formData.learning_objectives.filter(obj => obj.trim()).length} objectives
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Errors */}
        {errors.submit && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.submit}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t">
          <Link href="/admin/topics">
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
                Create Topic
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CreateTopicPage