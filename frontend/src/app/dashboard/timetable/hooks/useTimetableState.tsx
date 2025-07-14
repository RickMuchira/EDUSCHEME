"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { LessonSlot, Subject, TimetableData } from '../types/timetable'

interface TimetableState {
  timetableData: TimetableData
  selectedSlots: LessonSlot[]
  currentSubject: Subject | null
  history: LessonSlot[][]
  historyIndex: number
}

export function useTimetableState() {
  const [state, setState] = useState<TimetableState>({
    timetableData: { id: '', name: '', createdAt: new Date(), updatedAt: new Date() },
    selectedSlots: [],
    currentSubject: null,
    history: [[]],
    historyIndex: 0
  })

  const maxHistorySize = 20
  const storageKey = 'timetable-autosave'

  // Add to history for undo functionality
  const addToHistory = useCallback((slots: LessonSlot[]) => {
    setState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1)
      newHistory.push([...slots])
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory.shift()
      } else {
        return {
          ...prev,
          history: newHistory,
          historyIndex: newHistory.length - 1
        }
      }
      
      return {
        ...prev,
        history: newHistory,
        historyIndex: newHistory.length - 1
      }
    })
  }, [])

  // Set current subject
  const setCurrentSubject = useCallback((subject: Subject | null) => {
    setState(prev => ({ ...prev, currentSubject: subject }))
  }, [])

  // Add a lesson slot
  const addSlot = useCallback((slot: LessonSlot) => {
    setState(prev => {
      // Check for conflicts
      const hasConflict = prev.selectedSlots.some(
        existing => existing.day === slot.day && existing.timeSlot === slot.timeSlot
      )
      
      if (hasConflict) {
        return prev // Don't add if conflict exists
      }

      const newSlots = [...prev.selectedSlots, slot]
      addToHistory(newSlots)
      
      return {
        ...prev,
        selectedSlots: newSlots
      }
    })
  }, [addToHistory])

  // Remove a lesson slot
  const removeSlot = useCallback((slotToRemove: LessonSlot) => {
    setState(prev => {
      let newSlots = prev.selectedSlots.filter(
        slot => !(slot.day === slotToRemove.day && slot.timeSlot === slotToRemove.timeSlot)
      )

      // If removing a double lesson, remove both parts
      if (slotToRemove.isDoubleLesson) {
        const doublePartner = prev.selectedSlots.find(slot => 
          slot.day === slotToRemove.day &&
          slot.isDoubleLesson &&
          slot.doublePosition !== slotToRemove.doublePosition &&
          Math.abs(slot.period - slotToRemove.period) === 1
        )
        
        if (doublePartner) {
          newSlots = newSlots.filter(
            slot => !(slot.day === doublePartner.day && slot.timeSlot === doublePartner.timeSlot)
          )
        }
      }

      addToHistory(newSlots)
      
      return {
        ...prev,
        selectedSlots: newSlots
      }
    })
  }, [addToHistory])

  // Create double lesson
  const createDoubleLesson = useCallback((slot1: LessonSlot, slot2: LessonSlot) => {
    setState(prev => {
      // Determine which is top and bottom based on period
      const topSlot = slot1.period < slot2.period ? slot1 : slot2
      const bottomSlot = slot1.period < slot2.period ? slot2 : slot1

      const newSlots = prev.selectedSlots.map(slot => {
        if (slot.day === topSlot.day && slot.timeSlot === topSlot.timeSlot) {
          return { ...slot, isDoubleLesson: true, doublePosition: 'top' as const }
        }
        if (slot.day === bottomSlot.day && slot.timeSlot === bottomSlot.timeSlot) {
          return { ...slot, isDoubleLesson: true, doublePosition: 'bottom' as const }
        }
        return slot
      })

      addToHistory(newSlots)
      
      return {
        ...prev,
        selectedSlots: newSlots
      }
    })
  }, [addToHistory])

  // Clear all slots
  const clearAll = useCallback(() => {
    setState(prev => {
      addToHistory([])
      return {
        ...prev,
        selectedSlots: []
      }
    })
  }, [addToHistory])

  // Undo functionality
  const undo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex > 0) {
        const newIndex = prev.historyIndex - 1
        return {
          ...prev,
          selectedSlots: [...prev.history[newIndex]],
          historyIndex: newIndex
        }
      }
      return prev
    })
  }, [])

  // Redo functionality  
  const redo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex < prev.history.length - 1) {
        const newIndex = prev.historyIndex + 1
        return {
          ...prev,
          selectedSlots: [...prev.history[newIndex]],
          historyIndex: newIndex
        }
      }
      return prev
    })
  }, [])

  // Save to localStorage
  const saveToStorage = useCallback(() => {
    try {
      const dataToSave = {
        selectedSlots: state.selectedSlots,
        currentSubject: state.currentSubject,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem(storageKey, JSON.stringify(dataToSave))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  }, [state.selectedSlots, state.currentSubject])

  // Load from localStorage
  const loadFromStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const data = JSON.parse(saved)
        setState(prev => ({
          ...prev,
          selectedSlots: data.selectedSlots || [],
          currentSubject: data.currentSubject || null
        }))
        return true
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error)
    }
    return false
  }, [])

  // Load on mount
  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  const canUndo = state.historyIndex > 0
  const canRedo = state.historyIndex < state.history.length - 1

  return {
    timetableData: state.timetableData,
    selectedSlots: state.selectedSlots,
    currentSubject: state.currentSubject,
    setCurrentSubject,
    addSlot,
    removeSlot,
    createDoubleLesson,
    clearAll,
    undo,
    redo,
    canUndo,
    canRedo,
    saveToStorage,
    loadFromStorage
  }
} 