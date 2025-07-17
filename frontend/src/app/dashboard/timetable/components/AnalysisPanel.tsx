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
        
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-1">
              {analytics.totalSessions}
              {isAnimating && <TrendingUp className="h-4 w-4 animate-bounce" />}
            </div>
            <div className="text-sm text-blue-700">Total Sessions</div>
          </div>
          
          <div className="text-center p-3 bg-emerald-50 rounded-lg">
            <div className="text-2xl font-bold text-emerald-600">
              {analytics.totalHours}h
            </div>
            <div className="text-sm text-emerald-700">Teaching Hours</div>
          </div>
        </div>

        {/* Workload Assessment */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Workload Level</span>
            <Badge className={getWorkloadColor(analytics.workloadLevel)}>
              {analytics.workloadLevel.charAt(0).toUpperCase() + analytics.workloadLevel.slice(1)}
            </Badge>
          </div>
          
          <Progress 
            value={analytics.workloadPercentage} 
            className="h-2"
          />
          
          <div className="text-xs text-gray-600 text-center">
            {analytics.workloadPercentage}% capacity utilized
          </div>
        </div>

        {/* Schedule Breakdown */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Schedule Breakdown
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Single Lessons</span>
              <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                {analytics.singleLessons}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Double Lessons</span>
              <Badge variant="outline" className="text-orange-600 border-orange-200">
                {analytics.doubleLessons}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Evening Sessions</span>
              <Badge variant="outline" className="text-purple-600 border-purple-200">
                {analytics.eveningLessons}
              </Badge>
            </div>
          </div>
        </div>

        {/* Daily Distribution */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Daily Distribution
          </h4>
          
          <div className="space-y-2">
            {Object.entries(analytics.dailyDistribution).map(([day, count]) => (
              <div key={day} className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600 w-8">{day}</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(count / Math.max(...Object.values(analytics.dailyDistribution))) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pattern Analysis */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Schedule Pattern
          </h4>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="font-medium text-gray-800 text-sm mb-1">
              {analytics.patternType}
            </div>
            <div className="text-xs text-gray-600">
              {analytics.patternDescription}
            </div>
          </div>
        </div>

        {/* Efficiency Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Efficiency Score
            </span>
            <span className="text-lg font-bold text-blue-600">
              {getEfficiencyScore()}/100
            </span>
          </div>
          
          <Progress 
            value={getEfficiencyScore()} 
            className="h-2"
          />
          
          <div className="text-xs text-gray-600 text-center">
            Based on lesson distribution and time utilization
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
          <div className="text-center">
            <div className="text-lg font-bold text-gray-700">{analytics.totalDays}</div>
            <div className="text-xs text-gray-600">Active Days</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-gray-700">
              {analytics.averageSessionsPerDay.toFixed(1)}
            </div>
            <div className="text-xs text-gray-600">Avg/Day</div>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}