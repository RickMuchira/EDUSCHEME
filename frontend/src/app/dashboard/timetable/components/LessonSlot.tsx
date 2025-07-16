"use client"

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, 
  Moon, 
  ChevronRight,
  AlertTriangle,
  Sparkles,
  Plus
} from 'lucide-react'
import { TimeSlot, Subject } from '../types/timetable'

interface LessonSlotProps {
  day: string
  timeSlot: TimeSlot
  slotType: 'empty' | 'single' | 'double-top' | 'double-bottom' | 'evening'
  isSelected: boolean
  isHovered: boolean
  canCreateDouble: boolean | string
  hasConflict: boolean
  onClick: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
  subject: Subject | null
  className?: string
}

export default function LessonSlot({
  day,
  timeSlot,
  slotType,
  isSelected,
  isHovered,
  canCreateDouble,
  hasConflict,
  onClick,
  onMouseEnter,
  onMouseLeave,
  subject,
  className
}: LessonSlotProps) {
  const [showDoubleHint, setShowDoubleHint] = useState(false)

  const getSlotStyles = () => {
    const baseStyles = "relative transition-all duration-300 cursor-pointer border-2 rounded-xl p-4 min-h-[70px] flex items-center justify-center group hover:shadow-lg"
    
    if (hasConflict) {
      return cn(baseStyles, "bg-red-50 border-red-300 text-red-700 ring-2 ring-red-200 animate-pulse")
    }

    switch (slotType) {
      case 'single':
        return cn(
          baseStyles,
          "bg-emerald-500 border-emerald-600 text-white shadow-md",
          "hover:bg-emerald-600 hover:shadow-xl transform hover:scale-[1.02]"
        )
      case 'double-top':
        return cn(
          baseStyles,
          "bg-orange-500 border-orange-600 text-white shadow-md rounded-b-none border-b-0",
          "hover:bg-orange-600"
        )
      case 'double-bottom':
        return cn(
          baseStyles,
          "bg-orange-500 border-orange-600 text-white shadow-md rounded-t-none",
          "hover:bg-orange-600"
        )
      case 'evening':
        return cn(
          baseStyles,
          "bg-purple-500 border-purple-600 text-white shadow-md",
          "hover:bg-purple-600 hover:shadow-xl transform hover:scale-[1.02]"
        )
      default:
        return cn(
          baseStyles,
          "bg-white border-gray-200 text-gray-500",
          "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600",
          isHovered && "bg-blue-50 border-blue-400 text-blue-700 shadow-md",
          canCreateDouble && "ring-2 ring-orange-200 ring-opacity-50"
        )
    }
  }

  const getSlotContent = () => {
    if (slotType === 'empty') {
      return (
        <div className="text-center w-full relative">
          {canCreateDouble && (
            <div className="absolute -top-2 -right-2 z-10">
              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700 shadow-sm">
                <ChevronRight className="h-3 w-3 mr-1" />
                Double?
              </Badge>
            </div>
          )}
          
          <div className="opacity-60 group-hover:opacity-100 transition-all duration-300">
            {/* Improved empty state design */}
            <div className="p-3 rounded-lg bg-gray-100 group-hover:bg-blue-100 transition-colors duration-300 mb-3 mx-auto w-fit">
              <Plus className="h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
            
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-600 group-hover:text-blue-700">
                {timeSlot.time}
              </div>
              <div className="text-xs text-gray-400 group-hover:text-blue-500">
                Period {timeSlot.period}
              </div>
              <div className="text-xs text-gray-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                Click to schedule
              </div>
            </div>
            
            {/* Evening indicator for empty slots */}
            {timeSlot.isEvening && (
              <div className="absolute top-2 right-2">
                <Moon className="h-4 w-4 text-purple-400 group-hover:text-purple-600" />
              </div>
            )}
          </div>
        </div>
      )
    }

    const duration = slotType.includes('double') ? '80 min' : '40 min'
    const isEvening = slotType === 'evening'

    return (
      <div className="text-center w-full relative">
        {/* Evening Indicator */}
        {isEvening && (
          <Moon className="absolute -top-1 -right-1 h-4 w-4 text-purple-200" />
        )}

        {/* Double Lesson Connector */}
        {slotType === 'double-top' && (
          <ChevronRight className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 h-3 w-3 text-orange-200" />
        )}

        {/* Subject Display */}
        <div className="space-y-2">
          <div className="font-bold text-sm truncate">
            {subject?.name || 'Subject'}
          </div>
          <div className="text-xs opacity-90 space-y-1">
            <div>{timeSlot.time}</div>
            <Badge variant="secondary" className="text-xs bg-white bg-opacity-30 text-current">
              {duration}
            </Badge>
          </div>
          
          {slotType.includes('double') && (
            <Badge variant="secondary" className="text-xs bg-white bg-opacity-20 text-current">
              <ChevronRight className="h-3 w-3 mr-1" />
              Double
            </Badge>
          )}
        </div>

        {/* Hover Effects */}
        <div className="absolute inset-0 bg-white bg-opacity-0 group-hover:bg-opacity-10 rounded-xl transition-all duration-200" />
      </div>
    )
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    
    // Special handling for double lesson creation
    if (canCreateDouble && slotType === 'empty') {
      setShowDoubleHint(true)
      setTimeout(() => setShowDoubleHint(false), 2000)
    }
    
    onClick()
  }

  return (
    <div 
      className={cn(getSlotStyles(), className)}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      role="button"
      tabIndex={0}
      aria-label={`${day} ${timeSlot.time} ${slotType === 'empty' ? 'available' : 'selected'} lesson slot`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {getSlotContent()}

      {/* Conflict Warning */}
      {hasConflict && (
        <div className="absolute -top-2 -right-2 z-10">
          <AlertTriangle className="h-5 w-5 text-red-600 animate-bounce" />
        </div>
      )}

      {/* Double Lesson Hint */}
      {showDoubleHint && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap z-20 shadow-lg animate-in fade-in duration-300">
          <Sparkles className="h-3 w-3 inline mr-1" />
          Click adjacent slot for double lesson!
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-orange-600"></div>
        </div>
      )}
    </div>
  )
}