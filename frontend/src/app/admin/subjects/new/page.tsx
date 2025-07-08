'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { ArrowLeft, Save, Loader2, AlertCircle, Palette } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { subjectApi, termApi, type SubjectCreate, type Term } from '@/lib/api'
import { isValidId, toValidId, safeRoutes } from '@/lib/safe-links'

// Validation schema
const subjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150, 'Name must be less than 150 characters'),
  code: z.string().min(1, 'Code is required').max(20, 'Code must be less than 20 characters'),
  description: z.string().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  animation: z.string().optional(),
  display_order: z.number().min(0, 'Display order must be 0 or greater').default(0),
  term_id: z.number().min(1, 'Term ID is required'),
  is_active: z.boolean().default(true),
})

type SubjectFormData = z.infer<typeof subjectSchema>

// Color options for subjects
const colorOptions = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Green', value: '#10B981' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Gray', value: '#6B7280' },
]

export default function CreateSubjectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const termIdParam = searchParams.get('term_id')
  
  // Validate term_id parameter
  const termId = toValidId(termIdParam)
  const isValidTermId = isValidId(termId)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [term, setTerm] = useState<Term | null>(null)
  const [loadingTerm, setLoadingTerm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  console.log('New Subject Page - URL validation:', {
    termIdParam,
    termId,
    isValidTermId
  })

  const form = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      color: colorOptions[0].value,
      icon: '',
      animation: '',
      display_order: 0,
      term_id: termId || 1,
      is_active: true,
    },
  })

  // Load term information
  useEffect(() => {
    if (isValidTermId && termId) {
      loadTerm()
    } else {
      setError(
        !termIdParam 
          ? 'No term ID provided in URL'
          : `Invalid term ID: "${termIdParam}". Must be a positive integer.`
      )
    }
  }, [termIdParam, isValidTermId, termId])

  const loadTerm = async () => {
    if (!termId) return
    
    try {
      setLoadingTerm(true)
      setError(null)
      
      const response = await termApi.getById(termId)
      
      if (response.success && response.data) {
        setTerm(response.data)
        form.setValue('term_id', termId)
      } else {
        throw new Error(response.message || 'Failed to load term information')
      }
    } catch (error: any) {
      console.error('Failed to load term:', error)
      setError(`Failed to load term information: ${error.message}`)
    } finally {
      setLoadingTerm(false)
    }
  }

  const onSubmit = async (data: SubjectFormData) => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      console.log('Submitting subject data:', data)

      const subjectData: SubjectCreate = {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        description: data.description?.trim() || undefined,
        color: data.color || undefined,
        icon: data.icon || undefined,
        animation: data.animation || undefined,
        display_order: data.display_order,
        term_id: data.term_id,
        is_active: data.is_active,
      }

      console.log('Processed data for API:', subjectData)

      const response = await subjectApi.create(subjectData)
      
      console.log('API response:', response)

      if (response.success) {
        toast.success('Subject created successfully')
        
        // Navigate back to subjects list
        const backUrl = safeRoutes.subjectsForTerm(termId)
        router.push(backUrl)
        router.refresh()
      } else {
        throw new Error(response.message || 'Failed to create subject')
      }
    } catch (error: any) {
      console.error('Failed to create subject:', error)
      
      let errorMessage = 'Failed to create subject'
      
      if (error.message?.includes('already exists')) {
        errorMessage = 'A subject with this code already exists in this term'
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
    if (termId) {
      const backUrl = safeRoutes.subjectsForTerm(termId)
      router.push(backUrl)
    } else {
      router.push('/admin/subjects')
    }
  }

  // Show error if invalid term_id
  if (error || !isValidTermId) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Alert className="max-w-2xl mx-auto">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Invalid term ID provided in URL.'}
          </AlertDescription>
        </Alert>
        
        <div className="text-center mt-6 space-x-4">
          <Link href="/admin/subjects">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Subjects
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
              Create New Subject
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {loadingTerm ? (
                'Loading term information...'
              ) : term ? (
                `Add a new subject for ${term.name}`
              ) : (
                `Add a new subject for Term ${termId}`
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Term Info */}
      {term && (
        <Card className="mb-6 max-w-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  {term.code}
                </span>
              </div>
              <div>
                <h3 className="font-semibold">{term.name}</h3>
                {term.form_grade && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {term.form_grade.name}
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
          <CardTitle>Subject Information</CardTitle>
          <CardDescription>
            Fill in the details for the new subject. The code will be automatically converted to uppercase.
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
                        placeholder="e.g., Mathematics, English, Science"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      The full name of the subject
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
                        placeholder="e.g., MATH, ENG, SCI"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      A unique short code for the subject (automatically converted to uppercase)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description Field */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the subject (optional)"
                        className="min-h-[80px]"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description of what this subject covers
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Color Field */}
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a color">
                              {field.value && (
                                <div className="flex items-center space-x-2">
                                  <div 
                                    className="w-4 h-4 rounded"
                                    style={{ backgroundColor: field.value }}
                                  />
                                  <span>
                                    {colorOptions.find(c => c.value === field.value)?.name || 'Custom'}
                                  </span>
                                </div>
                              )}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {colorOptions.map((color) => (
                              <SelectItem key={color.value} value={color.value}>
                                <div className="flex items-center space-x-2">
                                  <div 
                                    className="w-4 h-4 rounded border"
                                    style={{ backgroundColor: color.value }}
                                  />
                                  <span>{color.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Color theme for this subject in the interface
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
                      Controls the order in which subjects are displayed (0 = first)
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
                        Whether this subject is currently active and available for use
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
                      Create Subject
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