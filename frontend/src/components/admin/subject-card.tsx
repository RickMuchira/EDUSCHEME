'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Copy,
  BookOpen,
  Calculator,
  Globe,
  Atom,
  Palette,
  Music,
  Trophy,
  Heart,
  Cpu,
  Languages
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Subject {
  id: number
  name: string
  code: string
  description?: string
  color: string
  icon: string
  animation_type: string
  display_order: number
  term_id: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface SubjectCardProps {
  subject: Subject
  onEdit?: (subject: Subject) => void
  onDelete?: (id: number) => void
  onView?: (subject: Subject) => void
  onDuplicate?: (subject: Subject) => void
  className?: string
}

const iconMap = {
  book: BookOpen,
  calculator: Calculator,
  globe: Globe,
  atom: Atom,
  palette: Palette,
  music: Music,
  trophy: Trophy,
  heart: Heart,
  cpu: Cpu,
  languages: Languages,
}

const animationClasses = {
  bounce: 'hover:animate-bounce',
  pulse: 'hover:animate-pulse',
  shake: 'hover:animate-shake',
  swing: 'hover:animate-swing',
  flash: 'hover:animate-flash',
  fade: 'hover:animate-fade-in',
}

export function SubjectCard({ 
  subject, 
  onEdit, 
  onDelete, 
  onView, 
  onDuplicate,
  className 
}: SubjectCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const IconComponent = iconMap[subject.icon as keyof typeof iconMap] || BookOpen
  const animationClass = animationClasses[subject.animation_type as keyof typeof animationClasses] || ''

  const handleCardClick = () => {
    if (onView) {
      onView(subject)
    }
  }

  const handleAnimationTrigger = () => {
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

  return (
    <>
      <Card 
        className={cn(
          "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 relative overflow-hidden",
          !subject.is_active && "opacity-60",
          className
        )}
        onClick={handleCardClick}
      >
        {/* Color accent bar */}
        <div 
          className="absolute top-0 left-0 right-0 h-1"
          style={{ backgroundColor: subject.color }}
        />

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {/* Subject Icon with color background */}
              <div 
                className={cn(
                  "h-12 w-12 rounded-lg flex items-center justify-center transition-all duration-300",
                  animationClass,
                  isAnimating && `subject-${subject.animation_type}`
                )}
                style={{ 
                  backgroundColor: subject.color,
                  color: getContrastColor(subject.color)
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleAnimationTrigger()
                }}
              >
                <IconComponent className="h-6 w-6" />
              </div>

              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                    {subject.name}
                  </CardTitle>
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                    style={{ 
                      backgroundColor: `${subject.color}20`,
                      color: subject.color,
                      borderColor: `${subject.color}40`
                    }}
                  >
                    {subject.code}
                  </Badge>
                </div>
                {!subject.is_active && (
                  <Badge variant="destructive" className="text-xs">
                    Inactive
                  </Badge>
                )}
              </div>
            </div>

            {/* Actions dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {onView && (
                  <DropdownMenuItem onClick={() => onView(subject)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(subject)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Subject
                  </DropdownMenuItem>
                )}
                {onDuplicate && (
                  <DropdownMenuItem onClick={() => onDuplicate(subject)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {subject.description && (
            <CardDescription className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {subject.description}
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-4">
              <span className="capitalize">
                Animation: {subject.animation_type}
              </span>
              <span>
                Order: {subject.display_order}
              </span>
            </div>
            <div className="text-right">
              <div>Created</div>
              <div>{new Date(subject.created_at).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Preview animation button */}
          <div className="mt-3 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={(e) => {
                e.stopPropagation()
                handleAnimationTrigger()
              }}
              style={{ color: subject.color }}
            >
              Preview {subject.animation_type} Animation
            </Button>
          </div>
        </CardContent>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subject</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{subject.name}"? This action cannot be undone and will also delete all associated topics and subtopics.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (onDelete) {
                  onDelete(subject.id)
                }
                setShowDeleteDialog(false)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}