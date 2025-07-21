"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  Brain, 
  Save, 
  Download, 
  Share2,
  Undo2,
  RotateCcw,
  Settings,
  School,
  GraduationCap,
  FileText,
  ChevronRight,
  ChevronDown,
  Target,
  List,
  Users,
  Building2,
  Edit,
  CheckCircle2,
  Sparkles,
  Info,
  AlertTriangle,
  Database,
  Trash2,
  FolderOpen,
  Play,
  Loader2,
  RefreshCw,
  Zap
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import TimetableGrid from './components/TimetableGrid'
import AnalysisPanel from './components/AnalysisPanel'
import AITipsPanel from './components/AITipsPanel'
import TimetableInstructions from './components/TimetableInstructions'
import ContentSelectionPanel from './components/ContentSelectionPanel'
import { useTimetableState } from './hooks/useTimetableState'
import { useTimetableAnalytics } from './hooks/useTimetableAnalytics'
import { TimetableData, LessonSlot } from './types/timetable'
import apiClient from '@/lib/apiClient'

// Helper to get user id from session
function getUserIdFromSession(session: any): string | undefined {
  if (!session?.user) return undefined
  return session.user.id || session.user.sub || session.user.email
}

export default function TimetablePage() {
  const { data: session } = useSession()
  const router = useRouter()
  
  // Scheme and data state
  const [currentScheme, setCurrentScheme] = useState<any>(null)
  const [isLoadingScheme, setIsLoadingScheme] = useState(true)
  const [schemeData, setSchemeData] = useState<any>(null)
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([])
  const [currentSubject, setCurrentSubject] = useState<any>(null)
  const [availableTopics, setAvailableTopics] = useState<any[]>([])
  const [availableSubtopics, setAvailableSubtopics] = useState<any[]>([])
  const [selectedTopicIds, setSelectedTopicIds] = useState<number[]>([])
  const [selectedSubtopicIds, setSelectedSubtopicIds] = useState<number[]>([])
  const [isDataLoading, setIsDataLoading] = useState(true)
  
  // UI state
  const [showContextModal, setShowContextModal] = useState(false)
  const [schoolLevelName, setSchoolLevelName] = useState<string>('')
  const [formName, setFormName] = useState<string>('')
  const [termName, setTermName] = useState<string>('')
  const [showInstructions, setShowInstructions] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showGenerationOption, setShowGenerationOption] = useState(false)
  
  // Timetable state hook
  const {
    timetableData,
    selectedSlots,
    currentSubject: currentSubjectState,
    selectedTopics,
    selectedSubtopics,
    isAutoSaving,
    lastSaveTime,
    timetableId,
    setCurrentSubject: setCurrentSubjectState,
    addSlot,
    removeSlot,
    createDoubleLesson,
    clearAll,
    undo,
    saveToStorage,
    loadFromStorage,
    loadTimetable,
    deleteTimetable,
    canUndo,
    updateSelectedTopics,
    updateSelectedSubtopics
  } = useTimetableState()

  // Analytics hook
  const {
    analytics,
    aiTips,
    workloadLevel,
    conflictWarnings,
    updateAnalytics
  } = useTimetableAnalytics(selectedSlots)

  // Helper functions for loading data
  const loadTopicsAndSubtopicsForSubject = async (subjectId: number) => {
    try {
      console.log('Loading topics for subject:', subjectId)
      
      // Load topics for this specific subject ONLY
      const topicsResponse = await apiClient.get('/api/v1/admin/topics', {
        subject_id: subjectId
      })
      
      if (topicsResponse.success && topicsResponse.data) {
        setAvailableTopics(topicsResponse.data)
        
        // Load subtopics for all topics of this subject
        const allSubtopics: any[] = []
        for (const topic of topicsResponse.data) {
          const subtopicsResponse = await apiClient.get('/api/v1/admin/subtopics', {
            topic_id: topic.id
          })
          
          if (subtopicsResponse.success && subtopicsResponse.data) {
            allSubtopics.push(...subtopicsResponse.data)
          }
        }
        setAvailableSubtopics(allSubtopics)
        
        console.log('Loaded topics:', topicsResponse.data.length)
        console.log('Loaded subtopics:', allSubtopics.length)
      }
    } catch (error) {
      console.error('Error loading topics and subtopics for subject:', error)
    }
  }

  const loadSchoolLevels = async () => {
    try {
      const response = await apiClient.get('/api/v1/admin/school-levels')
      if (response.success && response.data) {
        console.log('Loaded school levels:', response.data.length)
      }
    } catch (error) {
      console.error('Error loading school levels:', error)
    }
  }

  const loadFormsGrades = async () => {
    try {
      const response = await apiClient.get('/api/v1/admin/forms-grades')
      if (response.success && response.data) {
        console.log('Loaded forms/grades:', response.data.length)
      }
    } catch (error) {
      console.error('Error loading forms/grades:', error)
    }
  }

  const loadTerms = async () => {
    try {
      const response = await apiClient.get('/api/v1/admin/terms')
      if (response.success && response.data) {
        console.log('Loaded terms:', response.data.length)
      }
    } catch (error) {
      console.error('Error loading terms:', error)
    }
  }

  const loadSubjects = async () => {
    try {
      const response = await apiClient.get('/api/v1/admin/subjects')
      if (response.success && response.data) {
        setAvailableSubjects(response.data)
        console.log('Loaded subjects:', response.data.length)
      }
    } catch (error) {
      console.error('Error loading subjects:', error)
    }
  }

  // Save & Continue handler (move here to fix scoping)
  const [isSavingTimetable, setIsSavingTimetable] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string>('')

  const handleSaveAndContinue = async () => {
    const userGoogleId = getUserIdFromSession(session)
    if (!userGoogleId || !currentScheme) {
      setSaveMessage('Please ensure you are signed in and have a valid scheme')
      return
    }
    if (selectedTopicIds.length === 0 && selectedSubtopicIds.length === 0) {
      setSaveMessage('Please select at least one topic or subtopic before saving')
      return
    }
    setIsSavingTimetable(true)
    setSaveMessage('')
    try {
      const timetableData = {
        scheme_id: currentScheme.id,
        name: `${currentScheme.subject_name} Timetable`,
        description: `Comprehensive timetable for ${currentScheme.subject_name} - ${currentScheme.school_name}`,
        selected_topics: availableTopics.filter(topic => 
          selectedTopicIds.includes(topic.id)
        ).map(topic => ({
          id: topic.id,
          title: topic.name,
          description: topic.description,
          duration_weeks: topic.duration_weeks,
          selected_at: new Date().toISOString()
        })),
        selected_subtopics: availableSubtopics.filter(subtopic => 
          selectedSubtopicIds.includes(subtopic.id)
        ).map(subtopic => ({
          id: subtopic.id,
          title: subtopic.name,
          content: subtopic.description,
          duration_lessons: subtopic.duration_lessons,
          topic_id: subtopic.topic_id,
          selected_at: new Date().toISOString()
        })),
        slots: selectedSlots.map(slot => ({
          day_of_week: slot.day,
          time_slot: slot.timeSlot,
          period_number: slot.period,
          topic_id: slot.topic?.id || null,
          subtopic_id: slot.subtopic?.id || null,
          lesson_title: slot.notes || '',
          is_double_lesson: slot.isDoubleLesson || false,
          is_evening: slot.isEvening || false
        })),
        metadata: {
          total_topics_selected: selectedTopicIds.length,
          total_subtopics_selected: selectedSubtopicIds.length,
          total_lessons_scheduled: selectedSlots.length,
          scheme_metadata: {
            school_name: currentScheme.school_name,
            subject_name: currentScheme.subject_name,
            form_grade_id: currentScheme.form_grade_id,
            term_id: currentScheme.term_id
          }
        }
      }
      let response
      try {
        const existingTimetableResponse = await apiClient.get(
          `/api/timetables/by-scheme/${currentScheme.id}?user_google_id=${encodeURIComponent(userGoogleId)}`
        )
        if (existingTimetableResponse.success && existingTimetableResponse.data) {
          // Update existing timetable
          const timetableId = existingTimetableResponse.data.id
          response = await apiClient.put(
            `/api/timetables/${timetableId}?user_google_id=${encodeURIComponent(userGoogleId)}`,
            timetableData
          )
          console.log('Updated existing timetable:', response)
        } else {
          // Create new timetable
          response = await apiClient.post(
            `/api/timetables?user_google_id=${encodeURIComponent(userGoogleId)}`,
            timetableData
          )
          console.log('Created new timetable:', response)
        }
      } catch (checkError: any) {
        // If error checking for existing timetable, just create a new one
        console.log('No existing timetable found, creating new one')
        response = await apiClient.post(
          `/api/timetables?user_google_id=${encodeURIComponent(userGoogleId)}`,
          timetableData
        )
        console.log('Created new timetable:', response)
      }
      if (response.success) {
        setSaveMessage('Timetable saved successfully! All your selected topics, subtopics, and lesson slots have been saved.')
        if (response.data?.id) {
          localStorage.setItem('currentTimetableId', response.data.id)
        }
        setTimeout(() => setSaveMessage(''), 5000)
        // Show scheme generation option after 1.5 seconds
        setTimeout(() => {
          setShowGenerationOption(true)
        }, 1500)
      } else {
        throw new Error(response.message || 'Failed to save timetable')
      }
    } catch (error: any) {
      console.error('Error saving timetable:', error)
      setSaveMessage(`Error saving timetable: ${error.message}`)
    } finally {
      setIsSavingTimetable(false)
    }
  }

  // Load existing timetable data
  const loadExistingTimetable = async (schemeId: number) => {
    const userGoogleId = getUserIdFromSession(session)
    if (!userGoogleId) return
    try {
      const response = await apiClient.get(
        `/api/timetables/by-scheme/${schemeId}?user_google_id=${encodeURIComponent(userGoogleId)}`
      )
      // Handle the case where no timetable exists (this is normal, not an error)
      if (!response.success) {
        console.log('No existing timetable found for this scheme - this is normal for new schemes')
        return
      }
      if (response.data) {
        const timetableData = response.data
        // Restore selected topics
        if (timetableData.selected_topics && Array.isArray(timetableData.selected_topics)) {
          const topicIds = timetableData.selected_topics.map((t: any) => t.id)
          setSelectedTopicIds(topicIds)
          updateSelectedTopics(timetableData.selected_topics)
        }
        // Restore selected subtopics
        if (timetableData.selected_subtopics && Array.isArray(timetableData.selected_subtopics)) {
          const subtopicIds = timetableData.selected_subtopics.map((s: any) => s.id)
          setSelectedSubtopicIds(subtopicIds)
          updateSelectedSubtopics(timetableData.selected_subtopics)
        }
        localStorage.setItem('currentTimetableId', timetableData.id)
        console.log('Successfully restored timetable data')
      }
    } catch (error: any) {
      // Only log actual errors, not "not found" cases
      if (!error.message?.includes('Not Found')) {
        console.error('Error loading existing timetable:', error)
      } else {
        console.log('No existing timetable found (this is normal for new schemes)')
      }
    }
  }

  // Main data loading effect
  useEffect(() => {
    const loadSchemeAndInitialize = async () => {
      const userGoogleId = getUserIdFromSession(session)
      if (!userGoogleId) return

      setIsLoadingScheme(true)
      setIsDataLoading(true)
      setError(null)

      try {
        const savedSchemeId = localStorage.getItem('currentSchemeId')
        if (savedSchemeId) {
          console.log('Loading scheme with ID:', savedSchemeId)
          // Load scheme from database
          const schemeResponse = await apiClient.get(`/api/schemes/${savedSchemeId}`, {
            user_google_id: userGoogleId
          })
          console.log('Scheme response:', schemeResponse)
          let scheme = null
          let formGradeName = ''
          let termNameResolved = ''
          if (schemeResponse.success && schemeResponse.data) {
            scheme = schemeResponse.data
            // Fetch forms/grades and terms for name lookup
            const [formsGradesRes, termsRes] = await Promise.all([
              apiClient.get('/api/v1/admin/forms-grades'),
              apiClient.get('/api/v1/admin/terms')
            ])
            // Find and set form/grade name
            if (formsGradesRes.success && Array.isArray(formsGradesRes.data)) {
              const formObj = formsGradesRes.data.find((f: any) => f.id === scheme.form_grade_id)
              formGradeName = formObj ? formObj.name : scheme.form_grade_id
              setFormName(formGradeName)
            }
            // Find and set term name
            if (termsRes.success && Array.isArray(termsRes.data)) {
              const termObj = termsRes.data.find((t: any) => t.id === scheme.term_id)
              termNameResolved = termObj ? termObj.name : scheme.term_id
              setTermName(termNameResolved)
            }
            // Attach names to scheme object for ContentSelectionPanel
            scheme = {
              ...scheme,
              form_grade_name: formGradeName,
              term_name: termNameResolved
            }
            setCurrentScheme(scheme)
            console.log('Loaded scheme for timetable:', scheme)
            // Set subject from scheme
            if (scheme.subject_id) {
              const subject = {
                id: scheme.subject_id,
                name: scheme.subject_name,
                code: scheme.subject_name?.substring(0, 3).toUpperCase() || 'SUB',
                color: '#3B82F6',
                is_active: true
              }
              setCurrentSubject(subject)
              setCurrentSubjectState(subject)
              await loadTopicsAndSubtopicsForSubject(scheme.subject_id)
            }
          } else {
            console.error('Failed to load scheme:', schemeResponse)
            setError('Failed to load scheme data')
          }
        } else {
          console.log('No scheme found in localStorage, redirecting to create one')
          setError('No scheme found. Please create a scheme first.')
          setTimeout(() => {
            router.push('/dashboard/scheme-of-work')
          }, 3000)
        }

        // Load other general data
        await Promise.all([
          loadSchoolLevels(),
          loadSubjects()
        ])

        // Load existing timetable data if schemeId is available
        if (currentScheme?.id) {
          await loadExistingTimetable(currentScheme.id)
        }

      } catch (error) {
        console.error('Error loading scheme:', error)
        setError('Error loading scheme data. Please try again.')
      } finally {
        setIsLoadingScheme(false)
        setIsDataLoading(false)
      }
    }

    loadSchemeAndInitialize()
  }, [getUserIdFromSession(session), router, currentScheme?.id])

  // Topic selection handlers
  const handleTopicSelect = useCallback(async (topicId: number, checked: boolean) => {
    if (checked) {
      setSelectedTopicIds(prev => [...prev, topicId])
      // Load subtopics for this topic
      const newTopicIds = [...selectedTopicIds, topicId]
      await loadSubtopicsForTopics(newTopicIds)
    } else {
      setSelectedTopicIds(prev => prev.filter(id => id !== topicId))
      // Remove subtopics of this topic from selection
      const subtopicsToRemove = availableSubtopics
        .filter(s => s.topic_id === topicId)
        .map(s => s.id)
      setSelectedSubtopicIds(prev => prev.filter(id => !subtopicsToRemove.includes(id)))
    }
    
    // Update timetable state for auto-save
    const newSelectedTopicIds = checked ? 
      [...selectedTopicIds, topicId] : 
      selectedTopicIds.filter(id => id !== topicId)
    const selectedTopicsData = availableTopics.filter(topic => 
      newSelectedTopicIds.includes(topic.id)
    )
    updateSelectedTopics(selectedTopicsData)
  }, [selectedTopicIds, availableSubtopics, availableTopics, updateSelectedTopics])

  const handleSubtopicSelect = useCallback((subtopicId: number, checked: boolean) => {
    if (checked) {
      setSelectedSubtopicIds(prev => [...prev, subtopicId])
    } else {
      setSelectedSubtopicIds(prev => prev.filter(id => id !== subtopicId))
    }
    
    // Update timetable state for auto-save
    const newSelectedSubtopicIds = checked ? 
      [...selectedSubtopicIds, subtopicId] : 
      selectedSubtopicIds.filter(id => id !== subtopicId)
    const selectedSubtopicsData = availableSubtopics.filter(subtopic => 
      newSelectedSubtopicIds.includes(subtopic.id)
    )
    updateSelectedSubtopics(selectedSubtopicsData)
  }, [selectedSubtopicIds, availableSubtopics, updateSelectedSubtopics])

  const handleBulkTopicSelect = useCallback(async (topicIds: number[], selected: boolean) => {
    if (selected) {
      setSelectedTopicIds(prev => [...new Set([...prev, ...topicIds])])
      // Load subtopics for all selected topics
      const newTopicIds = [...new Set([...selectedTopicIds, ...topicIds])]
      await loadSubtopicsForTopics(newTopicIds)
    } else {
      setSelectedTopicIds(prev => prev.filter(id => !topicIds.includes(id)))
      // Remove subtopics of deselected topics
      const subtopicsToRemove = availableSubtopics
        .filter(s => topicIds.includes(s.topic_id))
        .map(s => s.id)
      setSelectedSubtopicIds(prev => prev.filter(id => !subtopicsToRemove.includes(id)))
    }
    
    // Update timetable state for auto-save
    const newSelectedTopicIds = selected ? 
      [...new Set([...selectedTopicIds, ...topicIds])] : 
      selectedTopicIds.filter(id => !topicIds.includes(id))
    const selectedTopicsData = availableTopics.filter(topic => 
      newSelectedTopicIds.includes(topic.id)
    )
    updateSelectedTopics(selectedTopicsData)
  }, [selectedTopicIds, availableSubtopics, availableTopics, updateSelectedTopics])

  const handleBulkSubtopicSelect = useCallback((subtopicIds: number[], selected: boolean) => {
    if (selected) {
      setSelectedSubtopicIds(prev => [...new Set([...prev, ...subtopicIds])])
    } else {
      setSelectedSubtopicIds(prev => prev.filter(id => !subtopicIds.includes(id)))
    }
    
    // Update timetable state for auto-save
    const newSelectedSubtopicIds = selected ? 
      [...new Set([...selectedSubtopicIds, ...subtopicIds])] : 
      selectedSubtopicIds.filter(id => !subtopicIds.includes(id))
    const selectedSubtopicsData = availableSubtopics.filter(subtopic => 
      newSelectedSubtopicIds.includes(subtopic.id)
    )
    updateSelectedSubtopics(selectedSubtopicsData)
  }, [selectedSubtopicIds, availableSubtopics, updateSelectedSubtopics])

  // Load subtopics for selected topics
  const loadSubtopicsForTopics = useCallback(async (topicIds: number[]) => {
    try {
      const allSubtopics: any[] = []
      for (const topicId of topicIds) {
        const subtopicsResponse = await apiClient.get('/api/v1/admin/subtopics', {
          topic_id: topicId
        })
        if (subtopicsResponse.success && subtopicsResponse.data) {
          allSubtopics.push(...subtopicsResponse.data)
        }
      }
      setAvailableSubtopics(allSubtopics)
    } catch (error) {
      console.error('Error loading subtopics:', error)
    }
  }, [])

  // Handle slot click with proper validation
  const handleSlotClick = useCallback((slot: LessonSlot) => {
    if (!currentSubject) {
      alert('No subject found in your scheme of work. Please check your scheme setup.')
      return
    }

    if (selectedTopicIds.length === 0 && selectedSubtopicIds.length === 0) {
      alert('Please select at least one topic or subtopic to include in your timetable.')
      return
    }

    // Add slot logic here
    addSlot(slot)
  }, [currentSubject, selectedTopicIds, selectedSubtopicIds, addSlot])

  // Loading state
  if (isLoadingScheme || isDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Timetable</h2>
          <p className="text-gray-600">
            {isLoadingScheme ? 'Loading your scheme...' : 'Loading curriculum data...'}
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Timetable</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-2">
            <Button onClick={() => window.location.reload()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button onClick={() => router.push('/dashboard/scheme-of-work')}>
              <School className="h-4 w-4 mr-2" />
              Create Scheme
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Instructions Modal */}
        {showInstructions && (
          <TimetableInstructions onClose={() => setShowInstructions(false)} />
        )}

        {/* Context Modal */}
        <Dialog open={showContextModal} onOpenChange={setShowContextModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <School className="h-5 w-5 text-blue-600" />
                Scheme Context Details
              </DialogTitle>
            </DialogHeader>
            
            {currentScheme && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">School Name</label>
                    <p className="text-sm text-gray-900">{currentScheme.school_name}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Subject</label>
                    <p className="text-sm text-gray-900">{currentScheme.subject_name}</p>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-sm font-medium text-gray-700">Class & Term</label>
                    <p className="text-sm text-gray-900">
                      {formName ? formName : `Form ${currentScheme.form_grade_id}`}<span className="mx-2">|</span>{termName ? termName : `Term ${currentScheme.term_id}`}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Badge variant={currentScheme.status === 'completed' ? 'default' : 'secondary'}>
                    {currentScheme.status}
                  </Badge>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Scheme Context Card */}
        {currentScheme && (
          <Card className="border-l-4 border-l-blue-500 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">{currentScheme.subject_name}</p>
                      <p className="text-sm text-blue-700">{currentScheme.school_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-blue-700">
                  <div className="flex items-center space-x-1">
                    <Building2 className="h-4 w-4" />
                    <span>Form {formName || currentScheme.form_grade_id}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Term {termName || currentScheme.term_id}</span>
                  </div>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowContextModal(true)}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-full">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Interactive Timetable Builder</h1>
              <p className="text-gray-600">Design your perfect teaching schedule with database-powered insights</p>
              {timetableId && (
                <p className="text-sm text-blue-600 mt-1">
                  <Database className="h-3 w-3 inline mr-1" />
                  Database ID: {timetableId}
                </p>
              )}
            </div>
          </div>
          
          {/* Status Badge and Controls */}
          <div className="flex items-center space-x-3">
            {isAutoSaving ? (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Auto-saving...
              </Badge>
            ) : lastSaveTime ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Saved {new Date(lastSaveTime).toLocaleTimeString()}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                <Clock className="h-3 w-3 mr-1" />
                Ready
              </Badge>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowInstructions(true)}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Info className="h-4 w-4 mr-2" />
              Help
            </Button>
          </div>
        </div>

        {/* Content Selection Panel */}
        {currentScheme && (
          <ContentSelectionPanel
            currentScheme={currentScheme}
            subjects={availableSubjects}
            currentSubject={currentSubject}
            availableTopics={availableTopics}
            availableSubtopics={availableSubtopics}
            selectedTopicIds={selectedTopicIds}
            selectedSubtopicIds={selectedSubtopicIds}
            loading={isDataLoading}
            error={null}
            onTopicSelect={handleTopicSelect}
            onSubtopicSelect={handleSubtopicSelect}
            onBulkTopicSelect={handleBulkTopicSelect}
            onBulkSubtopicSelect={handleBulkSubtopicSelect}
          />
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          
          {/* Timetable Grid */}
          <div className="xl:col-span-3">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                  Weekly Timetable
                  {selectedSlots.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedSlots.length} lessons scheduled
                    </Badge>
                  )}
                </CardTitle>
                {isAutoSaving && (
                  <CardDescription className="flex items-center gap-2 text-blue-600">
                    <Database className="h-4 w-4" />
                    All changes are automatically saved to the database.
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <TimetableGrid
                  selectedSlots={selectedSlots}
                  onSlotClick={handleSlotClick}
                  currentSubject={currentSubject}
                  conflictSlots={conflictWarnings}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Analysis and AI Tips */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Analysis Panel */}
            <AnalysisPanel 
              analytics={analytics}
              isAutoSaving={isAutoSaving}
              lastSaveTime={lastSaveTime}
            />
            
            {/* AI Tips Panel */}
            <AITipsPanel 
              tips={aiTips}
            />
            
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={undo}
              disabled={!canUndo}
              className="flex items-center gap-2"
            >
              <Undo2 className="h-4 w-4" />
              Undo
            </Button>
            <Button 
              variant="outline" 
              onClick={clearAll}
              disabled={selectedSlots.length === 0}
              className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={saveToStorage}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save to Storage
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Total Lessons</p>
                <p className="text-2xl font-bold text-blue-900">{selectedSlots.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-emerald-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700">Topics Selected</p>
                <p className="text-2xl font-bold text-emerald-900">{selectedTopicIds.length}</p>
              </div>
              <Target className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">Subtopics Selected</p>
                <p className="text-2xl font-bold text-purple-900">{selectedSubtopicIds.length}</p>
              </div>
              <List className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
        {/* Save and Continue Section */}
        <Card className="border-green-200 bg-green-50 mt-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <h3 className="font-medium text-green-900">Save Your Complete Timetable</h3>
                    <p className="text-sm text-green-700">
                      Save all selected topics, subtopics, and lesson arrangements to the database
                    </p>
                  </div>
                </div>
                {saveMessage && (
                  <div className={`p-2 rounded text-sm ${
                    saveMessage.includes('Error') || saveMessage.includes('Please') 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {saveMessage}
                  </div>
                )}
              </div>
              <Button 
                onClick={handleSaveAndContinue}
                disabled={isSavingTimetable || (selectedTopicIds.length === 0 && selectedSubtopicIds.length === 0)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSavingTimetable ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save & Continue
                  </>
                )}
              </Button>
            </div>
            {/* Save Summary */}
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div className="bg-white p-3 rounded border">
                <p className="text-lg font-bold text-green-600">{selectedTopicIds.length}</p>
                <p className="text-xs text-green-700">Topics to Save</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <p className="text-lg font-bold text-green-600">{selectedSubtopicIds.length}</p>
                <p className="text-xs text-green-700">Subtopics to Save</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <p className="text-lg font-bold text-green-600">{selectedSlots.length}</p>
                <p className="text-xs text-green-700">Lesson Slots to Save</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {showGenerationOption && (
          <Card className="border-l-4 border-l-green-500 bg-green-50 mt-4">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Zap className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-900">Ready to Generate Scheme!</h3>
                    <p className="text-sm text-green-700">Your timetable is saved. Generate a professional scheme of work using AI.</p>
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    if (!currentScheme || !currentScheme.id) return;
                    // Store full context data in localStorage to avoid URL size limits
                    const contextData = {
                      timetableId: timetableId,
                      schemeId: currentScheme.id,
                      selectedTopics: availableTopics.filter(t => selectedTopicIds.includes(t.id)),
                      selectedSubtopics: availableSubtopics.filter(s => selectedSubtopicIds.includes(s.id)),
                      lessonSlots: selectedSlots
                    }
                    localStorage.setItem('schemeGenerationContext', JSON.stringify(contextData))
                    
                    // Pass only essential data in URL
                    router.push(`/dashboard/schemegen?schemeId=${currentScheme.id}`)
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Generate Scheme
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}