"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { formGradeApi, type FormGrade, type FormGradeUpdate } from '@/lib/api'

export default function EditGradePage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id ? Number(params.id) : null
  const [grade, setGrade] = useState<FormGrade | null>(null)
  const [formData, setFormData] = useState<FormGradeUpdate>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchGrade = async () => {
      if (!id) return
      setLoading(true)
      const response = await formGradeApi.getById(id)
      if (response.success && response.data) {
        setGrade(response.data)
        setFormData({
          name: response.data.name,
          code: response.data.code,
          description: response.data.description,
          display_order: response.data.display_order,
          is_active: response.data.is_active,
        })
      } else {
        toast.error(response.message || 'Failed to load grade')
      }
      setLoading(false)
    }
    fetchGrade()
  }, [id])

  const handleInputChange = (field: keyof FormGradeUpdate, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    if (!formData.name?.trim()) {
      toast.error('Name is required')
      return
    }
    if (!formData.code?.trim()) {
      toast.error('Code is required')
      return
    }
    try {
      setSaving(true)
      const response = await formGradeApi.update(id, formData)
      if (response.success && response.data) {
        toast.success('Grade updated successfully')
        router.push(`/admin/forms-grades/${id}`)
      } else {
        throw new Error(response.message || 'Failed to update grade')
      }
    } catch (error: any) {
      console.error('Failed to update grade:', error)
      toast.error(error.message || 'Failed to update grade')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mb-4" />
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading grade...</p>
      </div>
    )
  }

  if (!grade) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <p className="text-lg text-red-600 dark:text-red-400 font-semibold">Grade not found.</p>
        <Link href="/admin/forms-grades">
          <Button variant="outline" className="mt-4">Back to Grades</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="flex items-center space-x-4 mb-8">
        <Link href={`/admin/forms-grades/${id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Grade
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Edit {grade.name}
        </h1>
      </div>
      <Card className="w-full shadow-lg border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl">Edit Grade</CardTitle>
          <CardDescription className="text-gray-500">Update the details for this grade</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>
            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code || ''}
                onChange={(e) => handleInputChange('code', e.target.value)}
                required
              />
            </div>
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>
            {/* Display Order */}
            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order ?? 0}
                onChange={(e) => handleInputChange('display_order', parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active ?? true}
                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
            {/* Submit Button */}
            <div className="flex items-center space-x-4 pt-4">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
              <Link href={`/admin/forms-grades/${id}`}>
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