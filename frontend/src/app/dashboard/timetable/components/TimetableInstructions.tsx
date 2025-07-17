"use client"

import { useState } from 'react'
<<<<<<< HEAD
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
=======
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  MousePointer, 
  Calendar, 
  BarChart3,
  Save,
  Target,
  Plus,
  X,
  RefreshCw,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Info,
  Zap,
  Database
} from 'lucide-react'

interface TimetableInstructionsProps {
  onClose: () => void
}

export default function TimetableInstructions({ onClose }: TimetableInstructionsProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const instructionSteps = [
    {
      title: "Welcome to the Timetable Builder",
      icon: <Calendar className="h-6 w-6 text-blue-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Create your perfect teaching schedule with our intelligent timetable builder. 
            This tool helps you plan lessons efficiently while providing real-time analytics.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Key Features:</h4>
            <ul className="space-y-1 text-blue-700 text-sm">
              <li>• Interactive time slot selection</li>
              <li>• Real-time schedule analysis</li>
              <li>• Automatic conflict detection</li>
              <li>• Auto-save functionality</li>
              <li>• AI-powered scheduling tips</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "How to Schedule Lessons",
      icon: <MousePointer className="h-6 w-6 text-green-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            The timetable grid shows empty cards for all time slots. Here's how to interact with them:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2 border-gray-200">
              <CardContent className="p-4 text-center">
                <div className="mb-3">
                  <div className="p-3 rounded-lg bg-gray-100 mx-auto w-fit">
                    <Plus className="h-6 w-6 text-gray-400" />
                  </div>
                </div>
                <h4 className="font-semibold text-gray-800">Empty Slot</h4>
                <p className="text-sm text-gray-600">Click to schedule a lesson</p>
              </CardContent>
            </Card>
            
            <Card className="border-2 border-blue-300 ring-2 ring-blue-200">
              <CardContent className="p-4 text-center">
                <div className="mb-3">
                  <div className="p-3 rounded-lg bg-blue-100 mx-auto w-fit">
                    <X className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
                <h4 className="font-semibold text-blue-800">Selected Slot</h4>
                <p className="text-sm text-blue-600">Click to remove lesson</p>
                <Badge className="mt-2 bg-blue-100 text-blue-700">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                </Badge>
              </CardContent>
            </Card>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Important Note:
            </h4>
            <p className="text-green-700 text-sm">
              Cards always appear empty but show selection status through subtle indicators. 
              This design keeps the interface clean while clearly showing your schedule.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Subject & Topic Selection",
      icon: <Target className="h-6 w-6 text-purple-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Before scheduling lessons, set up your teaching context:
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <span className="text-purple-600 font-bold">1</span>
              </div>
              <div>
                <h4 className="font-semibold">Choose Your Subject</h4>
                <p className="text-sm text-gray-600">
                  Select the subject you're creating a timetable for
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <span className="text-purple-600 font-bold">2</span>
              </div>
              <div>
                <h4 className="font-semibold">Select Topics</h4>
                <p className="text-sm text-gray-600">
                  Choose the topics you want to cover in your lessons
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <div>
                <h4 className="font-semibold">Pick Subtopics</h4>
                <p className="text-sm text-gray-600">
                  Fine-tune your curriculum with specific subtopics
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-purple-700 text-sm">
              💡 These selections are automatically saved with your timetable and help 
              create more detailed lesson plans.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Real-time Analytics",
      icon: <BarChart3 className="h-6 w-6 text-orange-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Watch your schedule analytics update in real-time as you build your timetable:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-orange-800">Live Metrics:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  Total teaching hours per week
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-500" />
                  Sessions breakdown by type
                </li>
                <li className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                  Weekly distribution analysis
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-orange-500" />
                  Workload level assessment
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-orange-800">Smart Features:</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-500" />
                  AI-powered scheduling tips
                </li>
                <li className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-blue-500" />
                  Automatic conflict detection
                </li>
                <li className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-500" />
                  Efficiency score calculation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Pattern recognition
                </li>
              </ul>
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-orange-700 text-sm">
              📊 All analytics update instantly as you add or remove lessons, 
              helping you make informed scheduling decisions.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Auto-save & Data Management",
      icon: <Save className="h-6 w-6 text-green-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Your timetable data is automatically saved as you work:
          </p>
          
          <div className="space-y-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Automatic Saving
                </h4>
                <ul className="space-y-1 text-sm text-green-700">
                  <li>• Changes are saved automatically after 2 seconds of inactivity</li>
                  <li>• Both lesson slots and topic selections are preserved</li>
                  <li>• Data is saved to both local storage and database</li>
                  <li>• Visual indicators show save status</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  What Gets Saved
                </h4>
                <ul className="space-y-1 text-sm text-blue-700">
                  <li>• All scheduled lesson slots</li>
                  <li>• Selected subjects, topics, and subtopics</li>
                  <li>• Timetable metadata and settings</li>
                  <li>• Analytics and pattern data</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-green-700 text-sm">
              💾 You can also manually save at any time using the "Save Now" button 
              in the header area.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Tips for Success",
      icon: <Lightbulb className="h-6 w-6 text-yellow-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Here are some best practices for creating effective timetables:
          </p>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Lightbulb className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-semibold">Start Small</h4>
                <p className="text-sm text-gray-600">
                  Begin with a few key lessons and gradually build your schedule
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <BarChart3 className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-semibold">Watch the Analytics</h4>
                <p className="text-sm text-gray-600">
                  Keep an eye on workload levels and distribution patterns
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <RefreshCw className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-semibold">Iterate and Improve</h4>
                <p className="text-sm text-gray-600">
                  Use the undo feature to experiment with different arrangements
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <h4 className="font-semibold">Follow AI Tips</h4>
                <p className="text-sm text-gray-600">
                  Pay attention to the AI suggestions in the right panel
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-yellow-700 text-sm">
              🎯 Remember: The goal is to create a balanced, effective teaching schedule 
              that works for both you and your students.
            </p>
          </div>
        </div>
      )
    }
  ]

  const currentInstruction = instructionSteps[currentStep]

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentInstruction.icon}
          <h3 className="text-lg font-semibold">{currentInstruction.title}</h3>
        </div>
        <Badge variant="outline">
          {currentStep + 1} of {instructionSteps.length}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / instructionSteps.length) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {currentInstruction.content}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {instructionSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {currentStep < instructionSteps.length - 1 ? (
          <Button
            onClick={() => setCurrentStep(Math.min(instructionSteps.length - 1, currentStep + 1))}
            className="gap-2"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={onClose}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            Start Building
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        )}
      </div>
>>>>>>> 5a2d579 (fixed login in issue to databse)
    </div>
  )
}