"use client"

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    if (isSlotSelected(day, timeSlot)) return false
    
    const timeIndex = TIME_SLOTS.findIndex(slot => slot.time === timeSlot)
    
    // Check if next slot is available for double lesson (top position)
    if (timeIndex < TIME_SLOTS.length - 1) {
      const nextTimeSlot = TIME_SLOTS[timeIndex + 1]
      const nextSlotSelected = isSlotSelected(day, nextTimeSlot.time)
      if (!nextSlotSelected) return 'can-create-bottom'
    }
    
    // Check if previous slot is available for double lesson (bottom position)
    if (timeIndex > 0) {
      const prevTimeSlot = TIME_SLOTS[timeIndex - 1]
      const prevSlotSelected = isSlotSelected(day, prevTimeSlot.time)
      if (!prevSlotSelected) return 'can-create-top'
    }
    
    return false
  }

  // Handle slot click with proper lesson slot creation
  const handleSlotClick = (day: string, timeSlot: string) => {
    const timeSlotObj = TIME_SLOTS.find(slot => slot.time === timeSlot)
    if (!timeSlotObj) return

    const lessonSlot: LessonSlotType = {
      day,
      timeSlot,
      period: timeSlotObj.period,
      subject: currentSubject,
      topic: null,
      subtopic: null,
      isDoubleLesson: false,
      doublePosition: undefined,
      isEvening: timeSlotObj.isEvening,
      notes: ''
    }

    onSlotClick(lessonSlot)
  }

  const handleMouseEnter = (day: string, timeSlot: string) => {
    setHoveredSlot(`${day}-${timeSlot}`)
  }

  const handleMouseLeave = () => {
    setHoveredSlot(null)
  }

  // Ensure all functions are closed before return
  return (
    <div className="w-full space-y-6">
      {/* Mobile View - Improved Stack by Day */}
      <div className="block lg:hidden space-y-4">
        {DAYS.map(day => (
          <Card key={day} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-center">
                <Badge 
                  variant="outline" 
                  className="w-full py-3 text-lg font-bold text-gray-700 hover:bg-gray-50 border-2"
                >
                  {day}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {TIME_SLOTS.slice(0, 12).map(timeSlot => (
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop View - Wider Grid with Better Proportions */}
      <div className="hidden lg:block" ref={gridRef}>
        <Card className="border-gray-200 shadow-lg">
          <CardContent className="p-6">
            {/* Make grid wider and squares more proportional */}
            <div className="w-full max-w-none">
              {/* Header Row */}
              <div className="grid grid-cols-6 gap-4 mb-6">
                <div className="text-center font-bold text-gray-600 py-4 text-lg flex items-center justify-center bg-gray-50 rounded-xl border-2 border-gray-200">
                  TIME
                </div>
                {DAYS.map(day => (
                  <div key={day} className="text-center">
                    <Badge 
                      variant="outline" 
                      className="w-full py-4 text-lg font-bold border-2 hover:bg-gray-50 transition-colors rounded-xl"
                    >
                      {day}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Time Slots Grid with improved proportions */}
              <div className="space-y-3">
                {TIME_SLOTS.map(timeSlot => (
                  <div key={timeSlot.time} className="grid grid-cols-6 gap-4">
                    {/* Time Label - Made wider and better proportioned */}
                    <div className={cn(
                      "flex items-center justify-center py-3 px-4 rounded-xl text-center font-semibold transition-all duration-200 min-h-[60px]",
                      timeSlot.isEvening 
                        ? "bg-purple-100 text-purple-700 border-2 border-purple-200 shadow-sm" 
                        : "bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100"
                    )}>
                      <div>
                        <div className="font-bold text-base">{timeSlot.time}</div>
                        <div className="text-xs opacity-75">Period {timeSlot.period}</div>
                      </div>
                    </div>

                    {/* Day Slots - Better proportioned squares */}
                    {DAYS.map(day => (
                      <div key={`${day}-${timeSlot.time}`} className="min-h-[60px]">
                        <LessonSlot
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
                          className="h-full"
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Legend */}
      <Card className="border-gray-200">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-6 justify-center text-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gray-100 border-2 border-gray-200 rounded-lg"></div>
              <span className="font-medium text-gray-700">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-emerald-500 rounded-lg shadow-sm"></div>
              <span className="font-medium text-gray-700">Single Lesson</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-orange-500 rounded-lg shadow-sm"></div>
              <span className="font-medium text-gray-700">Double Lesson</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-purple-500 rounded-lg shadow-sm"></div>
              <span className="font-medium text-gray-700">Evening Lesson</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-red-100 border-2 border-red-500 rounded-lg"></div>
              <span className="font-medium text-gray-700">Conflict</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}