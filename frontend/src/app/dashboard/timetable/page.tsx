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
  Info,
  AlertTriangle,
  Database,
  Trash2
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

  // Load subtopics for selected topics
  const loadSubtopicsForTopics = useCallback(async (topicIds: number[]) => {
    try {
      const allSubtopics: any[] = []
      for (const topicId of topicIds) {
        const subtopics = await subtopicApi.getByTopicId(topicId)
        if (subtopics) {
          allSubtopics.push(...subtopics)
        }
      }
      setAvailableSubtopics(allSubtopics)
    } catch (error) {
      console.error('Error loading subtopics:', error)
    }
  }, [])

  // Toggle topic selection with database auto-save
  const toggleTopicSelection = useCallback(async (topicId: number) => {
    setSelectedTopicIds(prev => {
      const newSelection = prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
      
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
  }, [availableTopics, updateSelectedTopics, loadSubtopicsForTopics])

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
        subtopic: selectedSubtopicData.length > 0 ? selectedSubtopicData[0] : null
      }
      
      addSlot(newSlot)
      console.log(`✅ Added slot: ${slot.day} ${slot.timeSlot}`)
    }
  }, [selectedSlots, removeSlot, addSlot, currentSubject, selectedTopicIds, selectedSubtopicIds, availableTopics, availableSubtopics])

  // Load scheme data and subjects
  const loadSchemeData = useCallback(async () => {
    try {
      // For now, we'll use mock data or fallbacks
      // In a real app, this would fetch from your scheme API
      const mockSchemeData = {
        school_level: 'secondary',
        form: '12',
        term: '30',
        subject: 'chemistry'
      }
      
      setSchemeData(mockSchemeData)
      
      // Load subjects
      const subjects = await subjectApi.getAll()
      if (subjects && subjects.length > 0) {
        setAvailableSubjects(subjects)
        const firstSubject = subjects[0]
        setCurrentSubject(firstSubject)
        setCurrentSubjectState(firstSubject)
        
        // Load topics for the first subject
        const topics = await topicApi.getBySubjectId(firstSubject.id)
        setAvailableTopics(topics || [])
        
        // Set fallback names
        setSchoolLevelName('Secondary')
        setFormName('Form 12')
        setTermName('Term 30')
      }
    } catch (error) {
      console.error('Error loading subjects:', error)
    }
  }, [setCurrentSubjectState])

  // Load data on mount
  useEffect(() => {
    if (session?.user?.email) {
      loadSchemeData()
    }
  }, [session, loadSchemeData])

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

  // Format last save time
  const formatLastSaveTime = (timestamp: string) => {
    if (!timestamp) return 'Never'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Context Information Card */}
        {currentSubject && (
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-3">
                    <School className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">School Level</p>
                      <p className="font-semibold text-gray-900">{getSchoolLevelName(schemeData?.school_level || '')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <GraduationCap className="h-6 w-6 text-emerald-600" />
                    <div>
                      <p className="text-sm text-gray-600">Form</p>
                      <p className="font-semibold text-gray-900">{getFormName(schemeData?.form || '')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-6 w-6 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-600">Term</p>
                      <p className="font-semibold text-gray-900">{getTermName(schemeData?.term || '')}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-6 w-6 text-orange-600" />
                    <div>
                      <p className="text-sm text-gray-600">Subject</p>
                      <p className="font-semibold text-gray-900">{currentSubject.name}</p>
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
          </div>
        </div>

        {/* Instructions Panel */}
        {showInstructions && (
          <TimetableInstructions 
            onClose={() => setShowInstructions(false)}
          />
        )}

        {/* Quick Start Alert */}
        {!showInstructions && selectedSlots.length === 0 && (
          <Alert>
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              You're building your timetable. Keep adding lessons and check the analysis panel for optimization tips.
            </AlertDescription>
          </Alert>
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
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
                    Click any time slot to start building your timetable. All changes are automatically saved to the database.
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
              workloadLevel={workloadLevel}
            />
            
          </div>
        </div>

        {/* Topic and Subtopic Selection */}
        {currentSubject && availableTopics.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Select Topics & Subtopics for {currentSubject.name}
              </CardTitle>
              <CardDescription>
                Choose which topics and subtopics to include in your timetable. Changes are automatically saved.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Topics Selection */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <List className="h-4 w-4" />
                  Topics ({selectedTopicIds.length} selected)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableTopics.map(topic => (
                    <div
                      key={topic.id}
                      onClick={() => toggleTopicSelection(topic.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                        selectedTopicIds.includes(topic.id)
                          ? 'bg-purple-50 border-purple-300 text-purple-800'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-purple-50 hover:border-purple-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{topic.name}</p>
                          {topic.code && (
                            <p className="text-xs opacity-70">{topic.code}</p>
                          )}
                        </div>
                        {selectedTopicIds.includes(topic.id) && (
                          <CheckCircle2 className="h-5 w-5 text-purple-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subtopics Selection */}
              {availableSubtopics.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <ChevronRight className="h-4 w-4" />
                    Subtopics ({selectedSubtopicIds.length} selected)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                    {availableSubtopics.map(subtopic => (
                      <div
                        key={subtopic.id}
                        onClick={() => toggleSubtopicSelection(subtopic.id)}
                        className={`p-2 rounded-md border cursor-pointer transition-all duration-200 text-sm ${
                          selectedSubtopicIds.includes(subtopic.id)
                            ? 'bg-blue-50 border-blue-300 text-blue-800'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{subtopic.name}</span>
                          {selectedSubtopicIds.includes(subtopic.id) && (
                            <CheckCircle2 className="h-3 w-3 text-blue-600 flex-shrink-0 ml-1" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
            </CardContent>
          </Card>
        )}

      </div>

      {/* Context Modal */}
      <Dialog open={showContextModal} onOpenChange={setShowContextModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Timetable Context Details
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            
            {/* Current Context */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <School className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">School Level</p>
                    <p className="font-medium">{getSchoolLevelName(schemeData?.school_level || '')}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="text-sm text-gray-600">Form</p>
                    <p className="font-medium">{getFormName(schemeData?.form || '')}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Term</p>
                    <p className="font-medium">{getTermName(schemeData?.term || '')}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Subject</p>
                    <p className="font-medium">{currentSubject?.name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Current Timetable Statistics</h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{selectedSlots.length}</p>
                  <p className="text-sm text-blue-700">Total Slots</p>
                </div>
                <div className="bg-emerald-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-600">{selectedTopicIds.length}</p>
                  <p className="text-sm text-emerald-700">Topics Selected</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{selectedSubtopicIds.length}</p>
                  <p className="text-sm text-purple-700">Subtopics Selected</p>
                </div>
              </div>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}