'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { formGradeApi, type FormGradeCreate, type Section } from '@/lib/api'

export default function NewFormGradePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState<FormGradeCreate>({
    name: '',
    code: '',
    description: '',
    display_order: 0,
    school_level_id: 1,
    is_active: true
  })

  // Get school level ID from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const schoolLevelId = urlParams.get('school_level_id')
    if (schoolLevelId) {
      setFormData(prev => ({
        ...prev,
        school_level_id: parseInt(schoolLevelId)
      }))
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }

    if (!formData.code.trim()) {
      toast.error('Code is required')
      return
    }

    if (!formData.school_level_id) {
      toast.error('School Level is required')
      return
    }

    try {
      setLoading(true)
      const response = await formGradeApi.create(formData)
      
      if (response.success && response.data) {
        toast.success('Grade created successfully')
        // Navigate back to the forms/grades list
        const urlParams = new URLSearchParams(window.location.search)
        const schoolLevelId = urlParams.get('school_level_id')
        if (schoolLevelId) {
          router.push(`/admin/forms-grades/?school_level_id=${schoolLevelId}`)
        } else {
          router.push('/admin/forms-grades')
        }
      } else {
        throw new Error(response.message || 'Failed to create grade')
      }
    } catch (error: any) {
      console.error('Failed to create grade:', error)
      toast.error(error.message || 'Failed to create grade')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormGradeCreate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/admin/forms-grades">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Grades
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Create New Grade
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Add a new grade to this school level
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Grade Information</CardTitle>
          <CardDescription>
            Fill in the details below to create a new grade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Grade 1, Form 1, Class 1"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                placeholder="e.g., G1, F1, C1"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional description of the grade"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            {/* Submit Button */}
            <div className="flex items-center space-x-4 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Grade
                  </>
                )}
              </Button>
              <Link href="/admin/forms-grades">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 