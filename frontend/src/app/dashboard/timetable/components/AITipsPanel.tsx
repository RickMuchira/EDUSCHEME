// Fixed AITipsPanel.tsx
import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Lightbulb, 
  Target, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  TrendingUp,
  Brain
} from 'lucide-react'

interface AITip {
  id: string
  type: 'success' | 'warning' | 'info' | 'optimization' | 'timing' | 'goal'
  title: string
  message: string
  actionable?: boolean
  priority: 'low' | 'medium' | 'high'
}

interface AITipsPanelProps {
  selectedSlots?: any[]
  analytics?: any
  conflictWarnings?: string[]
  tips?: AITip[] // Make it optional with default
}

const AITipsPanel = ({ 
  selectedSlots = [], 
  analytics = {}, 
  conflictWarnings = [],
  tips = [] // Default to empty array
}: AITipsPanelProps) => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [displayedTips, setDisplayedTips] = useState<AITip[]>([])

  // Generate AI tips based on current timetable state
  useEffect(() => {
    const generateTips = () => {
      const newTips: AITip[] = []

      // Tip 1: No slots selected
      if (selectedSlots.length === 0) {
        newTips.push({
          id: 'no-slots',
          type: 'info',
          title: 'Start Building',
          message: 'Click on time slots to start building your timetable. Choose morning slots for better focus!',
          priority: 'high'
        })
      }

      // Tip 2: Good progress
      if (selectedSlots.length >= 5 && selectedSlots.length <= 15) {
        newTips.push({
          id: 'good-progress',
          type: 'success',
          title: 'Great Progress!',
          message: `You've scheduled ${selectedSlots.length} lessons. Consider adding variety to your schedule.`,
          priority: 'medium'
        })
      }

      // Tip 3: Overloaded schedule
      if (selectedSlots.length > 20) {
        newTips.push({
          id: 'overloaded',
          type: 'warning',
          title: 'Schedule Overload',
          message: 'You have many lessons scheduled. Consider balancing your workload for better effectiveness.',
          priority: 'high'
        })
      }

      // Tip 4: Conflicts detected
      if (conflictWarnings.length > 0) {
        newTips.push({
          id: 'conflicts',
          type: 'warning',
          title: 'Scheduling Conflicts',
          message: `${conflictWarnings.length} conflicts detected. Review your time slots to avoid overlaps.`,
          priority: 'high'
        })
      }

      // Tip 5: Morning vs Evening balance
      const morningSlots = selectedSlots.filter(slot => !slot.isEvening).length
      const eveningSlots = selectedSlots.filter(slot => slot.isEvening).length
      
      if (morningSlots > 0 && eveningSlots === 0) {
        newTips.push({
          id: 'add-evening',
          type: 'optimization',
          title: 'Consider Evening Slots',
          message: 'Adding some evening lessons can provide flexibility for working students.',
          priority: 'low'
        })
      }

      // Tip 6: Double lessons recommendation
      const hasDoubleLesson = selectedSlots.some(slot => slot.isDoubleLesson)
      if (selectedSlots.length >= 5 && !hasDoubleLesson) {
        newTips.push({
          id: 'double-lessons',
          type: 'optimization',
          title: 'Try Double Lessons',
          message: 'Double lessons can be great for in-depth topics and practical work.',
          actionable: true,
          priority: 'medium'
        })
      }

      // Tip 7: Weekly distribution
      const daysUsed = new Set(selectedSlots.map(slot => slot.day)).size
      if (daysUsed < 3 && selectedSlots.length >= 3) {
        newTips.push({
          id: 'spread-days',
          type: 'optimization',
          title: 'Spread Across Days',
          message: 'Distributing lessons across more days can improve learning retention.',
          priority: 'medium'
        })
      }

      // Tip 8: Efficiency tips
      if (selectedSlots.length >= 8) {
        newTips.push({
          id: 'efficiency',
          type: 'goal',
          title: 'Optimize Your Schedule',
          message: 'Group related topics together and leave buffer time between intensive sessions.',
          priority: 'medium'
        })
      }

      // Fallback tip if no slots
      if (newTips.length === 0 && selectedSlots.length === 0) {
        newTips.push({
          id: 'welcome',
          type: 'info',
          title: 'Welcome to Timetable Builder',
          message: 'Start by selecting a subject and topics, then click time slots to build your schedule.',
          priority: 'high'
        })
      }

      return newTips
    }

    const generatedTips = generateTips()
    setDisplayedTips(generatedTips)
    setCurrentTipIndex(0)
  }, [selectedSlots.length, conflictWarnings.length]) // Safe to use .length now

  // Rotate tips every 5 seconds if there are multiple tips
  useEffect(() => {
    if (displayedTips.length <= 1) return

    const interval = setInterval(() => {
      setCurrentTipIndex((prevIndex) => 
        (prevIndex + 1) % displayedTips.length
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [displayedTips.length]) // Safe to use .length now

  const getTipIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'optimization': return <TrendingUp className="h-4 w-4 text-blue-600" />
      case 'timing': return <Clock className="h-4 w-4 text-purple-600" />
      case 'goal': return <Target className="h-4 w-4 text-indigo-600" />
      default: return <Lightbulb className="h-4 w-4 text-yellow-600" />
    }
  }

  const getTipColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200'
      case 'warning': return 'bg-orange-50 border-orange-200'
      case 'optimization': return 'bg-blue-50 border-blue-200'
      case 'timing': return 'bg-purple-50 border-purple-200'
      case 'goal': return 'bg-indigo-50 border-indigo-200'
      default: return 'bg-yellow-50 border-yellow-200'
    }
  }

  const currentTip = displayedTips[currentTipIndex]

  if (!currentTip) {
    return (
      <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Loading AI tips...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-purple-600" />
          AI Assistant
          {displayedTips.length > 1 && (
            <Badge variant="outline" className="text-xs ml-auto">
              {currentTipIndex + 1} of {displayedTips.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Current Tip */}
        <div className={`p-4 rounded-lg border-2 ${getTipColor(currentTip.type)}`}>
          <div className="flex items-start gap-3">
            {getTipIcon(currentTip.type)}
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">
                {currentTip.title}
              </h4>
              <p className="text-sm text-gray-700 mb-2">
                {currentTip.message}
              </p>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={currentTip.priority === 'high' ? 'destructive' : 'outline'}
                  className="text-xs"
                >
                  {currentTip.priority} priority
                </Badge>
                {currentTip.actionable && (
                  <Badge variant="outline" className="text-xs bg-blue-50">
                    Actionable
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation for multiple tips */}
        {displayedTips.length > 1 && (
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentTipIndex((prev) => 
                prev === 0 ? displayedTips.length - 1 : prev - 1
              )}
            >
              Previous
            </Button>
            <div className="flex space-x-1">
              {displayedTips.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentTipIndex ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                  onClick={() => setCurrentTipIndex(index)}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentTipIndex((prev) => 
                (prev + 1) % displayedTips.length
              )}
            >
              Next
            </Button>
          </div>
        )}

        {/* Summary Stats */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-lg font-bold text-gray-900">{selectedSlots.length}</p>
              <p className="text-xs text-gray-600">Lessons Scheduled</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-lg font-bold text-gray-900">
                {conflictWarnings.length}
              </p>
              <p className="text-xs text-gray-600">Conflicts Detected</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default AITipsPanel