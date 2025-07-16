"use client"

import { useState, useCallback, useMemo } from 'react'
import { LessonSlot, TimetableAnalytics, AITip } from '../types/timetable'

export function useTimetableAnalytics(selectedSlots: LessonSlot[]) {
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date>(new Date())

  // Calculate basic analytics
  const analytics = useMemo((): TimetableAnalytics => {
    const dailyDistribution = selectedSlots.reduce((acc, slot) => {
      acc[slot.day] = (acc[slot.day] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const singleLessons = selectedSlots.filter(slot => !slot.isDoubleLesson).length
    const doubleLessons = selectedSlots.filter(slot => 
      slot.isDoubleLesson && slot.doublePosition === 'top'
    ).length
    const eveningLessons = selectedSlots.filter(slot => slot.isEvening).length

    // Calculate total hours (40 min per single, 80 min per double)
    const totalMinutes = (singleLessons * 40) + (doubleLessons * 80)
    const totalHours = Math.round((totalMinutes / 60) * 10) / 10

    const totalSessions = singleLessons + doubleLessons
    const totalDays = Object.keys(dailyDistribution).length
    const averageSessionsPerDay = totalDays > 0 ? totalSessions / totalDays : 0

    const patternResult = detectSchedulePattern(selectedSlots)
    const workloadResult = calculateWorkloadLevel(selectedSlots)

    return {
      totalSessions,
      totalHours,
      singleLessons,
      doubleLessons,
      eveningLessons,
      dailyDistribution,
      totalDays,
      averageSessionsPerDay,
      patternType: patternResult.type,
      patternDescription: patternResult.description,
      workloadLevel: workloadResult.level,
      workloadPercentage: workloadResult.percentage,
      efficiency: Math.round((totalSessions / Math.max(totalDays, 1)) * 20),
      lastUpdated: lastAnalysisTime
    }
  }, [selectedSlots, lastAnalysisTime])

  // Generate AI tips based on current schedule
  const aiTips = useMemo((): AITip[] => {
    return generateAITips(selectedSlots, analytics)
  }, [selectedSlots, analytics])

  // Get workload level for quick reference
  const workloadLevel = analytics.workloadLevel

  // Get conflict warnings
  const conflictWarnings = useMemo((): string[] => {
    const conflicts: string[] = []
    const slotMap = new Map<string, LessonSlot[]>()

    // Group slots by day-time
    selectedSlots.forEach(slot => {
      const key = `${slot.day}-${slot.timeSlot}`
      if (!slotMap.has(key)) {
        slotMap.set(key, [])
      }
      slotMap.get(key)!.push(slot)
    })

    // Check for conflicts
    slotMap.forEach((slots, key) => {
      if (slots.length > 1) {
        conflicts.push(key)
      }
    })

    return conflicts
  }, [selectedSlots])

  // Update analytics (triggers recalculation)
  const updateAnalytics = useCallback(() => {
    setLastAnalysisTime(new Date())
  }, [])

  return {
    analytics,
    aiTips,
    workloadLevel,
    conflictWarnings,
    updateAnalytics
  }
}

// Helper functions (simplified versions)
function detectSchedulePattern(slots: LessonSlot[]) {
  if (slots.length === 0) {
    return {
      type: 'Empty Schedule',
      description: 'No lessons scheduled yet'
    }
  }

  const dailyDistribution = slots.reduce((acc, slot) => {
    acc[slot.day] = (acc[slot.day] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const days = Object.keys(dailyDistribution)
  const counts = Object.values(dailyDistribution)
  const hasDoubles = slots.some(slot => slot.isDoubleLesson)
  const hasEvening = slots.some(slot => slot.isEvening)
  const maxDaily = Math.max(...counts)
  const minDaily = Math.min(...counts)
  const variance = maxDaily - minDaily

  // Pattern detection logic
  if (hasDoubles && hasEvening) {
    return {
      type: 'Mixed Timing',
      description: 'Flexible schedule with double lessons and evening sessions'
    }
  }

  if (hasDoubles && slots.filter(s => s.isDoubleLesson).length >= 4) {
    return {
      type: 'Double-Heavy',
      description: 'Intensive approach with multiple double lessons'
    }
  }

  if (variance <= 1 && days.length >= 3) {
    return {
      type: 'Balanced Distribution',
      description: 'Even spread across multiple days'
    }
  }

  if (days.includes('MON') && days.includes('TUE') && !days.includes('THU') && !days.includes('FRI')) {
    return {
      type: 'Front-Loaded',
      description: 'Heavy concentration early in the week'
    }
  }

  if (days.length === 5) {
    return {
      type: 'Daily Touchpoint',
      description: 'Lessons every day of the week'
    }
  }

  return {
    type: 'Standard Pattern',
    description: 'Regular teaching schedule'
  }
}

function calculateWorkloadLevel(slots: LessonSlot[]) {
  const totalMinutes = slots.reduce((total, slot) => {
    if (slot.isDoubleLesson && slot.doublePosition === 'top') {
      return total + 80 // Double lesson
    } else if (!slot.isDoubleLesson) {
      return total + 40 // Single lesson
    }
    return total // Don't count bottom half of double lessons
  }, 0)

  const hoursPerWeek = totalMinutes / 60
  const recommendedMax = 8 // hours per week
  const percentage = Math.round((hoursPerWeek / recommendedMax) * 100)

  if (hoursPerWeek < 2) {
    return {
      level: 'light',
      percentage,
      recommendation: 'Consider adding more lessons for comprehensive coverage'
    }
  } else if (hoursPerWeek <= 5) {
    return {
      level: 'optimal',
      percentage,
      recommendation: 'Perfect balance for effective teaching'
    }
  } else if (hoursPerWeek <= 7) {
    return {
      level: 'heavy',
      percentage,
      recommendation: 'Intensive schedule - ensure adequate preparation time'
    }
  } else {
    return {
      level: 'overloaded',
      percentage,
      recommendation: 'Consider reducing lessons or redistributing across more days'
    }
  }
}

function generateAITips(slots: LessonSlot[], analytics: TimetableAnalytics): AITip[] {
  const tips: AITip[] = []

  // Workload tips
  if (analytics.workloadLevel === 'light') {
    tips.push({
      id: 'workload-light',
      type: 'info',
      title: 'Light Schedule Detected',
      message: 'Your schedule has room for more lessons. Consider adding sessions for better curriculum coverage.',
      priority: 'medium'
    })
  } else if (analytics.workloadLevel === 'optimal') {
    tips.push({
      id: 'workload-optimal',
      type: 'success',
      title: 'Perfect Balance!',
      message: 'Your workload is optimal for effective teaching and learning.',
      priority: 'low'
    })
  } else if (analytics.workloadLevel === 'heavy') {
    tips.push({
      id: 'workload-heavy',
      type: 'warning',
      title: 'Intensive Schedule',
      message: 'Heavy teaching load detected. Ensure you have adequate preparation time between lessons.',
      priority: 'high'
    })
  }

  // Double lesson tips
  if (analytics.doubleLessons > 0) {
    tips.push({
      id: 'double-lessons',
      type: 'success',
      title: 'Double Lessons Detected',
      message: 'Great for creative projects, presentations, and in-depth discussions. Plan interactive activities!',
      priority: 'medium'
    })
  }

  // Evening lesson tips
  if (analytics.eveningLessons > 0) {
    tips.push({
      id: 'evening-lessons',
      type: 'info',
      title: 'Evening Sessions',
      message: 'Evening classes work well for review, conversation practice, and flexible learning.',
      priority: 'medium'
    })
  }

  // Distribution tips
  const dayGaps = checkForGaps(slots)
  if (dayGaps.length > 0) {
    tips.push({
      id: 'schedule-gaps',
      type: 'optimization',
      title: 'Schedule Gaps Detected',
      message: `${dayGaps.join(', ')} gaps in your schedule. Plan review activities to maintain continuity.`,
      priority: 'medium',
      actionable: true
    })
  }

  // Efficiency tips
  if (analytics.efficiency < 60) {
    tips.push({
      id: 'efficiency-low',
      type: 'optimization',
      title: 'Efficiency Opportunity',
      message: 'Consider grouping lessons on fewer days to reduce setup time and increase focus.',
      priority: 'medium',
      actionable: true
    })
  }

  return tips.slice(0, 5) // Limit to 5 most relevant tips
}

function checkForGaps(slots: LessonSlot[]): string[] {
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI']
  const scheduledDays = new Set(slots.map(slot => slot.day))
  const gaps: string[] = []

  for (let i = 0; i < days.length - 1; i++) {
    const currentDay = days[i]
    const nextDay = days[i + 1]
    
    if (scheduledDays.has(currentDay) && scheduledDays.has(nextDay)) {
      // Check if there's a gap between them
      const gapDays = []
      for (let j = i + 1; j < days.length; j++) {
        if (scheduledDays.has(days[j])) break
        gapDays.push(days[j])
      }
      
      if (gapDays.length > 1) {
        gaps.push(`${currentDay}-${nextDay}`)
      }
    }
  }

  return gaps
} 