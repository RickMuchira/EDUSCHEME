'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { termApi, formGradeApi, type TermCreate, type FormGrade } from '@/lib/api'
import { isValidId, toValidId, safeRoutes } from '@/lib/safe-links'

// Validation schema
const termSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  code: z.string().min(1, 'Code is required').max(20, 'Code must be less than 20 characters'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  display_order: z.number().min(0, 'Display order must be 0 or greater').default(0),
  form_grade_id: z.number().min(1, 'Form/Grade ID is required'),
  is_active: z.boolean().default(true),
})

type TermFormData = z.infer<typeof termSchema>

export default function CreateTermPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const formGradeIdParam = searchParams.get('form_grade_id')
  
  // Validate form_grade_id parameter
  const formGradeId = toValidId(formGradeIdParam)
  const isValidFormGradeId = isValidId(formGradeId)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formGrade, setFormGrade] = useState<FormGrade | null>(null)
  const [loadingFormGrade, setLoadingFormGrade] = useState(false)
  const [error, setError] = useState<string | null>(null)

  console.log('New Term Page - URL validation:', {
    formGradeIdParam,
    formGradeId,
    isValidFormGradeId
  })

  const form = useForm<TermFormData>({
    resolver: zodResolver(termSchema),
    defaultValues: {
      name: '',
      code: '',
      start_date: '',
      end_date: '',
      display_order: 0,
      form_grade_id: formGradeId || 1,
      is_active: true,
    },
  })

  // Load form/grade information
  useEffect(() => {
    if (isValidFormGradeId && formGradeId) {
      loadFormGrade()
    } else {
      setError(
        !formGradeIdParam 
          ? 'No form/grade ID provided in URL'
          : `Invalid form/grade ID: "${formGradeIdParam}". Must be a positive integer.`
      )
    }
  }, [formGradeIdParam, isValidFormGradeId, formGradeId])

  const loadFormGrade = async () => {
    if (!formGradeId) return
    
    try {
      setLoadingFormGrade(true)
      setError(null)
      
      const response = await formGradeApi.getById(formGradeId)
      
      if (response.success && response.data) {
        setFormGrade(response.data)
        // Update form with the correct form_grade_id
        form.setValue('form_grade_id', formGradeId)
      } else {
        throw new Error(response.message || 'Failed to load form/grade information')
      }
    } catch (error: any) {
      console.error('Failed to load form/grade:', error)
      setError(`Failed to load form/grade information: ${error.message}`)
    } finally {
      setLoadingFormGrade(false)
    }
  }

  const onSubmit = async (data: TermFormData) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      console.log('Submitting term data:', data)

      const termData: TermCreate = {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        start_date: data.start_date || undefined,
        end_date: data.end_date || undefined,
        display_order: data.display_order,
        form_grade_id: data.form_grade_id,
        is_active: data.is_active,
      }

      console.log('Processed data for API:', termData)

      const response = await termApi.create(termData)
      
      console.log('API response:', response)

      if (response.success) {
        toast.success('Term created successfully')
        
        // Navigate back to terms list with safe URL
        const backUrl = safeRoutes.termsForFormGrade(formGradeId)
        router.push(backUrl)
        router.refresh()
      } else {
        throw new Error(response.message || 'Failed to create term')
      }
    } catch (error: any) {
      console.error('Failed to create term:', error)
      
      let errorMessage = 'Failed to create term'
      
      if (error.message?.includes('already exists')) {
        errorMessage = 'A term with this code already exists'
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
    if (formGradeId) {
      const backUrl = safeRoutes.termsForFormGrade(formGradeId)
      router.push(backUrl)
    } else {
      router.push('/admin/forms-grades')
    }
  }

  // Show error if invalid form_grade_id
  if (error || !isValidFormGradeId) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Alert className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Invalid form/grade ID provided in URL.'}
          </AlertDescription>
        </Alert>
        
        <div className="text-center mt-6 space-x-4">
          <Link href="/admin/forms-grades">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Forms/Grades
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleCancel}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Term
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {loadingFormGrade ? (
                'Loading form/grade information...'
              ) : formGrade ? (
                `Add a new term for ${formGrade.name}`
              ) : (
                `Add a new term for Form/Grade ${formGradeId}`
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Form Grade Info */}
      {formGrade && (
        <Card className="mb-6 max-w-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  {formGrade.code}
                </span>
              </div>
              <div>
                <h3 className="font-semibold">{formGrade.name}</h3>
                {formGrade.school_level && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formGrade.school_level.name}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Card */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Term Information</CardTitle>
          <CardDescription>
            Fill in the details for the new term. The code will be automatically converted to uppercase.
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
                        placeholder="e.g., Term 1, First Term, Spring Semester"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      The full name of the term
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
                        placeholder="e.g., T1, TERM1, SPR"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      A unique short code for the term (automatically converted to uppercase)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        When the term begins (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        When the term ends (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                      Controls the order in which terms are displayed (0 = first)
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
                        Whether this term is currently active and available for use
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
                      Create Term
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