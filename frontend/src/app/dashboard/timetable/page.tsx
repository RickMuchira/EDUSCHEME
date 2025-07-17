"use client"

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  Target,
  List,
  Users,
  Building2,
  Edit,
  CheckCircle2,
  Sparkles,
<<<<<<< HEAD
  Info
=======
  Info,
  AlertTriangle,
  Database,
  Trash2
>>>>>>> 5a2d579 (fixed login in issue to databse)
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import TimetableGrid from './components/TimetableGrid'
import AnalysisPanel from './components/AnalysisPanel'
import AITipsPanel from './components/AITipsPanel'
import TimetableInstructions from './components/TimetableInstructions'
import { useTimetableState } from './hooks/useTimetableState'
import { useTimetableAnalytics } from './hooks/useTimetableAnalytics'
import { TimetableData, LessonSlot } from './types/timetable'
import { subjectApi, topicApi, subtopicApi } from '@/lib/api'
import { useSession } from 'next-auth/react'

export default function TimetablePage() {
  const { data: session } = useSession()
  const [schemeData, setSchemeData] = useState<any>(null)
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([])
  const [currentSubject, setCurrentSubject] = useState<any>(null)
  const [availableTopics, setAvailableTopics] = useState<any[]>([])
  const [availableSubtopics, setAvailableSubtopics] = useState<any[]>([])
  const [selectedTopicIds, setSelectedTopicIds] = useState<number[]>([])
  const [selectedSubtopicIds, setSelectedSubtopicIds] = useState<number[]>([])
  const [showContextModal, setShowContextModal] = useState(false)
  const [schoolLevelName, setSchoolLevelName] = useState<string>('')
  const [formName, setFormName] = useState<string>('')
  const [termName, setTermName] = useState<string>('')
  const [showInstructions, setShowInstructions] = useState(true)
  
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

  const {
    analytics,
    aiTips,
    workloadLevel,
    conflictWarnings,
    updateAnalytics
  } = useTimetableAnalytics(selectedSlots)

  // Toggle topic selection with database auto-save
  const toggleTopicSelection = useCallback(async (topicId: number) => {
    setSelectedTopicIds(prev => {
      const newSelection = prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
      
<<<<<<< HEAD
      return newSelection
    })

    // Fetch subtopics for selected topics
    try {
      const subtopics = await subtopicApi.getByTopicId(topicId)
      if (subtopics) {
        setAvailableSubtopics(prev => {
          const filtered = prev.filter(sub => sub.topic_id !== topicId)
          return [...filtered, ...subtopics]
        })
      }
    } catch (error) {
      console.error('Error fetching subtopics:', error)
    }
  }, [])
=======
      // Load subtopics for selected topics
      if (!prev.includes(topicId)) {
        loadSubtopicsForTopics([...prev, topicId])
      } else {
        // Remove subtopics of deselected topic
        loadSubtopicsForTopics(newSelection)
      }
      
      // Update the topics in the timetable state for auto-saving to database
      const selectedTopicsData = availableTopics.filter(topic => newSelection.includes(topic.id))
      updateSelectedTopics(selectedTopicsData)
      
      return newSelection
    })
  }, [availableTopics, updateSelectedTopics])
>>>>>>> 5a2d579 (fixed login in issue to databse)

  // Toggle subtopic selection with database auto-save
  const toggleSubtopicSelection = useCallback((subtopicId: number) => {
    setSelectedSubtopicIds(prev => {
      const newSelection = prev.includes(subtopicId)
        ? prev.filter(id => id !== subtopicId)
        : [...prev, subtopicId]
      
      // Update the subtopics in the timetable state for auto-saving to database
      const selectedSubtopicsData = availableSubtopics.filter(subtopic => newSelection.includes(subtopic.id))
      updateSelectedSubtopics(selectedSubtopicsData)
      
      return newSelection
    })
  }, [availableSubtopics, updateSelectedSubtopics])

  // Handle slot click
  const handleSlotClick = useCallback((slot: LessonSlot) => {
    const isCurrentlySelected = selectedSlots.some(
      s => s.day === slot.day && s.timeSlot === slot.timeSlot
    )

<<<<<<< HEAD
    if (isCurrentlySelected) {
      removeSlot(slot.day, slot.timeSlot)
    } else {
      addSlot({
        ...slot,
        subject: currentSubject,
        topic: selectedTopicIds.length > 0 ? availableTopics.find(t => selectedTopicIds.includes(t.id)) : null,
        subtopic: selectedSubtopicIds.length > 0 ? availableSubtopics.find(s => selectedSubtopicIds.includes(s.id)) : null
      })
    }
  }, [selectedSlots, removeSlot, addSlot, currentSubject, selectedTopicIds, selectedSubtopicIds, availableTopics, availableSubtopics])

  // Load available subjects on component mount
=======
  // FIXED: Handle slot click with proper toggle logic and database auto-save
  const handleSlotClick = useCallback((slot: LessonSlot) => {
    if (!currentSubject) {
      alert('No subject found in your scheme of work. Please check your scheme setup.')
      return
    }

    if (selectedTopicIds.length === 0 && selectedSubtopicIds.length === 0) {
      alert('Please select at least one topic or subtopic to include in your timetable.')
      return
    }

    const isCurrentlySelected = selectedSlots.some(
      s => s.day === slot.day && s.timeSlot === slot.timeSlot
    )

    if (isCurrentlySelected) {
      // Remove the slot if it's currently selected
      removeSlot(slot.day, slot.timeSlot)
      console.log(`🗑️ Removed slot: ${slot.day} ${slot.timeSlot}`)
    } else {
      // Get selected topic and subtopic data for timetable slots
      const selectedTopicData = availableTopics.filter(topic => selectedTopicIds.includes(topic.id))
      const selectedSubtopicData = availableSubtopics.filter(subtopic => selectedSubtopicIds.includes(subtopic.id))

      // Add the slot if it's not selected
      const newSlot = {
        ...slot,
        subject: currentSubject,
        topic: selectedTopicData.length > 0 ? selectedTopicData[0] : null,
        subtopic: selectedSubtopicData.length > 0 ? selectedSubtopicData[0] : null,
        topics: selectedTopicData.map(t => t.title || `Topic #${t.id}`),
        subtopics: selectedSubtopicData.map(s => s.title || `Subtopic #${s.id}`)
      }
      addSlot(newSlot)
      console.log(`✅ Added slot: ${slot.day} ${slot.timeSlot}`)
    }
  }, [selectedSlots, removeSlot, addSlot, currentSubject, selectedTopicIds, selectedSubtopicIds, availableTopics, availableSubtopics])

  // Manual save function with database integration
  const handleManualSave = useCallback(async () => {
    const success = await saveToStorage()
    if (success) {
      console.log('✅ Manual save to database completed')
    } else {
      console.error('❌ Manual save to database failed')
    }
  }, [saveToStorage])

  // Delete timetable function
  const handleDeleteTimetable = useCallback(async () => {
    if (confirm('Are you sure you want to delete this timetable? This action cannot be undone.')) {
      const success = await deleteTimetable()
      if (success) {
        console.log('✅ Timetable deleted from database')
      } else {
        console.error('❌ Failed to delete timetable from database')
      }
    }
  }, [deleteTimetable])

  // Load scheme data from localStorage and fetch related data
>>>>>>> 5a2d579 (fixed login in issue to databse)
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        if (session?.user?.email) {
          const subjects = await subjectApi.getAll()
          setAvailableSubjects(subjects || [])
          
<<<<<<< HEAD
          if (subjects && subjects.length > 0 && !currentSubject) {
            setCurrentSubject(subjects[0])
            setCurrentSubjectState(subjects[0])
=======
          // Fetch subjects for the selected form and term
          if (parsedData.term) {
            const subjectsResponse = await subjectApi.getByTerm(parseInt(parsedData.term))
            console.log('Subjects response:', subjectsResponse)
            
            if (subjectsResponse.success) {
              setAvailableSubjects(subjectsResponse.data)
              
              // Auto-select the subject if one was selected in scheme
              if (parsedData.selectedSubject) {
                const selectedSubjectData = subjectsResponse.data.find(
                  (subject: any) => subject.id.toString() === parsedData.selectedSubject
                )
                if (selectedSubjectData) {
                  console.log('Setting current subject:', selectedSubjectData)
                  setCurrentSubject(selectedSubjectData)
                  setCurrentSubjectState(selectedSubjectData)
                  
                  // Load topics for this subject
                  console.log('Loading topics for subject ID:', selectedSubjectData.id)
                  const topicsResponse = await topicApi.getBySubject(selectedSubjectData.id)
                  console.log('Topics response:', topicsResponse)
                  
                  // Handle different response formats
                  let topicsData = []
                  if (topicsResponse.success && topicsResponse.data) {
                    topicsData = topicsResponse.data
                  } else if (Array.isArray(topicsResponse)) {
                    topicsData = topicsResponse
                  } else if (topicsResponse.data && Array.isArray(topicsResponse.data)) {
                    topicsData = topicsResponse.data
                  }
                  
                  if (topicsData.length > 0) {
                    console.log('Setting available topics:', topicsData)
                    setAvailableTopics(topicsData)
                    
                    // Pre-select topics if they were in the scheme
                    if (parsedData.selectedTopics && parsedData.selectedTopics.length > 0) {
                      const topicIds = parsedData.selectedTopics.map((id: string) => parseInt(id))
                      console.log('Pre-selecting topic IDs:', topicIds)
                      setSelectedTopicIds(topicIds)
                      loadSubtopicsForTopics(topicIds)
                      
                      // Pre-select subtopics if they were in the scheme
                      if (parsedData.selectedSubtopics && parsedData.selectedSubtopics.length > 0) {
                        const subtopicIds = parsedData.selectedSubtopics.map((id: string) => parseInt(id))
                        console.log('Pre-selecting subtopic IDs:', subtopicIds)
                        setSelectedSubtopicIds(subtopicIds)
                      }
                    }
                  } else {
                    console.log('No topics found or invalid response:', topicsResponse)
                    setAvailableTopics([])
                  }
                }
              }
            } else {
              console.log('Failed to load subjects:', subjectsResponse)
              setAvailableSubjects([])
            }
          }
          
          // Load display names for breadcrumbs
          if (parsedData.schoolLevel) {
            setSchoolLevelName('Secondary') // Fallback, replace with API call if available
          }
          
          if (parsedData.form) {
            setFormName('Form 12') // Fallback, replace with API call if available
          }
          
          if (parsedData.term) {
            setTermName('Term 30') // Fallback, replace with API call if available
>>>>>>> 5a2d579 (fixed login in issue to databse)
          }
        }
      } catch (error) {
        console.error('Error loading subjects:', error)
      }
    }
<<<<<<< HEAD

    loadSubjects()
  }, [session, currentSubject, setCurrentSubjectState])

  // Load topics when current subject changes
  useEffect(() => {
    const loadTopics = async () => {
      if (currentSubject?.id) {
        try {
          const topics = await topicApi.getBySubjectId(currentSubject.id)
          setAvailableTopics(topics || [])
        } catch (error) {
          console.error('Error loading topics:', error)
        }
      }
    }

    loadTopics()
  }, [currentSubject])

  // Update analytics when selected slots change
  useEffect(() => {
    updateAnalytics()
  }, [selectedSlots, updateAnalytics])

  // Auto-hide instructions after user starts using the timetable
  useEffect(() => {
    if (selectedSlots.length > 2 && showInstructions) {
      const timer = setTimeout(() => {
        setShowInstructions(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [selectedSlots.length, showInstructions])
=======
    
    if (session?.user?.email) {
      loadSchemeData()
    }
  }, [session, setCurrentSubjectState])

  // Update analytics in real-time when slots change
  useEffect(() => {
    updateAnalytics()
    console.log(`📊 Analytics updated: ${selectedSlots.length} slots`)
  }, [selectedSlots, updateAnalytics])

  // Helper functions for display names
  const getSchoolLevelName = (id: string) => {
    return schoolLevelName || 'Secondary'
  }

  const getFormName = (id: string) => {
    return formName || 'Form 12'
  }

  const getTermName = (id: string) => {
    return termName || 'Term 30'
  }

  // Format last save time for display
  const formatLastSaveTime = (timestamp: string) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    return date.toLocaleDateString()
  }

  // Render context breadcrumbs
  const renderContextBreadcrumbs = () => {
    if (!schemeData) return null

    const breadcrumbItems = []
    
    if (schemeData.schoolName) {
      breadcrumbItems.push({
        icon: Building2,
        label: schemeData.schoolName,
        type: 'school'
      })
    }
    
    if (schemeData.schoolLevel) {
      breadcrumbItems.push({
        icon: School,
        label: getSchoolLevelName(schemeData.schoolLevel),
        type: 'level'
      })
    }
    
    if (schemeData.form) {
      breadcrumbItems.push({
        icon: GraduationCap,
        label: getFormName(schemeData.form),
        type: 'form'
      })
    }
    
    if (schemeData.term) {
      breadcrumbItems.push({
        icon: Calendar,
        label: getTermName(schemeData.term),
        type: 'term'
      })
    }

    return (
      <div className="flex items-center space-x-2 text-sm">
        {breadcrumbItems.map((item, index) => {
          const Icon = item.icon
          return (
            <div key={index} className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md">
                <Icon className="h-3 w-3" />
                <span className="font-medium">{item.label}</span>
              </div>
              {index < breadcrumbItems.length - 1 && (
                <ChevronRight className="h-3 w-3 text-gray-400" />
              )}
            </div>
          )
        })}
      </div>
    )
  }
>>>>>>> 5a2d579 (fixed login in issue to databse)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
<<<<<<< HEAD
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Timetable Builder
            </h1>
            <p className="text-lg text-gray-600">
              Create and optimize your weekly teaching schedule
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {canUndo && (
              <Button variant="outline" onClick={undo} className="flex items-center gap-2">
                <Undo2 className="h-4 w-4" />
                Undo
              </Button>
            )}
            <Button variant="outline" onClick={clearAll} className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Clear All
            </Button>
            <Button onClick={saveToStorage} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Save
            </Button>
          </div>
        </div>

        {/* Subject Selection */}
        {availableSubjects.length > 0 && (
          <Card className="border-blue-200 bg-white shadow-sm">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-gray-700">Current Subject:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableSubjects.map(subject => (
                    <Button
                      key={subject.id}
                      variant={currentSubject?.id === subject.id ? "default" : "outline"}
                      onClick={() => {
                        setCurrentSubject(subject)
                        setCurrentSubjectState(subject)
                      }}
                      className="flex items-center gap-2"
                    >
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: subject.color }}
                      />
                      {subject.name}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions Panel */}
        {showInstructions && (
          <TimetableInstructions 
            onDismiss={() => setShowInstructions(false)}
            hasSelectedSlots={selectedSlots.length > 0}
          />
        )}

        {/* Topic and Subtopic Selection */}
        {availableTopics.length > 0 && (
          <Card className="border-gray-200 bg-white shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-purple-600" />
                Learning Content
              </CardTitle>
              <CardDescription>
                Select topics and subtopics to include in your lessons
=======
        {/* Enhanced Header with Context */}
        <div className="space-y-4">
          {/* Breadcrumb Context */}
          {schemeData && (
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                {renderContextBreadcrumbs()}
                <div className="text-xs text-gray-500">
                  Academic Context
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowContextModal(true)}
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit Context
              </Button>
            </div>
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
                <div className="flex items-center gap-2 text-blue-600">
                  <Save className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Saving to database...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-green-600">
                  <Database className="h-4 w-4" />
                  <span className="text-sm">Saved to database</span>
                  {lastSaveTime && (
                    <span className="text-xs text-gray-500">
                      {formatLastSaveTime(lastSaveTime)}
                    </span>
                  )}
                </div>
              )}
              
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                <Clock className="h-3 w-3 mr-1" />
                Workload: {workloadLevel}
              </Badge>
              
              <Button variant="outline" size="sm" onClick={() => undo()} disabled={!canUndo}>
                <Undo2 className="h-4 w-4 mr-1" />
                Undo
              </Button>
              
              <Button variant="outline" size="sm" onClick={clearAll} disabled={selectedSlots.length === 0}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Clear All
              </Button>
              
              {timetableId && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDeleteTimetable}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
              
              <Button onClick={handleManualSave} className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="h-4 w-4 mr-1" />
                Save to DB
              </Button>
            </div>
          </div>
        </div>

        {/* Instructions Modal */}
        <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                How to Use the Timetable Builder
              </DialogTitle>
            </DialogHeader>
            <TimetableInstructions onClose={() => setShowInstructions(false)} />
          </DialogContent>
        </Dialog>

        {/* Topics and Subtopics Selection - FROM SCHEME OF WORK */}
        {schemeData && (
          <Card className="border-l-4 border-l-emerald-500 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                <span>Select Content for Your Timetable</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Database className="h-3 w-3 mr-1" />
                  Auto-saves to Database
                </Badge>
              </CardTitle>
              <CardDescription>
                Choose the topics and subtopics you want to include in your teaching schedule (from your scheme of work)
>>>>>>> 5a2d579 (fixed login in issue to databse)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Topics Section */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    Topics ({availableTopics.length} available)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {availableTopics.map(topic => (
                      <Button
                        key={topic.id}
                        variant={selectedTopicIds.includes(topic.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleTopicSelection(topic.id)}
                        className="text-sm"
                      >
<<<<<<< HEAD
                        {topic.title}
                        {selectedTopicIds.includes(topic.id) && (
                          <CheckCircle2 className="h-3 w-3 ml-1" />
                        )}
                      </Button>
=======
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">
                                {topic.title || `Topic #${topic.id}`}
                              </span>
                              {selectedTopicIds.includes(topic.id) && (
                                <Badge className="bg-blue-600 text-white">Selected</Badge>
                              )}
                            </div>
                            {topic.description && (
                              <p className="text-sm text-gray-600">{topic.description}</p>
                            )}
                            {topic.learning_objectives && topic.learning_objectives.length > 0 && (
                              <p className="text-sm text-blue-600">
                                Objectives: {topic.learning_objectives.slice(0, 2).join(', ')}
                                {topic.learning_objectives.length > 2 && '...'}
                              </p>
                            )}
                            {topic.duration_weeks && (
                              <span className="text-xs text-gray-500">
                                Duration: {topic.duration_weeks} weeks
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
>>>>>>> 5a2d579 (fixed login in issue to databse)
                    ))}
                  </div>
                </div>

                {/* Subtopics Section */}
                {availableSubtopics.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <List className="h-4 w-4 text-purple-600" />
                      Subtopics ({availableSubtopics.length} available)
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {availableSubtopics.map(subtopic => (
                        <Button
                          key={subtopic.id}
                          variant={selectedSubtopicIds.includes(subtopic.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleSubtopicSelection(subtopic.id)}
                          className="text-sm"
                        >
                          {subtopic.title}
                          {selectedSubtopicIds.includes(subtopic.id) && (
                            <CheckCircle2 className="h-3 w-3 ml-1" />
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
<<<<<<< HEAD
                )}

                {/* Selection Summary */}
                {(selectedTopicIds.length > 0 || selectedSubtopicIds.length > 0) && (
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
                    <h4 className="font-medium text-emerald-900 mb-2">Selection Summary</h4>
                    <div className="space-y-2 text-sm">
                      {selectedTopicIds.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <Target className="h-3 w-3 text-blue-600" />
                          <span className="text-gray-700">
                            <strong>{selectedTopicIds.length}</strong> topics selected
                          </span>
=======
                  <div className="grid gap-2">
                    {availableSubtopics.map((subtopic) => (
                      <div
                        key={subtopic.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedSubtopicIds.includes(subtopic.id)
                            ? 'border-purple-500 bg-purple-50 shadow-md'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                        }`}
                        onClick={() => toggleSubtopicSelection(subtopic.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">
                                {subtopic.title || `Subtopic #${subtopic.id}`}
                              </span>
                              {selectedSubtopicIds.includes(subtopic.id) && (
                                <Badge variant="outline" className="border-purple-500 text-purple-700 text-xs">
                                  Selected
                                </Badge>
                              )}
                            </div>
                            {subtopic.content && (
                              <p className="text-xs text-gray-600 line-clamp-2">{subtopic.content}</p>
                            )}
                            {subtopic.activities && subtopic.activities.length > 0 && (
                              <p className="text-xs text-purple-600">
                                {subtopic.activities.length} activities planned
                              </p>
                            )}
                            {subtopic.duration_lessons && (
                              <span className="text-xs text-gray-500">
                                {subtopic.duration_lessons} lessons
                              </span>
                            )}
                          </div>
>>>>>>> 5a2d579 (fixed login in issue to databse)
                        </div>
                      )}
                      {selectedSubtopicIds.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <List className="h-3 w-3 text-purple-600" />
                          <span className="text-gray-700">
                            <strong>{selectedSubtopicIds.length}</strong> subtopics selected
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

<<<<<<< HEAD
                {/* No Content Available */}
                {availableTopics.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No topics available</p>
                    <p className="text-sm">Topics will appear here based on your scheme of work selection</p>
                  </div>
                )}
              </div>
=======
              {/* Selection Summary */}
              {(selectedTopicIds.length > 0 || selectedSubtopicIds.length > 0) && (
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
                  <h4 className="font-medium text-emerald-900 mb-2">Selection Summary</h4>
                  <div className="space-y-2 text-sm">
                    {selectedTopicIds.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <Target className="h-3 w-3 text-blue-600" />
                        <span className="text-gray-700">
                          <strong>{selectedTopicIds.length}</strong> topics selected
                        </span>
                      </div>
                    )}
                    {selectedSubtopicIds.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <List className="h-3 w-3 text-purple-600" />
                        <span className="text-gray-700">
                          <strong>{selectedSubtopicIds.length}</strong> subtopics selected
                        </span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 pt-2 border-t border-emerald-200">
                      <Database className="h-3 w-3 text-green-600" />
                      <span className="text-green-700 text-xs">
                        All selections automatically saved to database
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* No Content Available */}
              {availableTopics.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No topics available</p>
                  <p className="text-sm">Topics will appear here based on your scheme of work selection</p>
                  {!showInstructions && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowInstructions(true)}
                      className="mt-2 text-blue-600 hover:text-blue-700"
                    >
                      Show Help
                    </Button>
                  )}
                </div>
              )}
>>>>>>> 5a2d579 (fixed login in issue to databse)
            </CardContent>
          </Card>
        )}

        {/* Conflict Warnings */}
        {conflictWarnings.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              ⚠️ Scheduling conflicts detected: {conflictWarnings.join(', ')}
            </AlertDescription>
          </Alert>
        )}

<<<<<<< HEAD
        {/* Main Content Grid - Give more space to timetable */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
=======
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
>>>>>>> 5a2d579 (fixed login in issue to databse)
          
          {/* Timetable Grid - Takes most space (2/3 of the width) */}
          <div className="xl:col-span-2">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Weekly Schedule Grid
                  <Badge variant="outline" className="text-xs">
                    Click to Toggle
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    <Database className="h-3 w-3 mr-1" />
                    Database Synced
                  </Badge>
                </CardTitle>
                {!showInstructions && selectedSlots.length === 0 && (
                  <CardDescription className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" />
<<<<<<< HEAD
                    Click any time slot to start building your timetable
=======
                    Click any time slot to start building your timetable. All changes are automatically saved to the database.
>>>>>>> 5a2d579 (fixed login in issue to databse)
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowInstructions(true)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Show Help
                    </Button>
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

<<<<<<< HEAD
          {/* Analysis Panel - Takes remaining space (1/3 of the width) */}
          <div className="xl:col-span-1 space-y-6">
            <AnalysisPanel analytics={analytics} />
=======
          {/* Analysis Panel */}
          <div className="xl:col-span-2 space-y-6">
            <AnalysisPanel 
              analytics={analytics} 
              isAutoSaving={isAutoSaving}
              lastSaveTime={lastSaveTime}
            />
>>>>>>> 5a2d579 (fixed login in issue to databse)
            <AITipsPanel tips={aiTips} workloadLevel={workloadLevel} />
          </div>
        </div>

        {/* Progress Summary Footer */}
        {selectedSlots.length > 0 && (
          <Card className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white shadow-lg">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-bold mb-1">
                    {analytics.totalSessions} Teaching Sessions Planned
                  </h3>
                  <p className="text-emerald-100">
                    {analytics.totalHours} hours per week • {analytics.patternType} pattern
                  </p>
                  <div className="flex items-center gap-2 mt-2">
<<<<<<< HEAD
                    <Sparkles className="h-4 w-4 text-emerald-200" />
                    <span className="text-sm text-emerald-100">
                      {selectedSlots.length < 3 ? 'Getting Started' : 
                       selectedSlots.length < 6 ? 'Good Progress' : 'Well Planned'}
=======
                    <Sparkles className="h-4 w-4 text-blue-200" />
                    <span className="text-sm text-blue-100">
                      {selectedSlots.length < 3 ? 'Getting Started' : 
                       selectedSlots.length < 6 ? 'Building Momentum' : 'Comprehensive Schedule'}
                    </span>
                    <Database className="h-4 w-4 text-blue-200" />
                    <span className="text-sm text-blue-100">
                      Saved to Database
>>>>>>> 5a2d579 (fixed login in issue to databse)
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="secondary" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export Schedule
                  </Button>
                  <Button variant="secondary" className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Context Modal for additional settings */}
        <Dialog open={showContextModal} onOpenChange={setShowContextModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Timetable Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">School Level</label>
                  <input 
                    type="text" 
                    value={schoolLevelName}
                    onChange={(e) => setSchoolLevelName(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., Primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Form/Grade</label>
                  <input 
                    type="text" 
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., Form 1"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Term</label>
                  <input 
                    type="text" 
                    value={termName}
                    onChange={(e) => setTermName(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., Term 1"
                  />
                </div>
<<<<<<< HEAD
=======
                
                {currentSubject && (
                  <div className="p-4 bg-emerald-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <BookOpen className="h-4 w-4 text-emerald-600" />
                      <span className="font-medium">Selected Subject:</span>
                      <span>{currentSubject.name}</span>
                    </div>
                    
                    {selectedTopicIds.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-sm font-medium text-gray-700">Selected Topics:</span>
                        <div className="flex flex-wrap gap-1">
                          {availableTopics
                            .filter(topic => selectedTopicIds.includes(topic.id))
                            .map((topic, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {topic.title || `Topic #${topic.id}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedSubtopicIds.length > 0 && (
                      <div className="space-y-1 mt-2">
                        <span className="text-sm font-medium text-gray-700">Selected Subtopics:</span>
                        <div className="flex flex-wrap gap-1">
                          {availableSubtopics
                            .filter(subtopic => selectedSubtopicIds.includes(subtopic.id))
                            .map((subtopic, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {subtopic.title || `Subtopic #${subtopic.id}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {timetableId && (
                      <div className="space-y-1 mt-2 pt-2 border-t border-emerald-200">
                        <div className="flex items-center space-x-2">
                          <Database className="h-3 w-3 text-emerald-600" />
                          <span className="text-sm font-medium text-gray-700">Database ID:</span>
                          <code className="text-xs bg-emerald-100 px-1 py-0.5 rounded">
                            {timetableId}
                          </code>
                        </div>
                      </div>
                    )}
                  </div>
                )}
>>>>>>> 5a2d579 (fixed login in issue to databse)
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowContextModal(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowContextModal(false)}>
                  Save Settings
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}