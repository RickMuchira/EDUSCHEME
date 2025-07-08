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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { schoolLevelApi, type SchoolLevelCreate } from '@/lib/api'

// Validation schema
const schoolLevelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  code: z.string().min(1, 'Code is required').max(20, 'Code must be less than 20 characters'),
  display_order: z.number().min(0, 'Display order must be 0 or greater').default(0),
  school_id: z.number().min(1, 'School ID is required').default(1),
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
      school_id: 1, // Default school ID
      is_active: true,
      grade_type: 'grade',
    },
  })

  const onSubmit = async (data: SchoolLevelFormData) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      console.log('Submitting school level data:', data)

      const schoolLevelData: SchoolLevelCreate = {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        display_order: data.display_order,
        school_id: data.school_id,
        is_active: data.is_active,
        grade_type: data.grade_type,
      }

      console.log('Processed data for API:', schoolLevelData)

      const response = await schoolLevelApi.create(schoolLevelData)
      
      console.log('API response:', response)

      if (response.success) {
        toast.success('School level created successfully')
        router.push('/admin/school-levels')
        router.refresh() // Refresh to update the list
      } else {
        throw new Error(response.message || 'Failed to create school level')
      }
    } catch (error: any) {
      console.error('Failed to create school level:', error)
      
      // Handle specific error messages
      let errorMessage = 'Failed to create school level'
      
      if (error.message?.includes('already exists')) {
        errorMessage = 'A school level with this code already exists'
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check if the backend server is running.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
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
            Fill in the details for the new school level. The code will be automatically converted to uppercase.
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
                        disabled={isSubmitting}
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
                        placeholder="e.g., PRI, SEC, HIGH"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      A unique short code for the school level (automatically converted to uppercase)
                    </FormDescription>
                    <FormMessage />
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
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="grade">Grade (Grade 1, Grade 2, etc.)</SelectItem>
                        <SelectItem value="form">Form (Form 1, Form 2, etc.)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose how grades are numbered in this school level
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
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Controls the order in which school levels are displayed (0 = first)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* School ID Field */}
              <FormField
                control={form.control}
                name="school_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School ID</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      The ID of the school this level belongs to (default: 1)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Active Status Field */}
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Active
                      </FormLabel>
                      <FormDescription>
                        Whether this school level is currently active and available for use
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {/* Form Actions */}
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
                      Create School Level
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}