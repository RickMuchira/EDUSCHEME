'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { sectionApi, type Section, type SectionUpdate, type SchoolLevel } from '@/lib/api'

export default function EditSectionPage() {
  const params = useParams()
  const router = useRouter()
  const sectionId = parseInt(params.id as string)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([])
  const [section, setSection] = useState<Section | null>(null)
  const [formData, setFormData] = useState<SectionUpdate>({
    name: '',
    description: '',
    display_order: 0,
    school_level_id: 1,
    is_active: true
  })

  // Load section and school levels
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load school levels
        const schoolLevelsResponse = await fetch('http://localhost:8000/api/v1/admin/school-levels/?include_inactive=true')
        if (schoolLevelsResponse.ok) {
          const schoolLevelsData = await schoolLevelsResponse.json()
          setSchoolLevels(schoolLevelsData.data || [])
        }
        
        // Load section
        const sectionResponse = await sectionApi.getById(sectionId)
        if (sectionResponse.success && sectionResponse.data) {
          setSection(sectionResponse.data)
          setFormData({
            name: sectionResponse.data.name,
            description: sectionResponse.data.description || '',
            display_order: sectionResponse.data.display_order,
            school_level_id: sectionResponse.data.school_level_id,
            is_active: sectionResponse.data.is_active
          })
        } else {
          throw new Error(sectionResponse.message || 'Failed to load section')
        }
      } catch (error: any) {
        console.error('Failed to load data:', error)
        toast.error(error.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    if (sectionId) {
      loadData()
    }
  }, [sectionId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name?.trim()) {
      toast.error('Name is required')
      return
    }

    try {
      setSaving(true)
      const response = await sectionApi.update(sectionId, formData)
      
      if (response.success) {
        toast.success('Section updated successfully')
        router.push(`/admin/sections/${sectionId}`)
      } else {
        throw new Error(response.message || 'Failed to update section')
      }
    } catch (error: any) {
      console.error('Failed to update section:', error)
      toast.error(error.message || 'Failed to update section')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: keyof SectionUpdate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500">Loading section...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!section) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Section not found</p>
          <Link href="/admin/sections">
            <Button>Back to Sections</Button>
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
          <Link href={`/admin/sections/${sectionId}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Section
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Edit Section
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Update section information
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
              Update the details below to modify this section.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* School Level */}
              <div className="space-y-2">
                <Label htmlFor="school_level_id">School Level *</Label>
                <Select
                  value={formData.school_level_id?.toString() || ''}
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
                  value={formData.name || ''}
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
                  value={formData.display_order || 0}
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
                  value={formData.is_active?.toString() || 'true'}
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
                <Link href={`/admin/sections/${sectionId}`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
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