'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  BookOpen,
  Calculator,
  Globe,
  Atom,
  Palette,
  Music,
  Trophy,
  Heart,
  Cpu,
  Languages,
  Sparkles
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const subjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required').max(150, 'Name must be less than 150 characters'),
  code: z.string().min(1, 'Subject code is required').max(20, 'Code must be less than 20 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color'),
  icon: z.string().min(1, 'Please select an icon'),
  animation_type: z.string().min(1, 'Please select an animation'),
  display_order: z.number().min(0, 'Display order must be 0 or greater'),
  term_id: z.number().min(1, 'Please select a term'),
})

type SubjectFormData = z.infer<typeof subjectSchema>

interface SubjectFormProps {
  initialData?: Partial<SubjectFormData>
  termId?: number
  onSubmit: (data: SubjectFormData) => void
  onCancel?: () => void
  isLoading?: boolean
  className?: string
}

const predefinedColors = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Green', value: '#10B981' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Yellow', value: '#F59E0B' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Teal', value: '#14B8A6' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Cyan', value: '#06B6D4' },
]

const iconOptions = [
  { name: 'Book', value: 'book', icon: BookOpen },
  { name: 'Calculator', value: 'calculator', icon: Calculator },
  { name: 'Globe', value: 'globe', icon: Globe },
  { name: 'Atom', value: 'atom', icon: Atom },
  { name: 'Palette', value: 'palette', icon: Palette },
  { name: 'Music', value: 'music', icon: Music },
  { name: 'Trophy', value: 'trophy', icon: Trophy },
  { name: 'Heart', value: 'heart', icon: Heart },
  { name: 'CPU', value: 'cpu', icon: Cpu },
  { name: 'Languages', value: 'languages', icon: Languages },
]

const animationOptions = [
  { name: 'Bounce', value: 'bounce', description: 'Gentle bouncing motion' },
  { name: 'Pulse', value: 'pulse', description: 'Soft pulsing effect' },
  { name: 'Shake', value: 'shake', description: 'Quick shaking motion' },
  { name: 'Swing', value: 'swing', description: 'Pendulum-like swing' },
  { name: 'Flash', value: 'flash', description: 'Flashing visibility' },
  { name: 'Fade', value: 'fade', description: 'Gentle fade transition' },
]

export function SubjectForm({ 
  initialData, 
  termId, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  className 
}: SubjectFormProps) {
  const [selectedColor, setSelectedColor] = useState(initialData?.color || predefinedColors[0].value)
  const [selectedIcon, setSelectedIcon] = useState(initialData?.icon || iconOptions[0].value)
  const [selectedAnimation, setSelectedAnimation] = useState(initialData?.animation_type || animationOptions[0].value)
  const [isAnimating, setIsAnimating] = useState(false)

  const form = useForm<SubjectFormData>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: initialData?.name || '',
      code: initialData?.code || '',
      description: initialData?.description || '',
      color: selectedColor,
      icon: selectedIcon,
      animation_type: selectedAnimation,
      display_order: initialData?.display_order || 0,
      term_id: termId || initialData?.term_id || 0,
    },
  })

  // Update form when selections change
  useEffect(() => {
    form.setValue('color', selectedColor)
  }, [selectedColor, form])

  useEffect(() => {
    form.setValue('icon', selectedIcon)
  }, [selectedIcon, form])

  useEffect(() => {
    form.setValue('animation_type', selectedAnimation)
  }, [selectedAnimation, form])

  const handleSubmit = (data: SubjectFormData) => {
    onSubmit(data)
  }

  const previewAnimation = () => {
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 1000)
  }

  const getContrastColor = (hexColor: string) => {
    const r = parseInt(hexColor.slice(1, 3), 16)
    const g = parseInt(hexColor.slice(3, 5), 16)
    const b = parseInt(hexColor.slice(5, 7), 16)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000
    return brightness > 128 ? '#000000' : '#ffffff'
  }

  const SelectedIcon = iconOptions.find(option => option.value === selectedIcon)?.icon || BookOpen

  return (
    <Card className={cn("w-full max-w-2xl mx-auto", className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BookOpen className="h-5 w-5" />
          <span>{initialData ? 'Edit Subject' : 'Create New Subject'}</span>
        </CardTitle>
        <CardDescription>
          {initialData 
            ? 'Update the subject details, customization, and visual settings.'
            : 'Add a new subject with custom colors, icons, and animations to make it engaging.'
          }
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Preview Card */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Label className="text-sm font-medium mb-3 block">Preview</Label>
              <div className="flex items-center space-x-4">
                <div 
                  className={cn(
                    "h-16 w-16 rounded-lg flex items-center justify-center transition-all duration-300 cursor-pointer",
                    isAnimating && `subject-${selectedAnimation}`
                  )}
                  style={{ 
                    backgroundColor: selectedColor,
                    color: getContrastColor(selectedColor)
                  }}
                  onClick={previewAnimation}
                >
                  <SelectedIcon className="h-8 w-8" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {form.watch('name') || 'Subject Name'}
                  </div>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {form.watch('code') || 'CODE'}
                  </Badge>
                  <div className="text-xs text-gray-500 mt-1">
                    Animation: {selectedAnimation}
                  </div>
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={previewAnimation}
                  className="ml-auto"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Test Animation
                </Button>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Mathematics" 
                        {...field} 
                        className="focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., MATH" 
                        {...field}
                        className="focus:border-blue-500"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormDescription>
                      Short code for the subject (will be converted to uppercase)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the subject..."
                      className="resize-none focus:border-blue-500"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Visual Customization */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Visual Customization</Label>
              
              {/* Color Selection */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Subject Color</Label>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {predefinedColors.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={cn(
                        "h-10 w-10 rounded-lg border-2 transition-all duration-200 hover:scale-110",
                        selectedColor === color.value 
                          ? "border-gray-900 dark:border-white shadow-lg" 
                          : "border-gray-300 dark:border-gray-600"
                      )}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setSelectedColor(color.value)}
                      title={color.name}
                    />
                  ))}
                </div>
                <div className="mt-2">
                  <Input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-20 h-10 border-0 p-1 cursor-pointer"
                  />
                </div>
              </div>

              {/* Icon Selection */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Subject Icon</Label>
                <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                  {iconOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={cn(
                        "h-12 w-12 rounded-lg border-2 transition-all duration-200 hover:scale-110 flex items-center justify-center",
                        selectedIcon === option.value 
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" 
                          : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                      )}
                      onClick={() => setSelectedIcon(option.value)}
                      title={option.name}
                    >
                      <option.icon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Animation Selection */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Animation Type</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {animationOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all duration-200 text-left",
                        selectedAnimation === option.value 
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20" 
                          : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                      )}
                      onClick={() => setSelectedAnimation(option.value)}
                    >
                      <div className="font-medium text-sm">{option.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

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
                      className="focus:border-blue-500"
                    />
                  </FormControl>
                  <FormDescription>
                    Lower numbers appear first in lists
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="spinner mr-2" />
                    {initialData ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  initialData ? 'Update Subject' : 'Create Subject'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}