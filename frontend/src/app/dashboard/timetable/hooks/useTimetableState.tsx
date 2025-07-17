"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { LessonSlot, Subject, TimetableData } from '../types/timetable'
import { useSession } from 'next-auth/react'

interface TimetableState {
  timetableData: TimetableData
  selectedSlots: LessonSlot[]
  currentSubject: Subject | null
  history: LessonSlot[][]
  historyIndex: number
  timetableId: string | null
}

// Real database save function
const saveToDatabase = async (data: any, userId: number) => {
  try {
    const response = await fetch('http://localhost:8000/api/timetables/autosave/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        user_id: userId,
      }),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
    }
    
    const result = await response.json()
    return result
  } catch (error) {
    console.error('Database save error:', error)
    alert('Failed to save timetable to database: ' + (error as Error).message)
    throw error
  }
}

// Load from database function
const loadFromDatabase = async (userId: number) => {
  try {
    const response = await fetch(`http://localhost:8000/api/timetables/?user_id=${userId}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
    }
    
    const result = await response.json()
    return result
  } catch (error) {
    console.error('Database load error:', error)
    alert('Failed to load timetable from database: ' + (error as Error).message)
    throw error
  }
}

// Delete from database function
const deleteFromDatabase = async (timetableId: string, userId: number) => {
  try {
    const response = await fetch(`http://localhost:8000/api/timetables/${timetableId}?user_id=${userId}`, {
      method: 'DELETE',
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    return result
  } catch (error) {
    console.error('Database delete error:', error)
    throw error
  }
}

export function useTimetableState() {
  const { data: session } = useSession()
  const [state, setState] = useState<TimetableState>({
    timetableData: { id: '', name: '', createdAt: new Date(), updatedAt: new Date() },
    selectedSlots: [],
    currentSubject: null,
    history: [[]],
    historyIndex: 0,
    timetableId: null
  })

  const [selectedTopics, setSelectedTopics] = useState<any[]>([])
  const [selectedSubtopics, setSelectedSubtopics] = useState<any[]>([])
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSaveTime, setLastSaveTime] = useState<string>('')
  const autoSaveTimerRef = useRef<NodeJS.Timeout>()

  const maxHistorySize = 20
  const storageKey = 'timetable-autosave'

  // Get user ID from session
  const getUserId = () => {
    if (session && session.user && typeof session.user === 'object' && 'id' in session.user && session.user.id) {
      const id = session.user.id
      if (typeof id === 'string') {
        const parsed = parseInt(id, 10)
        return isNaN(parsed) ? 1 : parsed
      }
      if (typeof id === 'number') return id
    }
    return 1 // Fallback for development
  }

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

  // Auto-save to database with debouncing
  const triggerAutoSave = useCallback(async () => {
    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // Set new timer for auto-save after 2 seconds of inactivity
    autoSaveTimerRef.current = setTimeout(async () => {
      setIsAutoSaving(true)
      try {
        const userId = getUserId()
        if (!userId) {
          console.warn('No user ID available for auto-save')
          return
        }

        // Prepare data for auto-save
        const autosaveData = {
          timetable_id: state.timetableId || undefined,
          name: `${state.currentSubject?.name || 'Untitled'} Timetable`,
          description: 'Auto-saved timetable',
          subject_id: state.currentSubject?.id,
          slots: state.selectedSlots.map(slot => ({
            day_of_week: slot.day,
            time_slot: slot.timeSlot,
            period_number: slot.period,
            subject_id: state.currentSubject?.id,
            topic_id: slot.topic?.id,
            subtopic_id: slot.subtopic?.id,
            is_double_lesson: slot.isDoubleLesson || false,
            double_position: slot.doublePosition,
            is_evening: slot.isEvening || false,
            notes: slot.notes || '',
          })),
          selected_topics: selectedTopics,
          selected_subtopics: selectedSubtopics
        }

        // Save to database
        const response = await saveToDatabase(autosaveData, userId)
        
        if (response.success) {
          // Update timetable ID if it's a new timetable
          if (response.data?.id && !state.timetableId) {
            setState(prev => ({ ...prev, timetableId: response.data.id }))
          }
          
          setLastSaveTime(new Date().toISOString())
          console.log('✅ Auto-saved to database:', response.data?.id)
          
          // Also save to localStorage as backup
          const localData = {
            selectedSlots: state.selectedSlots,
            currentSubject: state.currentSubject,
            selectedTopics,
            selectedSubtopics,
            timetableId: response.data?.id || state.timetableId,
            timestamp: new Date().toISOString()
          }
          localStorage.setItem(storageKey, JSON.stringify(localData))
        }
      } catch (error) {
        console.error('❌ Auto-save failed:', error)
        
        // Fallback to localStorage if database save fails
        try {
          const fallbackData = {
            selectedSlots: state.selectedSlots,
            currentSubject: state.currentSubject,
            selectedTopics,
            selectedSubtopics,
            timestamp: new Date().toISOString()
          }
          localStorage.setItem(storageKey, JSON.stringify(fallbackData))
          console.log('💾 Fallback save to localStorage completed')
        } catch (localError) {
          console.error('❌ Fallback save also failed:', localError)
        }
      } finally {
        setIsAutoSaving(false)
      }
    }, 2000)
  }, [state.selectedSlots, state.currentSubject, state.timetableId, selectedTopics, selectedSubtopics])

  // Set current subject
  const setCurrentSubject = useCallback((subject: Subject | null) => {
    setState(prev => ({ ...prev, currentSubject: subject }))
    triggerAutoSave()
  }, [triggerAutoSave])

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
    triggerAutoSave()
  }, [addToHistory, triggerAutoSave])

  // Remove a lesson slot - FIXED VERSION
  const removeSlot = useCallback((day: string, timeSlot: string) => {
    setState(prev => {
      // Find the slot to remove
      const slotToRemove = prev.selectedSlots.find(
        slot => slot.day === day && slot.timeSlot === timeSlot
      )
      
      if (!slotToRemove) {
        return prev // Nothing to remove
      }

      let newSlots = prev.selectedSlots.filter(
        slot => !(slot.day === day && slot.timeSlot === timeSlot)
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
    triggerAutoSave()
  }, [addToHistory, triggerAutoSave])

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
    triggerAutoSave()
  }, [addToHistory, triggerAutoSave])

  // Clear all slots
  const clearAll = useCallback(() => {
    setState(prev => {
      addToHistory([])
      return {
        ...prev,
        selectedSlots: []
      }
    })
    triggerAutoSave()
  }, [addToHistory, triggerAutoSave])

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
    triggerAutoSave()
  }, [triggerAutoSave])

  // Manual save to database
  const saveToStorage = useCallback(async () => {
    setIsAutoSaving(true)
    try {
      const userId = getUserId()
      if (!userId) {
        throw new Error('No user ID available')
      }

      // Prepare data for save
      const autosaveData = {
        timetable_id: state.timetableId || undefined,
        name: `${state.currentSubject?.name || 'Untitled'} Timetable`,
        description: 'Manually saved timetable',
        subject_id: state.currentSubject?.id,
        slots: state.selectedSlots.map(slot => ({
          day_of_week: slot.day,
          time_slot: slot.timeSlot,
          period_number: slot.period,
          subject_id: state.currentSubject?.id,
          topic_id: slot.topic?.id,
          subtopic_id: slot.subtopic?.id,
          is_double_lesson: slot.isDoubleLesson || false,
          double_position: slot.doublePosition,
          is_evening: slot.isEvening || false,
          notes: slot.notes || '',
        })),
        selected_topics: selectedTopics,
        selected_subtopics: selectedSubtopics
      }

      // Save to database
      const response = await saveToDatabase(autosaveData, userId)
      
      if (response.success) {
        // Update timetable ID if it's a new timetable
        if (response.data?.id && !state.timetableId) {
          setState(prev => ({ ...prev, timetableId: response.data.id }))
        }
        
        setLastSaveTime(new Date().toISOString())
        console.log('✅ Manual save to database completed:', response.data?.id)
        
        // Also save to localStorage
        const localData = {
          selectedSlots: state.selectedSlots,
          currentSubject: state.currentSubject,
          selectedTopics,
          selectedSubtopics,
          timetableId: response.data?.id || state.timetableId,
          timestamp: new Date().toISOString()
        }
        localStorage.setItem(storageKey, JSON.stringify(localData))
        
        return true
      } else {
        throw new Error(response.message || 'Save failed')
      }
    } catch (error) {
      console.error('❌ Manual save failed:', error)
      
      // Fallback to localStorage
      try {
        const fallbackData = {
          selectedSlots: state.selectedSlots,
          currentSubject: state.currentSubject,
          selectedTopics,
          selectedSubtopics,
          timestamp: new Date().toISOString()
        }
        localStorage.setItem(storageKey, JSON.stringify(fallbackData))
        console.log('💾 Fallback manual save to localStorage completed')
        return true
      } catch (localError) {
        console.error('❌ Fallback manual save also failed:', localError)
        return false
      }
    } finally {
      setIsAutoSaving(false)
    }
  }, [state.selectedSlots, state.currentSubject, state.timetableId, selectedTopics, selectedSubtopics])

  // Load from database or localStorage
  const loadFromStorage = useCallback(async () => {
    try {
      const userId = getUserId()
      
      // First try to load from database if we have a user
      if (userId) {
        try {
          const response = await loadFromDatabase(userId)
          if (response.success && response.data && response.data.length > 0) {
            // Load the most recent timetable
            const latestTimetable = response.data[0]
            
            setState(prev => ({
              ...prev,
              selectedSlots: latestTimetable.slots || [],
              currentSubject: latestTimetable.subject || null,
              timetableId: latestTimetable.id
            }))
            
            console.log('✅ Loaded timetable from database:', latestTimetable.id)
            return true
          }
        } catch (dbError) {
          console.warn('Failed to load from database, trying localStorage:', dbError)
        }
      }
      
      // Fallback to localStorage
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const data = JSON.parse(saved)
        setState(prev => ({
          ...prev,
          selectedSlots: data.selectedSlots || [],
          currentSubject: data.currentSubject || null,
          timetableId: data.timetableId || null
        }))
        setSelectedTopics(data.selectedTopics || [])
        setSelectedSubtopics(data.selectedSubtopics || [])
        setLastSaveTime(data.timestamp || '')
        console.log('✅ Loaded timetable from localStorage')
        return true
      }
    } catch (error) {
      console.warn('Failed to load timetable data:', error)
    }
    return false
  }, [])

  // Load specific timetable by ID
  const loadTimetable = useCallback(async (timetableId: string) => {
    try {
      const userId = getUserId()
      if (!userId) {
        throw new Error('No user ID available')
      }

      const response = await fetch(`http://localhost:8000/api/timetables/${timetableId}?user_id=${userId}`)
      const result = await response.json()
      
      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          selectedSlots: result.data.slots || [],
          currentSubject: result.data.subject || null,
          timetableId: result.data.id
        }))
        
        console.log('✅ Loaded specific timetable:', timetableId)
        return true
      }
    } catch (error) {
      console.error('❌ Failed to load timetable:', error)
    }
    return false
  }, [])

  // Delete current timetable
  const deleteTimetable = useCallback(async () => {
    try {
      const userId = getUserId()
      if (!userId || !state.timetableId) {
        throw new Error('No user ID or timetable ID available')
      }

      const response = await deleteFromDatabase(state.timetableId, userId)
      
      if (response.success) {
        // Clear state
        setState(prev => ({
          ...prev,
          selectedSlots: [],
          timetableId: null,
          timetableData: { id: '', name: '', createdAt: new Date(), updatedAt: new Date() }
        }))
        
        // Clear localStorage
        localStorage.removeItem(storageKey)
        
        console.log('✅ Timetable deleted successfully')
        return true
      }
    } catch (error) {
      console.error('❌ Failed to delete timetable:', error)
    }
    return false
  }, [state.timetableId])

  // Topic and subtopic management with auto-save
  const updateSelectedTopics = useCallback((topics: any[]) => {
    setSelectedTopics(topics)
    triggerAutoSave()
  }, [triggerAutoSave])

  const updateSelectedSubtopics = useCallback((subtopics: any[]) => {
    setSelectedSubtopics(subtopics)
    triggerAutoSave()
  }, [triggerAutoSave])

  // Load on mount
  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [])

  const canUndo = state.historyIndex > 0
  const canRedo = state.historyIndex < state.history.length - 1

  return {
    // State
    timetableData: state.timetableData,
    selectedSlots: state.selectedSlots,
    currentSubject: state.currentSubject,
    selectedTopics,
    selectedSubtopics,
    isAutoSaving,
    lastSaveTime,
    timetableId: state.timetableId,
    
    // Actions
    setCurrentSubject,
    addSlot,
    removeSlot,
    createDoubleLesson,
    clearAll,
    undo,
    canUndo,
    canRedo,
    
    // Storage
    saveToStorage,
    loadFromStorage,
    loadTimetable,
    deleteTimetable,
    
    // Topic/Subtopic management
    updateSelectedTopics,
    updateSelectedSubtopics
  }
}