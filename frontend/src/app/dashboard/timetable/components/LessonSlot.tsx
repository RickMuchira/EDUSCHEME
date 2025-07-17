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
  Plus,
  X
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
          
          <Plus className="h-6 w-6 mx-auto mb-1 opacity-60 group-hover:opacity-100" />
          <div className="text-xs font-medium opacity-70 group-hover:opacity-100">
            {timeSlot.isEvening ? 'Evening' : 'Add Lesson'}
          </div>
          
          {timeSlot.isEvening && (
            <Moon className="h-3 w-3 mx-auto mt-1 opacity-50" />
          )}
        </div>
      )
    }

    return (
      <div className="text-center w-full">
        
        {/* Subject Info */}
        {subject && (
          <div className="space-y-1">
            <div className="font-semibold text-sm truncate">{subject.name}</div>
            {subject.code && (
              <div className="text-xs opacity-80">{subject.code}</div>
            )}
          </div>
        )}

        {/* Lesson Type Indicator */}
        <div className="flex items-center justify-center gap-1 mt-2">
          {slotType === 'single' && (
            <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
              <Clock className="h-3 w-3 mr-1" />
              40min
            </Badge>
          )}
          
          {(slotType === 'double-top' || slotType === 'double-bottom') && (
            <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
              <Sparkles className="h-3 w-3 mr-1" />
              Double
            </Badge>
          )}
          
          {slotType === 'evening' && (
            <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
              <Moon className="h-3 w-3 mr-1" />
              Evening
            </Badge>
          )}
        </div>

        {/* Remove button on hover */}
        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors">
            <X className="h-3 w-3" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(getSlotStyles(), className)}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {hasConflict && (
        <div className="absolute top-1 left-1">
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </div>
      )}
      
      {getSlotContent()}
      
      {canCreateDouble && slotType === 'empty' && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-orange-600 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
            Click to create double lesson
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-orange-600"></div>
          </div>
        </div>
      )}
    </div>
  )
}