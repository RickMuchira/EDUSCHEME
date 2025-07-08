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
import { 
  ArrowLeft, 
  Save, 
  Palette, 
  Sparkles, 
  Calendar,
  GraduationCap,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import Link from 'next/link'
import { termApi, subjectApi } from '@/lib/api'

interface Term {
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
  is_active: boolean
}

interface SubjectOptions {
  colors: Array<{ name: string; value: string }>
  icons: Array<{ name: string; value: string }>
  animations: Array<{ name: string; value: string }>
}

const CreateSubjectPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedTermId = searchParams.get('term_id')

  const [terms, setTerms] = useState<Term[]>([])
  const [subjectOptions, setSubjectOptions] = useState<SubjectOptions | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    color: '#3B82F6',
    icon: 'book',
    animation_type: 'bounce',
    display_order: 0,
    term_id: preselectedTermId ? parseInt(preselectedTermId) : null as number | null,
    is_active: true
  })

  useEffect(() => {
    fetchTerms()
    fetchSubjectOptions()
  }, [])

  const fetchTerms = async () => {
    try {
      const response = await termApi.getAll()
      setTerms(response.data || [])
    } catch (error) {
      console.error('Error fetching terms:', error)
    }
  }

  const fetchSubjectOptions = async () => {
    try {
      const response = await subjectApi.getOptions()
      setSubjectOptions(response.data)
    } catch (error) {
      console.error('Error fetching subject options:', error)
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Subject name is required'
    if (!formData.code.trim()) newErrors.code = 'Subject code is required'
    if (!formData.term_id) newErrors.term_id = 'Please select a term'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setSaving(true)
    try {
      // Ensure term_id is not null before creating
      if (!formData.term_id) {
        setErrors({ submit: 'Please select a term' })
        return
      }

      const response = await subjectApi.create({
        ...formData,
        term_id: formData.term_id
      })
      if (response.success) {
        router.push('/admin/subjects')
      } else {
        setErrors({ submit: response.message || 'Failed to create subject' })
      }
    } catch (error: any) {
      setErrors({ submit: error.message || 'Network error. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const getSelectedTerm = () => {
    return terms.find(term => term.id === formData.term_id)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const selectedTerm = getSelectedTerm()

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/admin/subjects">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Subjects
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Subject</h1>
          <p className="text-gray-600">Add a subject with colors and animations for better UX</p>
        </div>
      </div>

      {/* Pre-selected Term Alert */}
      {preselectedTermId && selectedTerm && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Creating subject for <strong>{selectedTerm.name}</strong> 
            ({selectedTerm.form_grade?.name} - {selectedTerm.form_grade?.school_level?.name})
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
                  <GraduationCap className="w-5 h-5" />
                  <span>Basic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Term Selection */}
                <div className="space-y-2">
                  <Label htmlFor="term_id">Term *</Label>
                  <Select 
                    value={formData.term_id?.toString() || ''} 
                    onValueChange={(value) => handleInputChange('term_id', parseInt(value))}
                    disabled={!!preselectedTermId}
                  >
                    <SelectTrigger className={errors.term_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select a term..." />
                    </SelectTrigger>
                    <SelectContent>
                      {terms.map((term) => (
                        <SelectItem key={term.id} value={term.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{term.name} ({term.code})</span>
                            <span className="text-sm text-gray-500">
                              {term.form_grade?.name} - {term.form_grade?.school_level?.name}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.term_id && <p className="text-sm text-red-500">{errors.term_id}</p>}
                </div>

                {/* Subject Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Subject Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Mathematics, English Language"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>

                {/* Subject Code */}
                <div className="space-y-2">
                  <Label htmlFor="code">Subject Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                    placeholder="e.g., MATH, ENG"
                    maxLength={20}
                    className={errors.code ? 'border-red-500' : ''}
                  />
                  {errors.code && <p className="text-sm text-red-500">{errors.code}</p>}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description of the subject..."
                    rows={3}
                  />
                </div>

                {/* Display Order */}
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
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Styling */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="w-5 h-5" />
                  <span>Visual Styling</span>
                </CardTitle>
                <CardDescription>
                  Customize the appearance of your subject
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Color Selection */}
                <div className="space-y-2">
                  <Label>Subject Color</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {subjectOptions?.colors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => handleInputChange('color', color.value)}
                        className={`w-12 h-12 rounded-lg border-2 transition-all ${
                          formData.color === color.value 
                            ? 'border-gray-900 scale-110' 
                            : 'border-gray-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">Selected: {formData.color}</p>
                </div>

                {/* Icon Selection */}
                <div className="space-y-2">
                  <Label htmlFor="icon">Icon</Label>
                  <Select value={formData.icon} onValueChange={(value) => handleInputChange('icon', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectOptions?.icons.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          {icon.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Animation Selection */}
                <div className="space-y-2">
                  <Label htmlFor="animation_type">Animation</Label>
                  <Select value={formData.animation_type} onValueChange={(value) => handleInputChange('animation_type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {subjectOptions?.animations.map((animation) => (
                        <SelectItem key={animation.value} value={animation.value}>
                          {animation.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl font-bold"
                        style={{ backgroundColor: formData.color }}
                      >
                        {formData.code.slice(0, 2) || 'SU'}
                      </div>
                      <div>
                        <div className="font-semibold">{formData.name || 'Subject Name'}</div>
                        <div className="text-sm text-gray-500">{formData.code || 'CODE'}</div>
                      </div>
                    </div>
                  </div>
                </div>
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
          <Link href="/admin/subjects">
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
                Create Subject
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default CreateSubjectPage