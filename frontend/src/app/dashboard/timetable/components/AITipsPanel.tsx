"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Lightbulb, 
  Brain, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Sparkles,
  TrendingUp,
  Clock,
  Target,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AITip } from '../types/timetable'

interface AITipsPanelProps {
  tips: AITip[]
  workloadLevel: string
}

export default function AITipsPanel({ tips, workloadLevel }: AITipsPanelProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // Auto-rotate tips every 5 seconds
  useEffect(() => {
    if (tips.length <= 1) return

    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentTipIndex((prev) => (prev + 1) % tips.length)
        setIsAnimating(false)
      }, 150)
    }, 5000)

    return () => clearInterval(interval)
  }, [tips.length])

  const getTipIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-4 w-4" />
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'info': return <Info className="h-4 w-4" />
      case 'optimization': return <TrendingUp className="h-4 w-4" />
      case 'timing': return <Clock className="h-4 w-4" />
      case 'goal': return <Target className="h-4 w-4" />
      default: return <Lightbulb className="h-4 w-4" />
    }
  }

  const getTipStyle = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50 text-green-800'
      case 'warning': return 'border-orange-200 bg-orange-50 text-orange-800'
      case 'info': return 'border-blue-200 bg-blue-50 text-blue-800'
      case 'optimization': return 'border-purple-200 bg-purple-50 text-purple-800'
      case 'timing': return 'border-yellow-200 bg-yellow-50 text-yellow-800'
      case 'goal': return 'border-indigo-200 bg-indigo-50 text-indigo-800'
      default: return 'border-gray-200 bg-gray-50 text-gray-800'
    }
  }

  const getWorkloadMessage = () => {
    switch (workloadLevel) {
      case 'light':
        return {
          message: "Your schedule is quite light. Consider adding more lessons for comprehensive coverage.",
          type: 'info',
          icon: <Info className="h-4 w-4" />
        }
      case 'optimal':
        return {
          message: "Perfect balance! Your workload is optimal for effective teaching.",
          type: 'success',
          icon: <CheckCircle2 className="h-4 w-4" />
        }
      case 'heavy':
        return {
          message: "Your schedule is quite intensive. Ensure adequate preparation time.",
          type: 'warning',
          icon: <AlertTriangle className="h-4 w-4" />
        }
      case 'overloaded':
        return {
          message: "Schedule is overloaded. Consider reducing lessons or redistributing.",
          type: 'warning',
          icon: <AlertTriangle className="h-4 w-4" />
        }
      default:
        return {
          message: "Start adding lessons to get personalized recommendations.",
          type: 'info',
          icon: <Sparkles className="h-4 w-4" />
        }
    }
  }

  const workloadInfo = getWorkloadMessage()

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-purple-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="h-5 w-5 text-purple-600" />
          AI Insights
          <Badge variant="secondary" className="ml-auto">
            <Sparkles className="h-3 w-3 mr-1" />
            Smart
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        
        {/* Workload Assessment */}
        <Alert className={cn("border-2", getTipStyle(workloadInfo.type))}>
          <div className="flex items-start gap-3">
            {workloadInfo.icon}
            <div className="flex-1">
              <AlertDescription className="text-sm font-medium">
                {workloadInfo.message}
              </AlertDescription>
            </div>
          </div>
        </Alert>

        {/* AI Tips Carousel */}
        {tips.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Smart Suggestions
              </h4>
              
              {tips.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {currentTipIndex + 1} of {tips.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsAnimating(true)
                      setTimeout(() => {
                        setCurrentTipIndex((prev) => (prev + 1) % tips.length)
                        setIsAnimating(false)
                      }, 150)
                    }}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Current Tip Display */}
            <div className={cn(
              "transition-all duration-300 transform",
              isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
            )}>
              {tips[currentTipIndex] && (
                <div className={cn(
                  "p-4 rounded-lg border-2 transition-all duration-200",
                  getTipStyle(tips[currentTipIndex].type)
                )}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getTipIcon(tips[currentTipIndex].type)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="text-sm font-medium">
                        {tips[currentTipIndex].title}
                      </div>
                      <div className="text-sm opacity-90">
                        {tips[currentTipIndex].message}
                      </div>
                      
                      {/* Action buttons for tips */}
                      {tips[currentTipIndex].actionable && (
                        <div className="pt-2">
                          <Button size="sm" variant="outline" className="text-xs">
                            Apply Suggestion
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tip Navigation Dots */}
            {tips.length > 1 && (
              <div className="flex justify-center gap-1">
                {tips.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTipIndex(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-200",
                      index === currentTipIndex 
                        ? "bg-purple-500 w-4" 
                        : "bg-gray-300 hover:bg-gray-400"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-purple-200">
          <div className="text-center p-2 bg-white/50 rounded">
            <div className="text-sm font-bold text-purple-700">
              {tips.filter(tip => tip.type === 'success').length}
            </div>
            <div className="text-xs text-purple-600">Strengths</div>
          </div>
          
          <div className="text-center p-2 bg-white/50 rounded">
            <div className="text-sm font-bold text-purple-700">
              {tips.filter(tip => tip.type === 'optimization').length}
            </div>
            <div className="text-xs text-purple-600">Optimizations</div>
          </div>
        </div>

        {/* No Tips Message */}
        {tips.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Brain className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <div className="text-sm font-medium">Building your schedule...</div>
            <div className="text-xs">Add lessons to get AI recommendations</div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 