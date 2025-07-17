"use client"

import { useState } from 'react'
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
            The timetable grid shows empty cards for all time slots. Simply click any slot to add a lesson there.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Plus className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Add Lesson</span>
              </div>
              <p className="text-green-700 text-sm">Click empty slots to schedule lessons</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <X className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-800">Remove Lesson</span>
              </div>
              <p className="text-red-700 text-sm">Click scheduled slots to remove them</p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Understanding Lesson Types",
      icon: <Clock className="h-6 w-6 text-orange-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Different types of lessons are color-coded for easy identification:
          </p>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
              <div className="w-4 h-4 bg-emerald-500 rounded"></div>
              <div>
                <span className="font-medium text-emerald-800">Single Lessons</span>
                <p className="text-emerald-700 text-sm">Standard 40-minute teaching periods</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <div>
                <span className="font-medium text-orange-800">Double Lessons</span>
                <p className="text-orange-700 text-sm">Extended 80-minute sessions for intensive topics</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <div>
                <span className="font-medium text-purple-800">Evening Sessions</span>
                <p className="text-purple-700 text-sm">After-hours lessons (4:20 PM onwards)</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Real-Time Analysis",
      icon: <BarChart3 className="h-6 w-6 text-purple-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            As you build your timetable, the analysis panel provides instant feedback:
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Target className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <span className="font-medium text-gray-800">Workload Assessment</span>
                <p className="text-gray-600 text-sm">Tracks if your schedule is light, optimal, or heavy</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <span className="font-medium text-gray-800">AI Tips</span>
                <p className="text-gray-600 text-sm">Smart suggestions for improving your schedule</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Zap className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <span className="font-medium text-gray-800">Efficiency Score</span>
                <p className="text-gray-600 text-sm">Measures how well your time is distributed</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Auto-Save & Database Sync",
      icon: <Database className="h-6 w-6 text-blue-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Your timetable is automatically saved to the database as you work:
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Save className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">Automatic Saving</span>
            </div>
            <ul className="space-y-1 text-blue-700 text-sm">
              <li>• Changes are saved within 2 seconds of editing</li>
              <li>• Works offline with local storage backup</li>
              <li>• All data syncs across your devices</li>
              <li>• Undo/redo functionality available</li>
            </ul>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-green-700 text-sm">
              <CheckCircle2 className="h-4 w-4 inline mr-1" />
              You can close this tutorial and start building your timetable now!
            </p>
          </div>
        </div>
      )
    }
  ]

  const nextStep = () => {
    if (currentStep < instructionSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const currentInstruction = instructionSteps[currentStep]

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            {currentInstruction.icon}
            {currentInstruction.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Step {currentStep + 1} of {instructionSteps.length}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        
        {/* Current Step Content */}
        <div className="min-h-[200px]">
          {currentInstruction.content}
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2">
          {instructionSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentStep 
                  ? 'bg-blue-600 w-6' 
                  : index < currentStep 
                    ? 'bg-blue-400' 
                    : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-blue-200">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentStep === instructionSteps.length - 1 ? (
              <Button
                onClick={onClose}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Start Building
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Quick Action */}
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            Skip tutorial and start building
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}