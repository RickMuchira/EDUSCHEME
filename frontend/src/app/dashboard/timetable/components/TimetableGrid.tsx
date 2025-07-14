"use client"

import { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  const [dragStartSlot, setDragStartSlot] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
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

  // Check for potential double lesson creation
  const checkForPotentialDouble = (day: string, timeSlot: string) => {
    const currentPeriod = TIME_SLOTS.find(t => t.time === timeSlot)?.period
    if (!currentPeriod) return false

    // Check previous slot
    const prevTimeSlot = TIME_SLOTS.find(t => t.period === currentPeriod - 1)
    if (prevTimeSlot && isSlotSelected(day, prevTimeSlot.time)) {
      return 'can-create-with-previous'
    }

    // Check next slot
    const nextTimeSlot = TIME_SLOTS.find(t => t.period === currentPeriod + 1)
    if (nextTimeSlot && isSlotSelected(day, nextTimeSlot.time)) {
      return 'can-create-with-next'
    }

    return false
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hoveredSlot) return

      const [day, time] = hoveredSlot.split('-')
      const dayIndex = DAYS.indexOf(day)
      const timeIndex = TIME_SLOTS.findIndex(t => t.time === time)

      let newDay = day
      let newTime = time

      switch (e.key) {
        case 'ArrowRight':
          if (dayIndex < DAYS.length - 1) newDay = DAYS[dayIndex + 1]
          break
        case 'ArrowLeft':
          if (dayIndex > 0) newDay = DAYS[dayIndex - 1]
          break
        case 'ArrowDown':
          if (timeIndex < TIME_SLOTS.length - 1) newTime = TIME_SLOTS[timeIndex + 1].time
          break
        case 'ArrowUp':
          if (timeIndex > 0) newTime = TIME_SLOTS[timeIndex - 1].time
          break
        case ' ':
        case 'Enter':
          e.preventDefault()
          handleSlotClick(day, time)
          return
      }

      setHoveredSlot(`${newDay}-${newTime}`)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hoveredSlot])

  const handleSlotClick = (day: string, timeSlot: string) => {
    const timeSlotData = TIME_SLOTS.find(t => t.time === timeSlot)
    if (!timeSlotData) return

    const slot: LessonSlotType = {
      day,
      timeSlot,
      period: timeSlotData.period,
      isEvening: timeSlotData.isEvening || false,
      subject: currentSubject,
      isDoubleLesson: false
    }

    onSlotClick(slot)
  }

  const handleMouseEnter = (day: string, timeSlot: string) => {
    setHoveredSlot(`${day}-${timeSlot}`)
  }

  const handleMouseLeave = () => {
    if (!isDragging) {
      setHoveredSlot(null)
    }
  }

  return (
    <div className="w-full overflow-hidden">
      {/* Mobile View - Stack days vertically */}
      <div className="block md:hidden space-y-4">
        {DAYS.map(day => (
          <Card key={day} className="p-4">
            <h3 className="font-bold text-lg mb-3 text-center bg-blue-50 py-2 rounded">
              {day}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {TIME_SLOTS.map(timeSlot => (
                <LessonSlot
                  key={`${day}-${timeSlot.time}`}
                  day={day}
                  timeSlot={timeSlot}
                  slotType={getSlotType(day, timeSlot.time)}
                  isSelected={isSlotSelected(day, timeSlot.time)}
                  isHovered={hoveredSlot === `${day}-${timeSlot.time}`}
                  canCreateDouble={checkForPotentialDouble(day, timeSlot.time)}
                  hasConflict={conflictSlots.includes(`${day}-${timeSlot.time}`)}
                  onClick={() => handleSlotClick(day, timeSlot.time)}
                  onMouseEnter={() => handleMouseEnter(day, timeSlot.time)}
                  onMouseLeave={handleMouseLeave}
                  subject={currentSubject}
                  className="min-h-[60px] text-sm"
                />
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Desktop View - Traditional Grid */}
      <div className="hidden md:block" ref={gridRef}>
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header Row */}
            <div className="grid grid-cols-6 gap-2 mb-2">
              <div className="text-center font-semibold text-gray-500 py-3">
                TIME
              </div>
              {DAYS.map(day => (
                <div key={day} className="text-center">
                  <Badge variant="outline" className="w-full py-2 text-sm font-bold">
                    {day}
                  </Badge>
                </div>
              ))}
            </div>

            {/* Time Slots Grid */}
            <div className="space-y-1">
              {TIME_SLOTS.map(timeSlot => (
                <div key={timeSlot.time} className="grid grid-cols-6 gap-2">
                  {/* Time Label */}
                  <div className={cn(
                    "flex items-center justify-center py-3 px-2 rounded text-sm font-medium",
                    timeSlot.isEvening 
                      ? "bg-purple-100 text-purple-700" 
                      : "bg-gray-50 text-gray-600"
                  )}>
                    <div className="text-center">
                      <div className="font-bold">{timeSlot.time}</div>
                      <div className="text-xs opacity-75">P{timeSlot.period}</div>
                    </div>
                  </div>

                  {/* Day Slots */}
                  {DAYS.map(day => (
                    <LessonSlot
                      key={`${day}-${timeSlot.time}`}
                      day={day}
                      timeSlot={timeSlot}
                      slotType={getSlotType(day, timeSlot.time)}
                      isSelected={isSlotSelected(day, timeSlot.time)}
                      isHovered={hoveredSlot === `${day}-${timeSlot.time}`}
                      canCreateDouble={checkForPotentialDouble(day, timeSlot.time)}
                      hasConflict={conflictSlots.includes(`${day}-${timeSlot.time}`)}
                      onClick={() => handleSlotClick(day, timeSlot.time)}
                      onMouseEnter={() => handleMouseEnter(day, timeSlot.time)}
                      onMouseLeave={handleMouseLeave}
                      subject={currentSubject}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>Single Lesson</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span>Double Lesson</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span>Evening Lesson</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-200 border-2 border-red-500 rounded"></div>
            <span>Conflict</span>
          </div>
        </div>
      </div>
    </div>
  )
} 