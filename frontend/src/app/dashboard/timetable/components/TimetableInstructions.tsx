"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Info,
  BookOpen,
  Calendar,
  CheckCircle2,
  MousePointer,
  Target,
  X,
  Sparkles,
  Clock,
  Moon,
  ChevronRight
} from 'lucide-react'

interface TimetableInstructionsProps {
  onDismiss: () => void
  currentStep?: number
  hasSelectedSlots?: boolean
}

const LESSON_TYPES = [
  {
    type: 'single',
    name: 'Single Lesson',
    description: 'Standard 40-minute lesson',
    color: 'bg-emerald-500',
    icon: BookOpen,
    duration: '40 min'
  },
  {
    type: 'double',
    name: 'Double Lesson',
    description: 'Extended 80-minute session',
    color: 'bg-orange-500',
    icon: ChevronRight,
    duration: '80 min'
  },
  {
    type: 'evening',
    name: 'Evening Lesson',
    description: 'After 4:00 PM sessions',
    color: 'bg-purple-500',
    icon: Moon,
    duration: '40 min'
  }
]

const INSTRUCTIONS = [
  {
    icon: MousePointer,
    title: "Click to Schedule",
    description: "Click any empty time slot to schedule a lesson",
    color: "bg-blue-500"
  },
  {
    icon: ChevronRight,
    title: "Create Double Lessons",
    description: "Click adjacent slots to create 80-minute double lessons",
    color: "bg-orange-500"
  },
  {
    icon: Moon,
    title: "Evening Sessions",
    description: "Slots after 4:00 PM are marked as evening lessons",
    color: "bg-purple-500"
  },
  {
    icon: Target,
    title: "Smart Analysis",
    description: "View workload analysis and AI tips in the side panel",
    color: "bg-emerald-500"
  }
]

export default function TimetableInstructions({ 
  onDismiss, 
  currentStep = 0,
  hasSelectedSlots = false 
}: TimetableInstructionsProps) {
  const [showLessonTypes, setShowLessonTypes] = useState(false)

  return (
    <div className="space-y-4">
      {/* Main Instructions Panel */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Sparkles className="h-5 w-5" />
              How to Build Your Timetable
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDismiss}
              className="text-blue-600 hover:bg-blue-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {INSTRUCTIONS.map((instruction, index) => {
              const Icon = instruction.icon
              return (
                <div 
                  key={index}
                  className={`p-4 rounded-lg bg-white border-2 transition-all duration-300 ${
                    index === currentStep 
                      ? 'border-blue-300 shadow-md scale-105' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-10 h-10 ${instruction.color} rounded-lg flex items-center justify-center mb-3`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {instruction.title}
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {instruction.description}
                  </p>
                </div>
              )
            })}
          </div>

          <Alert className="mt-4 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <span className="font-medium">Pro Tip:</span> Select your subject first from the dropdown above, then start clicking time slots to build your weekly schedule!
            </AlertDescription>
          </Alert>

          {/* Show lesson types button */}
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              onClick={() => setShowLessonTypes(!showLessonTypes)}
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {showLessonTypes ? 'Hide' : 'View'} Lesson Types
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lesson Types Panel */}
      {showLessonTypes && (
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              Lesson Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {LESSON_TYPES.map((lessonType, index) => {
                const Icon = lessonType.icon
                return (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors bg-white"
                  >
                    <div className={`w-10 h-10 ${lessonType.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{lessonType.name}</div>
                      <div className="text-sm text-gray-500 mb-1">{lessonType.description}</div>
                      <Badge variant="outline" className="text-xs">
                        {lessonType.duration}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Progress Summary */}
      {hasSelectedSlots && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800">
            Great! You're building your timetable. Keep adding lessons and check the analysis panel for optimization tips.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}