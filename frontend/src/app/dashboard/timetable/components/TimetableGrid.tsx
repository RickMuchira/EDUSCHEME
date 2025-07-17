"use client"

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import LessonSlot from './LessonSlot'
import { LessonSlot as LessonSlotType, TimeSlot, Subject } from '../types/timetable'

interface TimetableGridProps {
  selectedSlots: LessonSlotType[]
  onSlotClick: (slot: LessonSlotType) => void
  currentSubject: Subject | null
  conflictSlots: string[]
}

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI']
const TIME_SLOTS: TimeSlot[] = [
  { id: '7:00', time: '7:00', label: '7:00 AM', period: 1 },
  { id: '7:40', time: '7:40', label: '7:40 AM', period: 2 },
  { id: '8:20', time: '8:20', label: '8:20 AM', period: 3 },
  { id: '9:00', time: '9:00', label: '9:00 AM', period: 4 },
  { id: '9:40', time: '9:40', label: '9:40 AM', period: 5 },
  { id: '10:20', time: '10:20', label: '10:20 AM', period: 6 },
  { id: '11:00', time: '11:00', label: '11:00 AM', period: 7 },
  { id: '11:40', time: '11:40', label: '11:40 AM', period: 8 },
  { id: '12:20', time: '12:20', label: '12:20 PM', period: 9 },
  { id: '13:00', time: '13:00', label: '1:00 PM', period: 10 },
  { id: '13:40', time: '13:40', label: '1:40 PM', period: 11 },
  { id: '14:20', time: '14:20', label: '2:20 PM', period: 12 },
  { id: '15:00', time: '15:00', label: '3:00 PM', period: 13 },
  { id: '15:40', time: '15:40', label: '3:40 PM', period: 14 },
  { id: '16:20', time: '16:20', label: '4:20 PM', period: 15, isEvening: true },
  { id: '17:00', time: '17:00', label: '5:00 PM', period: 16, isEvening: true },
]

export default function TimetableGrid({ 
  selectedSlots, 
  onSlotClick, 
  currentSubject,
  conflictSlots 
}: TimetableGridProps) {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // Helper function to check if slot is selected
  const isSlotSelected = (day: string, timeSlot: string) => {
    return selectedSlots.some(slot => slot.day === day && slot.timeSlot === timeSlot)
  }

  // Helper function to check if slot is part of double lesson
  const getSlotType = (day: string, timeSlot: string) => {
    const currentSlot = selectedSlots.find(slot => slot.day === day && slot.timeSlot === timeSlot)
    if (!currentSlot) return 'empty'
    
    if (currentSlot.isDoubleLesson) {
      return currentSlot.doublePosition === 'top' ? 'double-top' : 'double-bottom'
    }
    
    return currentSlot.isEvening ? 'evening' : 'single'
  }

  // Helper function to check if a double lesson can be created
  const canCreateDoubleLesson = (day: string, timeSlot: string) => {
    const currentPeriod = TIME_SLOTS.find(t => t.time === timeSlot)?.period
    if (!currentPeriod) return false

    // Check if current slot is selected
    const isCurrentSelected = isSlotSelected(day, timeSlot)
    if (!isCurrentSelected) return false

    // Find adjacent time slots (consecutive periods)
    const nextPeriod = currentPeriod + 1
    const prevPeriod = currentPeriod - 1

    const nextTimeSlot = TIME_SLOTS.find(t => t.period === nextPeriod)
    const prevTimeSlot = TIME_SLOTS.find(t => t.period === prevPeriod)

    // Check if we can create double with next slot
    if (nextTimeSlot && isSlotSelected(day, nextTimeSlot.time)) {
      return 'next'
    }

    // Check if we can create double with previous slot
    if (prevTimeSlot && isSlotSelected(day, prevTimeSlot.time)) {
      return 'prev'
    }

    return false
  }

  // Helper function to check if slot has conflict
  const hasConflict = (day: string, timeSlot: string) => {
    return conflictSlots.includes(`${day}-${timeSlot}`)
  }

  // Handle slot click
  const handleSlotClick = (day: string, timeSlot: string) => {
    const period = TIME_SLOTS.find(t => t.time === timeSlot)?.period || 0
    const isEvening = TIME_SLOTS.find(t => t.time === timeSlot)?.isEvening || false

    const slot: LessonSlotType = {
      day,
      timeSlot,
      period,
      subject: currentSubject,
      isEvening,
      notes: ''
    }

    onSlotClick(slot)
  }

  return (
    <div className="w-full overflow-x-auto" ref={gridRef}>
      <div className="min-w-[800px]">
        
        {/* Header Row */}
        <div className="grid grid-cols-6 gap-2 mb-4">
          <div className="font-semibold text-gray-600 text-center py-2">Time</div>
          {DAYS.map(day => (
            <div key={day} className="font-semibold text-gray-600 text-center py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Time Slots Grid */}
        <div className="space-y-2">
          {TIME_SLOTS.map((timeSlot) => (
            <div key={timeSlot.id} className="grid grid-cols-6 gap-2">
              
              {/* Time Label */}
              <div className="flex items-center justify-center py-2">
                <div className="text-sm font-medium text-gray-700 text-center">
                  <div>{timeSlot.label}</div>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs mt-1",
                      timeSlot.isEvening 
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    )}
                  >
                    P{timeSlot.period}
                  </Badge>
                </div>
              </div>

              {/* Day Slots */}
              {DAYS.map(day => {
                const slotType = getSlotType(day, timeSlot.time)
                const isSelected = isSlotSelected(day, timeSlot.time)
                const isHovered = hoveredSlot === `${day}-${timeSlot.time}`
                const canDouble = canCreateDoubleLesson(day, timeSlot.time)
                const conflict = hasConflict(day, timeSlot.time)
                const selectedSlot = selectedSlots.find(s => s.day === day && s.timeSlot === timeSlot.time)

                return (
                  <LessonSlot
                    key={`${day}-${timeSlot.time}`}
                    day={day}
                    timeSlot={timeSlot}
                    slotType={slotType}
                    isSelected={isSelected}
                    isHovered={isHovered}
                    canCreateDouble={canDouble}
                    hasConflict={conflict}
                    onClick={() => handleSlotClick(day, timeSlot.time)}
                    onMouseEnter={() => setHoveredSlot(`${day}-${timeSlot.time}`)}
                    onMouseLeave={() => setHoveredSlot(null)}
                    subject={selectedSlot?.subject || null}
                  />
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-700 mb-3">Legend</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border-2 border-gray-200 rounded"></div>
              <span>Empty Slot</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-500 rounded"></div>
              <span>Single Lesson</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span>Double Lesson</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span>Evening Session</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}