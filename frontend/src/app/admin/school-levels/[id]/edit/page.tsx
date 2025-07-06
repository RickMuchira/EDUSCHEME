'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { ArrowLeft, Save, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { schoolLevelApi, type SchoolLevel, type SchoolLevelUpdate } from '@/lib/api'

// Validation schema
const schoolLevelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  code: z.string().min(1, 'Code is required').max(20, 'Code must be less than 20 characters'),
  display_order: z.number().min(0, 'Display order must be 0 or greater').default(0),
  school_id: z.number().optional(),
  is_active: z.boolean().default(true),
})

type SchoolLevelFormData = z.infer<typeof schoolLevelSchema>

export default function EditSchoolLevelPage() {
  const params = useParams()
  const router = useRouter()
  const schoolLevelId = parseInt(params.id as string)
  
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<SchoolLevelFormData>({
    resolver: zodResolver(schoolLevelSchema),
    defaultValues: {
      name: '',
      code: '',
      display_order: 0,
      is_active: true,
    },
  })

  // Load school level data
  const loadSchoolLevel = async () => {
    try {
      setLoading(true)
      const response = await schoolLevelApi.getById(schoolLevelId)
      
      if (response.success && response.data) {
        const data = response.data
        setSchoolLevel(data)
        
        // Populate form with existing data
        form.reset({
          name: data.name,
          code: data.code,
          display_order: data.display_order,
          school_id: data.school_id || undefined,
          is_active: data.is_active,
        })
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

  const onSubmit = async (data: SchoolLevelFormData) => {
    setIsSubmitting(true)
    
    try {
      const updateData: SchoolLevelUpdate = {
        name: data.name,
        code: data.code,
        display_order: data.display_order,
        school_id: data.school_id,
        is_active: data.is_active,
      }

      const response = await schoolLevelApi.update(schoolLevelId, updateData)
      
      if (response.success) {
        toast.success('School level updated successfully')
        router.push('/admin/school-levels')
      } else {
        throw new Error(response.message || 'Failed to update school level')
      }
    } catch (error: any) {
      console.error('Failed to update school level:', error)
      toast.error(error.message || 'Failed to update school level')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/school-levels')
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">Loading school level...</p>
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
              Edit School Level
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Update {schoolLevel.name} details
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>School Level Information</CardTitle>
          <CardDescription>
            Update the details for this school level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Primary School, Secondary School"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The full name of the school level
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Code Field */}
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., PS, SS, HS"
                        {...field}
                        onChange={(e) => {
                          // Convert to uppercase automatically
                          field.onChange(e.target.value.toUpperCase())
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      A short code to identify the school level (will be converted to uppercase)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Display Order Field */}
              <FormField
                control={form.control}
                name="display_order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Order in which this school level should appear (0 for first)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* School ID Field (Optional) */}
              <FormField
                control={form.control}
                name="school_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School ID (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Enter school ID if applicable"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      Associate this school level with a specific school (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Active Status */}
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Whether this school level is active and can be used
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Update
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card className="max-w-2xl mt-6">
        <CardHeader>
          <CardTitle className="text-lg">System Information</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 dark:text-gray-400">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">ID:</span> {schoolLevel.id}
            </div>
            <div>
              <span className="font-medium">Created:</span> {new Date(schoolLevel.created_at).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span> {new Date(schoolLevel.updated_at).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="max-w-2xl mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Help</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 dark:text-gray-400">
          <div className="space-y-2">
            <p><strong>Name:</strong> The full descriptive name (e.g., "Primary School", "Secondary School")</p>
            <p><strong>Code:</strong> A short identifier used in forms and reports (e.g., "PS", "SS")</p>
            <p><strong>Display Order:</strong> Controls the order in which school levels appear in lists</p>
            <p><strong>School ID:</strong> Optional field to associate with a specific school</p>
            <p><strong>Active:</strong> Uncheck to hide this school level from normal operations</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}