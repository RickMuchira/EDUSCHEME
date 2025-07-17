"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  Clock, 
  Calendar, 
  Zap,
  Target,
  TrendingUp,
  Users,
  BookOpen,
  Activity,
  Save,
  Database
} from 'lucide-react'
import { TimetableAnalytics } from '../types/timetable'
import { useEffect, useState } from 'react'

interface AnalysisPanelProps {
  analytics: TimetableAnalytics
  isAutoSaving?: boolean
  lastSaveTime?: string
}

export default function AnalysisPanel({ analytics, isAutoSaving = false, lastSaveTime }: AnalysisPanelProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  
  // Trigger animation when analytics change
  useEffect(() => {
    setIsAnimating(true)
    const timer = setTimeout(() => setIsAnimating(false), 500)
    return () => clearTimeout(timer)
  }, [analytics.totalSessions, analytics.totalHours])

  const getWorkloadColor = (level: string) => {
    switch (level) {
      case 'light': return 'text-green-600 bg-green-100'
      case 'optimal': return 'text-blue-600 bg-blue-100'
      case 'heavy': return 'text-orange-600 bg-orange-100'
      case 'overloaded': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getEfficiencyScore = () => {
    const score = (analytics.totalSessions / Math.max(analytics.totalDays, 1)) * 20
    return Math.min(Math.round(score), 100)
  }

  const formatLastSaveTime = (timestamp: string) => {
    if (!timestamp) return 'Never'
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          Live Schedule Analysis
          {isAnimating && (
            <Activity className="h-4 w-4 text-green-500 animate-pulse" />
          )}
        </CardTitle>
        
        {/* Auto-save status */}
        <div className="flex items-center gap-2 text-sm">
          {isAutoSaving ? (
            <div className="flex items-center gap-1 text-blue-600">
              <Save className="h-3 w-3 animate-spin" />
              <span>Saving...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-green-600">
              <Database className="h-3 w-3" />
              <span>Saved {formatLastSaveTime(lastSaveTime || '')}</span>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        
        {/* Key Metrics with Animation */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`text-center p-3 bg-blue-50 rounded-lg transition-all duration-500 ${
            isAnimating ? 'scale-105 ring-2 ring-blue-200' : ''
          }`}>
            <div className="text-2xl font-bold text-blue-700">
              {analytics.totalSessions}
            </div>
            <div className="text-sm text-blue-600">Sessions</div>
          </div>
          
          <div className={`text-center p-3 bg-green-50 rounded-lg transition-all duration-500 ${
            isAnimating ? 'scale-105 ring-2 ring-green-200' : ''
          }`}>
            <div className="text-2xl font-bold text-green-700">
              {analytics.totalHours}h
            </div>
            <div className="text-sm text-green-600">Per Week</div>
          </div>
        </div>

        {/* Real-time Lesson Breakdown */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Live Lesson Types
            <Badge variant="outline" className="text-xs">
              Real-time
            </Badge>
          </h4>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Single Lessons</span>
              <Badge variant="outline" className={`transition-all duration-300 ${
                isAnimating ? 'animate-pulse' : ''
              }`}>
                {analytics.singleLessons}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Double Lessons</span>
              <Badge variant="outline" className={`bg-orange-50 border-orange-200 transition-all duration-300 ${
                isAnimating ? 'animate-pulse' : ''
              }`}>
                {analytics.doubleLessons}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Evening Lessons</span>
              <Badge variant="outline" className={`bg-purple-50 border-purple-200 transition-all duration-300 ${
                isAnimating ? 'animate-pulse' : ''
              }`}>
                {analytics.eveningLessons}
              </Badge>
            </div>
          </div>
        </div>

        {/* Weekly Distribution with Real-time Updates */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Weekly Distribution
          </h4>
          
          <div className="space-y-2">
            {Object.entries(analytics.dailyDistribution).map(([day, count]) => (
              <div key={day} className="flex items-center gap-3">
                <span className="text-sm font-medium w-8">{day}</span>
                <div className="flex-1">
                  <Progress 
                    value={(count / Math.max(...Object.values(analytics.dailyDistribution))) * 100} 
                    className={`h-2 transition-all duration-500 ${
                      isAnimating ? 'animate-pulse' : ''
                    }`}
                  />
                </div>
                <span className={`text-sm text-gray-600 w-6 text-right transition-all duration-300 ${
                  isAnimating ? 'font-bold text-blue-600' : ''
                }`}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule Pattern */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Pattern Analysis
          </h4>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-800 mb-1">
              {analytics.patternType}
            </div>
            <div className="text-xs text-gray-600">
              {analytics.patternDescription}
            </div>
          </div>
        </div>

        {/* Workload Assessment with Real-time Updates */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Live Workload Level
          </h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Intensity</span>
              <Badge className={`${getWorkloadColor(analytics.workloadLevel)} transition-all duration-300 ${
                isAnimating ? 'animate-bounce' : ''
              }`}>
                {analytics.workloadLevel.toUpperCase()}
              </Badge>
            </div>
            
            <Progress 
              value={analytics.workloadPercentage} 
              className={`h-3 transition-all duration-500 ${
                isAnimating ? 'animate-pulse' : ''
              }`}
            />
            
            <div className="text-xs text-gray-500 text-center">
              {analytics.workloadPercentage}% of recommended maximum
            </div>
          </div>
        </div>

        {/* Efficiency Score with Animation */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Efficiency Score
          </h4>
          
          <div className={`text-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg transition-all duration-500 ${
            isAnimating ? 'scale-105 ring-2 ring-blue-200' : ''
          }`}>
            <div className="text-3xl font-bold text-blue-700 mb-1">
              {getEfficiencyScore()}%
            </div>
            <div className="text-sm text-blue-600">
              Schedule Optimization
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
          <div className="text-center">
            <div className={`text-lg font-bold text-gray-700 transition-all duration-300 ${
              isAnimating ? 'text-blue-600' : ''
            }`}>
              {analytics.totalDays}
            </div>
            <div className="text-xs text-gray-500">Active Days</div>
          </div>
          
          <div className="text-center">
            <div className={`text-lg font-bold text-gray-700 transition-all duration-300 ${
              isAnimating ? 'text-blue-600' : ''
            }`}>
              {Math.round(analytics.averageSessionsPerDay * 10) / 10}
            </div>
            <div className="text-xs text-gray-500">Avg/Day</div>
          </div>
        </div>

        {/* Real-time Status Indicator */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Analytics updating in real-time</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}