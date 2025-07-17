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

// Helper functions for pattern detection and workload calculation
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
      description: 'Consistent daily engagement throughout the week'
    }
  }

  if (days.length <= 2) {
    return {
      type: 'Concentrated',
      description: 'Intensive sessions on limited days'
    }
  }

  return {
    type: 'Custom Pattern',
    description: 'Unique schedule tailored to specific needs'
  }
}

function calculateWorkloadLevel(slots: LessonSlot[]) {
  const totalSlots = slots.length
  const doubleLessons = slots.filter(slot => slot.isDoubleLesson && slot.doublePosition === 'top').length
  const eveningLessons = slots.filter(slot => slot.isEvening).length
  
  // Calculate weighted workload (doubles and evenings count more)
  const weightedLoad = totalSlots + (doubleLessons * 0.5) + (eveningLessons * 0.3)
  
  let level: string
  let percentage: number

  if (weightedLoad === 0) {
    level = 'light'
    percentage = 0
  } else if (weightedLoad <= 5) {
    level = 'light'
    percentage = Math.round((weightedLoad / 5) * 25)
  } else if (weightedLoad <= 12) {
    level = 'optimal'
    percentage = Math.round(25 + ((weightedLoad - 5) / 7) * 50)
  } else if (weightedLoad <= 18) {
    level = 'heavy'
    percentage = Math.round(75 + ((weightedLoad - 12) / 6) * 20)
  } else {
    level = 'overloaded'
    percentage = Math.min(100, Math.round(95 + ((weightedLoad - 18) / 5) * 5))
  }

  return { level, percentage }
}

function generateAITips(slots: LessonSlot[], analytics: TimetableAnalytics): AITip[] {
  const tips: AITip[] = []

  // Empty schedule tip
  if (slots.length === 0) {
    tips.push({
      id: 'empty-schedule',
      type: 'info',
      title: 'Start Building Your Timetable',
      message: 'Click any time slot to add your first lesson. Consider starting with your most important topics.',
      priority: 'high'
    })
    return tips
  }

  // Workload-based tips
  if (analytics.workloadLevel === 'light') {
    tips.push({
      id: 'light-workload',
      type: 'optimization',
      title: 'Consider Adding More Lessons',
      message: 'Your current schedule is quite light. You might benefit from additional practice sessions.',
      priority: 'medium',
      actionable: true
    })
  }

  if (analytics.workloadLevel === 'overloaded') {
    tips.push({
      id: 'overloaded-workload',
      type: 'warning',
      title: 'Heavy Schedule Detected',
      message: 'Your schedule is very intensive. Consider reducing lessons or spreading them across more days.',
      priority: 'high',
      actionable: true
    })
  }

  // Pattern-based tips
  if (analytics.totalDays === 1) {
    tips.push({
      id: 'single-day-pattern',
      type: 'optimization',
      title: 'Spread Across Multiple Days',
      message: 'Learning is more effective when distributed across several days rather than concentrated in one.',
      priority: 'medium',
      actionable: true
    })
  }

  // Double lesson tips
  if (analytics.doubleLessons > 0 && analytics.doubleLessons >= analytics.singleLessons) {
    tips.push({
      id: 'double-lesson-balance',
      type: 'optimization',
      title: 'Balance Double and Single Lessons',
      message: 'Mix double lessons with single lessons for better retention and variety.',
      priority: 'medium'
    })
  }

  // Daily distribution tips
  const dayGaps = checkForGaps(slots)
  if (dayGaps.length > 0) {
    tips.push({
      id: 'schedule-gaps',
      type: 'optimization',
      title: 'Schedule Gaps Detected',
      message: `Consider adding review sessions to fill ${dayGaps.join(', ')} gaps for better continuity.`,
      priority: 'medium',
      actionable: true
    })
  }

  // Success tips
  if (analytics.workloadLevel === 'optimal') {
    tips.push({
      id: 'optimal-workload',
      type: 'success',
      title: 'Perfect Balance Achieved!',
      message: 'Your schedule has an optimal workload. Great job balancing intensity with sustainability!',
      priority: 'low'
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

  // Goal-oriented tips
  if (analytics.totalSessions >= 10) {
    tips.push({
      id: 'milestone-reached',
      type: 'goal',
      title: 'Great Progress!',
      message: `You've scheduled ${analytics.totalSessions} sessions! Consider setting specific learning goals for each.`,
      priority: 'low'
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