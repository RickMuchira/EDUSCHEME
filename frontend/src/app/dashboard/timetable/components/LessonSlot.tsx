"use client"

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Clock, 
  Moon, 
  Link as LinkIcon,
  AlertTriangle,
  Sparkles
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
    const baseStyles = "relative transition-all duration-200 cursor-pointer border-2 rounded-lg p-3 min-h-[50px] flex items-center justify-center group"
    
    if (hasConflict) {
      return cn(baseStyles, "bg-red-100 border-red-400 text-red-700 animate-pulse")
    }

    switch (slotType) {
      case 'single':
        return cn(
          baseStyles,
          "bg-green-500 border-green-600 text-white shadow-lg",
          "hover:bg-green-600 hover:shadow-xl transform hover:scale-105"
        )
      case 'double-top':
        return cn(
          baseStyles,
          "bg-orange-500 border-orange-600 text-white shadow-lg rounded-b-none border-b-0",
          "hover:bg-orange-600"
        )
      case 'double-bottom':
        return cn(
          baseStyles,
          "bg-orange-500 border-orange-600 text-white shadow-lg rounded-t-none",
          "hover:bg-orange-600"
        )
      case 'evening':
        return cn(
          baseStyles,
          "bg-purple-500 border-purple-600 text-white shadow-lg",
          "hover:bg-purple-600 hover:shadow-xl transform hover:scale-105"
        )
      default:
        return cn(
          baseStyles,
          "bg-gray-50 border-gray-200 text-gray-400",
          "hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600",
          isHovered && "bg-blue-100 border-blue-400 text-blue-700",
          canCreateDouble && "ring-2 ring-orange-300 ring-opacity-50"
        )
    }
  }

  const getSlotContent = () => {
    if (slotType === 'empty') {
      return (
        <div className="text-center w-full">
          {canCreateDouble && (
            <div className="absolute -top-1 -right-1">
              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                <LinkIcon className="h-3 w-3 mr-1" />
                Double?
              </Badge>
            </div>
          )}
          
          <div className="opacity-60 group-hover:opacity-100 transition-opacity">
            <Clock className="h-4 w-4 mx-auto mb-1" />
            <div className="text-xs font-medium">{timeSlot.time}</div>
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
          <LinkIcon className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 h-3 w-3 text-orange-200" />
        )}

        {/* Subject Display */}
        <div className="space-y-1">
          <div className="font-bold text-sm truncate">
            {subject?.name || 'Lesson'}
          </div>
          <div className="text-xs opacity-90">
            {timeSlot.time} • {duration}
          </div>
          
          {slotType.includes('double') && (
            <Badge variant="secondary" className="text-xs bg-white bg-opacity-20">
              Double Lesson
            </Badge>
          )}
        </div>

        {/* Hover Effects */}
        <div className="absolute inset-0 bg-white bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200" />
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
        <div className="absolute -top-2 -right-2">
          <AlertTriangle className="h-5 w-5 text-red-600 animate-bounce" />
        </div>
      )}

      {/* Double Lesson Hint */}
      {showDoubleHint && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-10">
          <Sparkles className="h-3 w-3 inline mr-1" />
          Click adjacent slot for double lesson!
        </div>
      )}

      {/* Selection Ring Animation */}
      {isSelected && (
        <div className="absolute inset-0 rounded-lg ring-2 ring-blue-400 ring-opacity-50 animate-pulse" />
      )}
    </div>
  )
} 