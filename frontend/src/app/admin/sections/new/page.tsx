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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { sectionApi, type SectionCreate, type SchoolLevel } from '@/lib/api'

export default function CreateSectionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([])
  const [formData, setFormData] = useState<SectionCreate>({
    name: '',
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

  // Load school levels for the dropdown
  useEffect(() => {
    const loadSchoolLevels = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/admin/school-levels/?include_inactive=true')
        if (response.ok) {
          const data = await response.json()
          setSchoolLevels(data.data || [])
        }
      } catch (error) {
        console.error('Failed to load school levels:', error)
        toast.error('Failed to load school levels')
      }
    }

    loadSchoolLevels()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }

    try {
      setLoading(true)
      const response = await sectionApi.create(formData)
      
      if (response.success) {
        toast.success('Section created successfully')
        router.push('/admin/sections')
      } else {
        throw new Error(response.message || 'Failed to create section')
      }
    } catch (error: any) {
      console.error('Failed to create section:', error)
      toast.error(error.message || 'Failed to create section')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof SectionCreate, value: any) => {
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
          <Link href="/admin/sections">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sections
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Create New Section
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Add a new section to organize forms/grades within a school level
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Section Information</CardTitle>
            <CardDescription>
              Fill in the details below to create a new section. Sections help organize forms/grades within school levels.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* School Level */}
              <div className="space-y-2">
                <Label htmlFor="school_level_id">School Level *</Label>
                <Select
                  value={formData.school_level_id.toString()}
                  onValueChange={(value) => handleInputChange('school_level_id', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a school level" />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolLevels.map((level) => (
                      <SelectItem key={level.id} value={level.id.toString()}>
                        {level.name} ({level.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Choose which school level this section belongs to
                </p>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Section Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Lower Primary, Upper Secondary"
                  required
                />
                <p className="text-sm text-gray-500">
                  A descriptive name for the section (e.g., "Lower Primary", "Upper Secondary")
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="e.g., Grades 1-3 for Lower Primary section"
                  rows={3}
                />
                <p className="text-sm text-gray-500">
                  Optional description explaining what this section covers
                </p>
              </div>

              {/* Display Order */}
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  min="0"
                  value={formData.display_order}
                  onChange={(e) => handleInputChange('display_order', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
                <p className="text-sm text-gray-500">
                  Order in which this section appears (lower numbers appear first)
                </p>
              </div>

              {/* Active Status */}
              <div className="space-y-2">
                <Label htmlFor="is_active">Status</Label>
                <Select
                  value={formData.is_active.toString()}
                  onValueChange={(value) => handleInputChange('is_active', value === 'true')}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Active sections are visible and can be used in the curriculum
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-4 pt-6 border-t">
                <Link href="/admin/sections">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Section
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 