'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { schoolLevelApi, type SchoolLevelCreate } from '@/lib/api'

// Validation schema
const schoolLevelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  code: z.string().min(1, 'Code is required').max(20, 'Code must be less than 20 characters'),
  display_order: z.number().min(0, 'Display order must be 0 or greater').default(0),
  school_id: z.number().optional(),
  is_active: z.boolean().default(true),
  grade_type: z.enum(['form', 'grade']).default('grade'),
})

type SchoolLevelFormData = z.infer<typeof schoolLevelSchema>

export default function CreateSchoolLevelPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<SchoolLevelFormData>({
    resolver: zodResolver(schoolLevelSchema),
    defaultValues: {
      name: '',
      code: '',
      display_order: 0,
      is_active: true,
      grade_type: 'grade',
    },
  })

  const onSubmit = async (data: SchoolLevelFormData) => {
    setIsSubmitting(true)
    
    try {
      const schoolLevelData: SchoolLevelCreate = {
        name: data.name,
        code: data.code,
        display_order: data.display_order,
        school_id: data.school_id || 1, // Default to school_id 1 if not provided
        is_active: data.is_active,
        grade_type: data.grade_type,
      }

      const response = await schoolLevelApi.create(schoolLevelData)
      
      if (response.success) {
        toast.success('School level created successfully')
        router.push('/admin/school-levels')
      } else {
        throw new Error(response.message || 'Failed to create school level')
      }
    } catch (error: any) {
      console.error('Failed to create school level:', error)
      toast.error(error.message || 'Failed to create school level')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin/school-levels')
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
              Create School Level
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Add a new school level (Primary, Secondary, High School, etc.)
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>School Level Information</CardTitle>
          <CardDescription>
            Fill in the details for the new school level
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

              {/* Grade Type Field */}
              <FormField
                control={form.control}
                name="grade_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade Type *</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="border rounded px-3 py-2 w-full"
                      >
                        <option value="grade">Grade (e.g., Grade 1, Grade 2)</option>
                        <option value="form">Form (e.g., Form 1, Form 2)</option>
                      </select>
                    </FormControl>
                    <FormDescription>
                      Choose whether this school level uses Grades or Forms
                    </FormDescription>
                    <FormMessage />
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
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Create
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}