"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { TimetableData, LessonSlot, Subject } from '../types/timetable'
// TODO: Replace these with real imports once implemented in api.ts
// import { sessionHelpers, timetableSchemeApi } from '@/lib/api'

// Temporary type for TimetableState (not exported from types/timetable)
interface TimetableState {
  timetableData: TimetableData
  selectedSlots: LessonSlot[]
  currentSubject: Subject | null
  history: LessonSlot[][]
  historyIndex: number
  timetableId: string | null
}

// TODO: Remove these stubs when real implementations are available
const sessionHelpers = {
  getUserIdFromSession: (session: any) => session?.user?.id?.toString() || '1',
}
const timetableSchemeApi = {
  createTimetableFromScheme: async (data: any, userGoogleId: string) => {
    console.log('🔄 Calling real API to save timetable:', { data, userGoogleId })
    try {
      const result = await saveToDatabase(data, userGoogleId)
      console.log('✅ Timetable API success:', result)
      return result
    } catch (error) {
      console.error('❌ Timetable API error:', error)
      throw error
    }
  },
}

// Enhanced save function that properly handles user identification
async function saveToDatabase(data: any, userGoogleId: string) {
  try {
    const url = data.timetable_id 
      ? `http://localhost:8000/api/timetables/${data.timetable_id}?user_google_id=${encodeURIComponent(userGoogleId)}`
      : `http://localhost:8000/api/timetables?user_google_id=${encodeURIComponent(userGoogleId)}`
    
    const payload = {
      ...data,
      // Remove timetable_id from payload since it's in the URL
      timetable_id: undefined
    }
    
    const response = await fetch(url, {
      method: data.timetable_id ? 'PUT' : 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API Error Response:', errorText)
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
    }
    
    const result = await response.json()
    console.log('✅ Save API response:', result)
    return result
  } catch (error) {
    console.error('❌ Save to database error:', error)
    throw error
  }
}

async function loadFromDatabase(timetableId: string, userGoogleId: string) {
  try {
    const userId = sessionHelpers.getUserIdFromSession({ user: { id: userGoogleId } })
    const response = await fetch(`http://localhost:8000/api/timetables/${timetableId}?user_google_id=${userGoogleId}&user_id=${userId}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    throw error
  }
}

async function deleteFromDatabase(timetableId: string, userGoogleId: string) {
  try {
    const userId = sessionHelpers.getUserIdFromSession({ user: { id: userGoogleId } })
    const response = await fetch(`http://localhost:8000/api/timetables/${timetableId}?user_google_id=${userGoogleId}&user_id=${userId}`, {
      method: 'DELETE'
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
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
  const [selectedScheme, setSelectedScheme] = useState<any>(null)
  const [selectedTopics, setSelectedTopics] = useState<any[]>([])
  const [selectedSubtopics, setSelectedSubtopics] = useState<any[]>([])
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [lastSaveTime, setLastSaveTime] = useState<string>('')
  const autoSaveTimerRef = useRef<NodeJS.Timeout>()
  const maxHistorySize = 20
  const storageKey = 'timetable-autosave'

  // Get user Google ID from session
  const getUserGoogleId = useCallback(() => {
    if (!session?.user) return null
    if ((session.user as any).id) return (session.user as any).id.toString()
    if ((session.user as any).sub) return (session.user as any).sub
    if ((session.user as any).email) return (session.user as any).email
    return null
  }, [session])

  // Add to history for undo functionality
  const addToHistory = useCallback((slots: LessonSlot[]) => {
    setState((prev: TimetableState) => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1)
      newHistory.push([...slots])
      if (newHistory.length > maxHistorySize) {
        newHistory.shift()
      }
      return {
        ...prev,
        history: newHistory,
        historyIndex: newHistory.length - 1
      }
    })
  }, [])

  // Enhanced auto-save with scheme information
  const triggerAutoSave = useCallback(async () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    autoSaveTimerRef.current = setTimeout(async () => {
      setIsAutoSaving(true)
      try {
        const userGoogleId = getUserGoogleId()
        if (!userGoogleId) return
        const autosaveData = {
          timetable_id: state.timetableId || undefined,
          name: `${state.currentSubject?.name || selectedScheme?.subject_name || 'Untitled'} Timetable`,
          description: `Timetable for ${selectedScheme?.subject_name || 'Unknown Subject'} - ${selectedScheme?.school_name || 'Unknown School'}`,
          subject_id: state.currentSubject?.id || selectedScheme?.id,
          scheme_id: selectedScheme?.id,
          slots: state.selectedSlots.map(slot => ({
            day_of_week: slot.day,
            time_slot: slot.timeSlot,
            period_number: slot.period,
            subject_id: state.currentSubject?.id || selectedScheme?.id,
            topic_id: slot.topic?.id,
            subtopic_id: slot.subtopic?.id,
            is_double_lesson: slot.isDoubleLesson || false,
            double_position: slot.doublePosition,
            is_evening: slot.isEvening || false,
            notes: slot.notes || '',
          })),
          selected_topics: selectedTopics,
          selected_subtopics: selectedSubtopics,
          scheme_metadata: selectedScheme ? {
            scheme_id: selectedScheme.id,
            subject_name: selectedScheme.subject_name,
            school_name: selectedScheme.school_name,
            status: selectedScheme.status
          } : null
        }
        const response = await timetableSchemeApi.createTimetableFromScheme(autosaveData, userGoogleId)
        if (response.success) {
          if (response.data?.id && !state.timetableId) {
            setState(prev => ({ ...prev, timetableId: response.data.id }))
          }
          setLastSaveTime(new Date().toISOString())
        } else {
          throw new Error('Auto-save failed')
        }
      } catch (error) {
        try {
          const fallbackData = {
            selectedSlots: state.selectedSlots,
            currentSubject: state.currentSubject,
            selectedTopics,
            selectedSubtopics,
            selectedScheme,
            timestamp: new Date().toISOString()
          }
          localStorage.setItem(storageKey, JSON.stringify(fallbackData))
        } catch {}
      } finally {
        setIsAutoSaving(false)
      }
    }, 2000)
  }, [state, selectedTopics, selectedSubtopics, selectedScheme, getUserGoogleId])

  const saveToStorage = useCallback(async () => {
    setIsAutoSaving(true)
    try {
      const userGoogleId = getUserGoogleId()
      if (!userGoogleId) throw new Error('No user Google ID available')
      const saveData = {
        timetable_id: state.timetableId || undefined,
        name: `${state.currentSubject?.name || selectedScheme?.subject_name || 'Untitled'} Timetable`,
        description: `Manually saved timetable for ${selectedScheme?.subject_name || 'Unknown Subject'}`,
        subject_id: state.currentSubject?.id || selectedScheme?.id,
        scheme_id: selectedScheme?.id,
        slots: state.selectedSlots.map(slot => ({
          day_of_week: slot.day,
          time_slot: slot.timeSlot,
          period_number: slot.period,
          subject_id: state.currentSubject?.id || selectedScheme?.id,
          topic_id: slot.topic?.id,
          subtopic_id: slot.subtopic?.id,
          is_double_lesson: slot.isDoubleLesson || false,
          double_position: slot.doublePosition,
          is_evening: slot.isEvening || false,
          notes: slot.notes || '',
        })),
        selected_topics: selectedTopics,
        selected_subtopics: selectedSubtopics,
        scheme_metadata: selectedScheme ? {
          scheme_id: selectedScheme.id,
          subject_name: selectedScheme.subject_name,
          school_name: selectedScheme.school_name,
          status: selectedScheme.status
        } : null
      }
      const response = await timetableSchemeApi.createTimetableFromScheme(saveData, userGoogleId)
      if (response.success) {
        if (response.data?.id && !state.timetableId) {
          setState(prev => ({ ...prev, timetableId: response.data.id }))
        }
        setLastSaveTime(new Date().toISOString())
        const localData = {
          selectedSlots: state.selectedSlots,
          currentSubject: state.currentSubject,
          selectedTopics,
          selectedSubtopics,
          selectedScheme,
          timetableId: response.data?.id || state.timetableId,
          timestamp: new Date().toISOString()
        }
        localStorage.setItem(storageKey, JSON.stringify(localData))
        return true
      } else {
        throw new Error('Save failed')
      }
    } catch (error) {
      try {
        const fallbackData = {
          selectedSlots: state.selectedSlots,
          currentSubject: state.currentSubject,
          selectedTopics,
          selectedSubtopics,
          selectedScheme,
          timestamp: new Date().toISOString()
        }
        localStorage.setItem(storageKey, JSON.stringify(fallbackData))
        return true
      } catch {
        return false
      }
    } finally {
      setIsAutoSaving(false)
    }
  }, [state, selectedTopics, selectedSubtopics, selectedScheme, getUserGoogleId])

  const loadFromStorage = useCallback(async () => {
    console.log('🚫 loadFromStorage disabled to ensure clean slate for new timetable creation')
    // Clear any existing data to ensure fresh start
    localStorage.removeItem(storageKey)
    return false
    
    // Original implementation commented out:
    /*
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        const data = JSON.parse(stored)
        setState((prev: TimetableState) => ({
          ...prev,
          selectedSlots: data.selectedSlots || [],
          currentSubject: data.currentSubject || null,
          timetableId: data.timetableId || null
        }))
        setSelectedTopics(data.selectedTopics || [])
        setSelectedSubtopics(data.selectedSubtopics || [])
        setSelectedScheme(data.selectedScheme || null)
        return true
      }
    } catch {}
    return false
    */
  }, [])

  const loadTimetable = useCallback(async (timetableId: string) => {
    try {
      const userGoogleId = getUserGoogleId()
      if (!userGoogleId) throw new Error('No user Google ID available')
      const response = await loadFromDatabase(timetableId, userGoogleId)
      if (response.success && response.data) {
        setState((prev: TimetableState) => ({
          ...prev,
          selectedSlots: response.data.slots || [],
          currentSubject: response.data.subject || null,
          timetableId: response.data.id
        }))
        if (response.data.scheme_metadata) {
          setSelectedScheme(response.data.scheme_metadata)
        }
        setSelectedTopics(response.data.selected_topics || [])
        setSelectedSubtopics(response.data.selected_subtopics || [])
        return true
      }
    } catch {}
    return false
  }, [getUserGoogleId])

  const deleteTimetable = useCallback(async () => {
    try {
      const userGoogleId = getUserGoogleId()
      if (!userGoogleId || !state.timetableId) throw new Error('No user Google ID or timetable ID available')
      const response = await deleteFromDatabase(state.timetableId, userGoogleId)
      if (response.success) {
        setState((prev: TimetableState) => ({
          ...prev,
          selectedSlots: [],
          timetableId: null,
          timetableData: { id: '', name: '', createdAt: new Date(), updatedAt: new Date() }
        }))
        setSelectedScheme(null)
        setSelectedTopics([])
        setSelectedSubtopics([])
        localStorage.removeItem(storageKey)
        return true
      }
    } catch {}
    return false
  }, [state.timetableId, getUserGoogleId])

  const updateSelectedTopics = useCallback((topics: any[]) => {
    setSelectedTopics(topics)
    triggerAutoSave()
  }, [triggerAutoSave])

  const updateSelectedSubtopics = useCallback((subtopics: any[]) => {
    setSelectedSubtopics(subtopics)
    triggerAutoSave()
  }, [triggerAutoSave])

  const updateSelectedScheme = useCallback((scheme: any) => {
    setSelectedScheme(scheme)
    if (scheme) {
      const subjectInfo = {
        id: scheme.id,
        name: scheme.subject_name,
        code: scheme.subject_name.substring(0, 3).toUpperCase(),
        color: '#1976d2', // fallback color for Subject type
        description: `${scheme.school_name} - ${scheme.subject_name}`
      }
      setState((prev: TimetableState) => ({ ...prev, currentSubject: subjectInfo }))
    }
    triggerAutoSave()
  }, [triggerAutoSave])

  const addSlot = useCallback((slot: LessonSlot) => {
    setState((prev: TimetableState) => {
      const newSlots = [...prev.selectedSlots, slot]
      addToHistory(newSlots)
      return {
        ...prev,
        selectedSlots: newSlots
      }
    })
    triggerAutoSave()
  }, [addToHistory, triggerAutoSave])

  const removeSlot = useCallback((day: string, timeSlot: string) => {
    setState((prev: TimetableState) => {
      let newSlots = prev.selectedSlots.filter(
        (slot: LessonSlot) => !(slot.day === day && slot.timeSlot === timeSlot)
      )
      const removedSlot = prev.selectedSlots.find(
        (slot: LessonSlot) => slot.day === day && slot.timeSlot === timeSlot
      )
      if (removedSlot?.isDoubleLesson) {
        const partnerPosition = removedSlot.doublePosition === 'top' ? 'bottom' : 'top'
        const doublePartner = prev.selectedSlots.find((slot: LessonSlot) => 
          slot.day === removedSlot.day && 
          slot.isDoubleLesson && 
          slot.doublePosition === partnerPosition
        )
        if (doublePartner) {
          newSlots = newSlots.filter((slot: LessonSlot) => 
            !(slot.day === doublePartner.day && slot.timeSlot === doublePartner.timeSlot)
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

  const createDoubleLesson = useCallback((slot1: LessonSlot, slot2: LessonSlot) => {
    setState((prev: TimetableState) => {
      const topSlot = slot1.period < slot2.period ? slot1 : slot2
      const bottomSlot = slot1.period < slot2.period ? slot2 : slot1
      const newSlots = prev.selectedSlots.map((slot: LessonSlot) => {
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

  const clearAll = useCallback(() => {
    setState((prev: TimetableState) => {
      addToHistory([])
      return {
        ...prev,
        selectedSlots: []
      }
    })
    triggerAutoSave()
  }, [addToHistory, triggerAutoSave])

  const undo = useCallback(() => {
    setState((prev: TimetableState) => {
      if (prev.historyIndex > 0) {
        const newIndex = prev.historyIndex - 1
        const previousSlots = prev.history[newIndex] || []
        return {
          ...prev,
          selectedSlots: [...previousSlots],
          historyIndex: newIndex
        }
      }
      return prev
    })
    triggerAutoSave()
  }, [triggerAutoSave])

  const setCurrentSubject = useCallback((subject: any) => {
    setState((prev: TimetableState) => ({ ...prev, currentSubject: subject }))
    triggerAutoSave()
  }, [triggerAutoSave])

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

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
    timetableData: state.timetableData,
    selectedSlots: state.selectedSlots,
    currentSubject: state.currentSubject,
    selectedTopics,
    selectedSubtopics,
    selectedScheme,
    isAutoSaving,
    lastSaveTime,
    timetableId: state.timetableId,
    setCurrentSubject,
    addSlot,
    removeSlot,
    createDoubleLesson,
    clearAll,
    undo,
    canUndo,
    canRedo,
    saveToStorage,
    loadFromStorage,
    loadTimetable,
    deleteTimetable,
    updateSelectedTopics,
    updateSelectedSubtopics,
    updateSelectedScheme,
    getUserGoogleId
  }
}