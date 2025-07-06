'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, Plus, RefreshCw, School, Users, Calendar, BookOpen } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { sectionApi, type Section, type FormGrade } from '@/lib/api'
import { DeleteDialog } from '@/components/ui/delete-dialog'

export default function SectionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const sectionId = parseInt(params.id as string)
  
  const [section, setSection] = useState<Section | null>(null)
  const [formsGrades, setFormsGrades] = useState<FormGrade[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Load section data
  const loadSectionData = async () => {
    try {
      setLoading(true)
      
      // Load section with hierarchy
      const sectionResponse = await sectionApi.getById(sectionId, true)
      if (sectionResponse.success && sectionResponse.data) {
        setSection(sectionResponse.data)
      } else {
        throw new Error(sectionResponse.message || 'Failed to load section')
      }
      
      // Load forms/grades for this section
      const formsResponse = await fetch(`http://localhost:8000/api/v1/admin/forms-grades/?section_id=${sectionId}`)
      if (formsResponse.ok) {
        const formsData = await formsResponse.json()
        setFormsGrades(formsData.data || [])
      }
      
    } catch (error: any) {
      console.error('Failed to load section data:', error)
      toast.error(error.message || 'Failed to load section data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (sectionId) {
      loadSectionData()
    }
  }, [sectionId])

  // Handle delete
  const handleDelete = () => {
    if (section) {
      setDeleteDialogOpen(true)
    }
  }

  // Handle delete confirmation
  const handleDeleteConfirm = async (hardDelete: boolean) => {
    if (!section) return

    try {
      setDeleteLoading(true)
      const response = await sectionApi.delete(section.id, hardDelete)
      
      if (response.success) {
        toast.success(`Section ${hardDelete ? 'permanently deleted' : 'deleted'} successfully`)
        router.push('/admin/sections')
      } else {
        throw new Error(response.message || 'Failed to delete section')
      }
    } catch (error: any) {
      console.error('Failed to delete section:', error)
      toast.error(error.message || 'Failed to delete section')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
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
          <Link href="/admin/sections">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sections
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {section.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Section Details
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadSectionData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Link href={`/admin/sections/${section.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Section Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Section Information</CardTitle>
                <Badge variant={section.is_active ? 'default' : 'secondary'}>
                  {section.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <CardDescription>
                Basic information about this section
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Name</Label>
                  <p className="text-lg font-semibold">{section.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Display Order</Label>
                  <p className="text-lg">{section.display_order}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">School Level</Label>
                  <div className="flex items-center space-x-2">
                    <School className="h-4 w-4 text-gray-400" />
                    <span className="text-lg">{section.school_level?.name || `ID: ${section.school_level_id}`}</span>
                  </div>
                </div>
              </div>
              
              {section.description && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Description</Label>
                  <p className="text-gray-700 mt-1">{section.description}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <span>Created:</span>
                  <div>{new Date(section.created_at).toLocaleDateString()}</div>
                </div>
                <div>
                  <span>Updated:</span>
                  <div>{new Date(section.updated_at).toLocaleDateString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-500">Forms/Grades</p>
                  <p className="text-2xl font-bold">{formsGrades.length}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-gray-500">Active Forms</p>
                  <p className="text-2xl font-bold">
                    {formsGrades.filter(fg => fg.is_active).length}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <BookOpen className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-500">Total Terms</p>
                  <p className="text-2xl font-bold">
                    {formsGrades.reduce((total, fg) => total + (fg.terms?.length || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Forms/Grades */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Forms/Grades</CardTitle>
              <CardDescription>
                Forms and grades within this section
              </CardDescription>
            </div>
            <Link href={`/admin/forms-grades/new?section_id=${section.id}`}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Form/Grade
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {formsGrades.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No forms/grades found in this section</p>
              <Link href={`/admin/forms-grades/new?section_id=${section.id}`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Form/Grade
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {formsGrades.map((formGrade) => (
                <Card key={formGrade.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{formGrade.name}</h3>
                      <Badge variant={formGrade.is_active ? 'default' : 'secondary'} className="text-xs">
                        {formGrade.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Code: {formGrade.code}</p>
                    <p className="text-xs text-gray-500">
                      Order: {formGrade.display_order}
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <Link href={`/admin/forms-grades/${formGrade.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/admin/forms-grades/${formGrade.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Section"
        itemName={section.name}
        itemType="section"
        isActive={section.is_active}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        showSoftDeleteOption={true}
      />
    </div>
  )
} 