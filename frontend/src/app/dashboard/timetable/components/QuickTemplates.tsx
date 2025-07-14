"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  LayoutTemplate, 
  Calendar, 
  Clock, 
  Zap,
  Moon,
  Coffee,
  BookOpen,
  Users,
  Target,
  Sparkles
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { TimetableTemplate } from '../types/timetable'

interface QuickTemplatesProps {
  onTemplateSelect: (template: TimetableTemplate) => void
}

// Fix: Define icon components as functions
const getTemplateIcon = (iconType: string) => {
  const iconProps = { className: "h-5 w-5" }
  switch (iconType) {
    case 'calendar': return <Calendar {...iconProps} />
    case 'zap': return <Zap {...iconProps} />
    case 'moon': return <Moon {...iconProps} />
    case 'coffee': return <Coffee {...iconProps} />
    case 'target': return <Target {...iconProps} />
    case 'book': return <BookOpen {...iconProps} />
    default: return <Calendar {...iconProps} />
  }
}

const PRESET_TEMPLATES: TimetableTemplate[] = [
  {
    id: 'standard-mwf',
    name: 'Standard Mon/Wed/Fri',
    description: 'Classic 3-day schedule with single lessons',
    iconType: 'calendar',
    sessions: 6,
    totalHours: 4,
    pattern: 'Even distribution',
    difficulty: 'beginner',
    slots: [
      { day: 'MON', timeSlot: '8:20', period: 3 },
      { day: 'MON', timeSlot: '9:00', period: 4 },
      { day: 'WED', timeSlot: '8:20', period: 3 },
      { day: 'WED', timeSlot: '9:00', period: 4 },
      { day: 'FRI', timeSlot: '8:20', period: 3 },
      { day: 'FRI', timeSlot: '9:00', period: 4 }
    ],
    benefits: [
      'Consistent routine',
      'Easy to remember',
      'Good work-life balance'
    ],
    bestFor: 'New teachers, stable subjects'
  },
  {
    id: 'double-power',
    name: 'Double Lesson Power',
    description: 'Intensive sessions for deep learning',
    iconType: 'zap',
    sessions: 4,
    totalHours: 5.3,
    pattern: 'Double-heavy',
    difficulty: 'intermediate',
    slots: [
      { day: 'TUE', timeSlot: '8:20', period: 3, isDoubleLesson: true, doublePosition: 'top' },
      { day: 'TUE', timeSlot: '9:00', period: 4, isDoubleLesson: true, doublePosition: 'bottom' },
      { day: 'THU', timeSlot: '8:20', period: 3, isDoubleLesson: true, doublePosition: 'top' },
      { day: 'THU', timeSlot: '9:00', period: 4, isDoubleLesson: true, doublePosition: 'bottom' }
    ],
    benefits: [
      'Extended learning time',
      'Perfect for projects',
      'Fewer transitions'
    ],
    bestFor: 'Creative subjects, STEM projects'
  },
  {
    id: 'mixed-timing',
    name: 'Mixed Day & Evening',
    description: 'Flexible schedule with evening sessions',
    iconType: 'moon',
    sessions: 5,
    totalHours: 4.7,
    pattern: 'Flexible timing',
    difficulty: 'advanced',
    slots: [
      { day: 'MON', timeSlot: '9:00', period: 4 },
      { day: 'TUE', timeSlot: '8:20', period: 3 },
      { day: 'WED', timeSlot: '16:20', period: 15, isEvening: true },
      { day: 'THU', timeSlot: '8:20', period: 3, isDoubleLesson: true, doublePosition: 'top' },
      { day: 'THU', timeSlot: '9:00', period: 4, isDoubleLesson: true, doublePosition: 'bottom' }
    ],
    benefits: [
      'Accommodates all students',
      'Flexible for working learners',
      'Diverse engagement times'
    ],
    bestFor: 'Adult education, part-time learners'
  },
  {
    id: 'front-loaded',
    name: 'Front-loaded Week',
    description: 'Heavy start, lighter finish',
    iconType: 'coffee',
    sessions: 6,
    totalHours: 4,
    pattern: 'Early week focus',
    difficulty: 'intermediate',
    slots: [
      { day: 'MON', timeSlot: '7:40', period: 2 },
      { day: 'MON', timeSlot: '8:20', period: 3 },
      { day: 'MON', timeSlot: '9:00', period: 4 },
      { day: 'TUE', timeSlot: '8:20', period: 3 },
      { day: 'TUE', timeSlot: '9:00', period: 4 },
      { day: 'FRI', timeSlot: '9:00', period: 4 }
    ],
    benefits: [
      'High energy start',
      'Light weekend prep',
      'Review time later'
    ],
    bestFor: 'Intensive courses, exam preparation'
  },
  {
    id: 'balanced-spread',
    name: 'Balanced Daily Spread',
    description: 'One lesson per day approach',
    iconType: 'target',
    sessions: 5,
    totalHours: 3.3,
    pattern: 'Daily consistency',
    difficulty: 'beginner',
    slots: [
      { day: 'MON', timeSlot: '9:00', period: 4 },
      { day: 'TUE', timeSlot: '9:00', period: 4 },
      { day: 'WED', timeSlot: '9:00', period: 4 },
      { day: 'THU', timeSlot: '9:00', period: 4 },
      { day: 'FRI', timeSlot: '9:00', period: 4 }
    ],
    benefits: [
      'Daily touchpoints',
      'Consistent rhythm',
      'Easy planning'
    ],
    bestFor: 'Language learning, daily practice subjects'
  },
  {
    id: 'intensive-burst',
    name: 'Intensive Burst',
    description: 'Concentrated learning blocks',
    iconType: 'book',
    sessions: 3,
    totalHours: 4,
    pattern: 'Block intensive',
    difficulty: 'advanced',
    slots: [
      { day: 'TUE', timeSlot: '8:20', period: 3, isDoubleLesson: true, doublePosition: 'top' },
      { day: 'TUE', timeSlot: '9:00', period: 4, isDoubleLesson: true, doublePosition: 'bottom' },
      { day: 'THU', timeSlot: '8:20', period: 3, isDoubleLesson: true, doublePosition: 'top' },
      { day: 'THU', timeSlot: '9:00', period: 4, isDoubleLesson: true, doublePosition: 'bottom' }
    ],
    benefits: [
      'Deep focus time',
      'Immersive learning',
      'Fewer context switches'
    ],
    bestFor: 'Workshop-style teaching, intensive courses'
  }
]

export default function QuickTemplates({ onTemplateSelect }: QuickTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TimetableTemplate | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200'
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const handleTemplateClick = (template: TimetableTemplate) => {
    setSelectedTemplate(template)
    setIsDialogOpen(true)
  }

  const handleApplyTemplate = () => {
    if (selectedTemplate) {
      onTemplateSelect(selectedTemplate)
      setIsDialogOpen(false)
      setSelectedTemplate(null)
    }
  }

  return (
    <>
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <LayoutTemplate className="h-5 w-5 text-green-600" />
            Quick Start Templates
            <Badge variant="secondary" className="ml-auto">
              <Sparkles className="h-3 w-3 mr-1" />
              6 Templates
            </Badge>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRESET_TEMPLATES.map((template) => (
              <div
                key={template.id}
                onClick={() => handleTemplateClick(template)}
                className="group p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    {getTemplateIcon(template.iconType)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                      {template.name}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {template.description}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="outline" className="text-xs">
                        {template.sessions} sessions
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {template.totalHours}h/week
                      </Badge>
                      <Badge className={cn("text-xs border", getDifficultyColor(template.difficulty))}>
                        {template.difficulty}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Template Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedTemplate && getTemplateIcon(selectedTemplate.iconType)}
              {selectedTemplate?.name}
              <Badge className={cn("border", getDifficultyColor(selectedTemplate?.difficulty || ''))}>
                {selectedTemplate?.difficulty}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-6">
              {/* Overview */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700">
                    {selectedTemplate.sessions}
                  </div>
                  <div className="text-sm text-gray-600">Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-700">
                    {selectedTemplate.totalHours}h
                  </div>
                  <div className="text-sm text-gray-600">Per Week</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-700">
                    {selectedTemplate.pattern}
                  </div>
                  <div className="text-sm text-gray-600">Pattern</div>
                </div>
              </div>

              {/* Benefits */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Key Benefits</h4>
                <div className="grid grid-cols-1 gap-2">
                  {selectedTemplate.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Best For */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Best For</h4>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">{selectedTemplate.bestFor}</p>
                </div>
              </div>

              {/* Schedule Preview */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Schedule Preview</h4>
                <div className="space-y-2">
                  {selectedTemplate.slots.map((slot, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{slot.day}</Badge>
                        <span className="text-sm font-medium">{slot.timeSlot}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {slot.isDoubleLesson && (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                            Double
                          </Badge>
                        )}
                        {slot.isEvening && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                            Evening
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button onClick={handleApplyTemplate} className="flex-1">
                  <LayoutTemplate className="h-4 w-4 mr-2" />
                  Apply This Template
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
} 