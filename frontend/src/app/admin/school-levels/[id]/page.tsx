'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Edit, Trash2, Calendar, Hash, Building, Eye, EyeOff, RefreshCw } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { schoolLevelApi, type SchoolLevel } from '@/lib/api'

export default function SchoolLevelDetailPage() {
  const params = useParams()
  const router = useRouter()
  const schoolLevelId = parseInt(params.id as string)
  
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel | null>(null)
  const [loading, setLoading] = useState(true)

  // Load school level details
  const loadSchoolLevel = async () => {
    try {
      setLoading(true)
      const response = await schoolLevelApi.getById(schoolLevelId)
      
      if (response.success && response.data) {
        setSchoolLevel(response.data)
      } else {
        throw new Error(response.message || 'Failed to load school level')
      }
    } catch (error: any) {
      console.error('Failed to load school level:', error)
      toast.error(error.message || 'Failed to load school level')
      router.push('/admin/school-levels')
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    if (schoolLevelId) {
      loadSchoolLevel()
    }
  }, [schoolLevelId])

  // Handle delete
  const handleDelete = async () => {
    if (!schoolLevel) return
    
    if (!confirm(`Are you sure you want to delete "${schoolLevel.name}"?`)) {
      return
    }

    try {
      const response = await schoolLevelApi.delete(schoolLevel.id)
      
      if (response.success) {
        toast.success('School level deleted successfully')
        router.push('/admin/school-levels')
      } else {
        throw new Error(response.message || 'Failed to delete school level')
      }
    } catch (error: any) {
      console.error('Failed to delete school level:', error)
      toast.error(error.message || 'Failed to delete school level')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Loading school level details...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!schoolLevel) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">School level not found</p>
              <Link href="/admin/school-levels">
                <Button variant="outline">Back to School Levels</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/admin/school-levels">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {schoolLevel.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              School Level Details
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadSchoolLevel}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Link href={`/admin/school-levels/${schoolLevel.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 mr-2 text-blue-600" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Core details about this school level
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name */}
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <div className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                  {schoolLevel.name}
                </div>
              </div>

              <Separator />

              {/* Code */}
              <div>
                <label className="text-sm font-medium text-gray-500">Code</label>
                <div className="mt-1 flex items-center space-x-2">
                  <Hash className="h-4 w-4 text-gray-400" />
                  <span className="font-mono font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {schoolLevel.code}
                  </span>
                </div>
              </div>

              <Separator />

              {/* Display Order */}
              <div>
                <label className="text-sm font-medium text-gray-500">Display Order</label>
                <div className="mt-1 text-base font-medium text-gray-900 dark:text-white">
                  {schoolLevel.display_order}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Order in which this school level appears in lists
                </p>
              </div>

              <Separator />

              {/* School ID */}
              <div>
                <label className="text-sm font-medium text-gray-500">School ID</label>
                <div className="mt-1 text-base font-medium text-gray-900 dark:text-white">
                  {schoolLevel.school_id || 'Not specified'}
                </div>
                {schoolLevel.school_id && (
                  <p className="text-xs text-gray-500 mt-1">
                    Associated school identifier
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timestamps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-green-600" />
                Timeline
              </CardTitle>
              <CardDescription>
                Creation and modification history
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <div className="mt-1 text-base text-gray-900 dark:text-white">
                    {new Date(schoolLevel.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(schoolLevel.created_at).toLocaleTimeString()}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <div className="mt-1 text-base text-gray-900 dark:text-white">
                    {new Date(schoolLevel.updated_at).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(schoolLevel.updated_at).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {schoolLevel.is_active ? (
                  <>
                    <Eye className="h-4 w-4 text-green-600" />
                    <Badge variant="default" className="bg-green-100 text-green-700">
                      Active
                    </Badge>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4 text-gray-600" />
                    <Badge variant="secondary">
                      Inactive
                    </Badge>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {schoolLevel.is_active 
                  ? 'This school level is currently active and visible in the system'
                  : 'This school level is inactive and hidden from normal operations'
                }
              </p>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href={`/admin/school-levels/${schoolLevel.id}/edit`} className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit School Level
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                onClick={handleDelete}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete School Level
              </Button>
              
              <Separator />
              
              <Link href="/admin/school-levels" className="block">
                <Button variant="ghost" className="w-full justify-start">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to List
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-gray-500 space-y-1">
                <div>ID: {schoolLevel.id}</div>
                <div>Type: School Level</div>
                <div>Created: {new Date(schoolLevel.created_at).toISOString()}</div>
                <div>Modified: {new Date(schoolLevel.updated_at).toISOString()}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 