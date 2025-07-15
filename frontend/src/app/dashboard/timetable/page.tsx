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
  Edit
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import TimetableGrid from './components/TimetableGrid'
import AnalysisPanel from './components/AnalysisPanel'
import AITipsPanel from './components/AITipsPanel'
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
  
  const {
    timetableData,
    selectedSlots,
    currentSubject: currentSubjectState,
    setCurrentSubject: setCurrentSubjectState,
    addSlot,
    removeSlot,
    createDoubleLesson,
    clearAll,
    undo,
    saveToStorage,
    loadFromStorage,
    canUndo
  } = useTimetableState()

  const {
    analytics,
    aiTips,
    workloadLevel,
    conflictWarnings,
    updateAnalytics
  } = useTimetableAnalytics(selectedSlots)

  // Toggle topic selection
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
      
      return newSelection
    })
  }, [])

  // Toggle subtopic selection
  const toggleSubtopicSelection = useCallback((subtopicId: number) => {
    setSelectedSubtopicIds(prev => 
      prev.includes(subtopicId)
        ? prev.filter(id => id !== subtopicId)
        : [...prev, subtopicId]
    )
  }, [])

  // Load subtopics for selected topics
  const loadSubtopicsForTopics = async (topicIds: number[]) => {
    try {
      console.log('Loading subtopics for topic IDs:', topicIds)
      const allSubtopics = []
      for (const topicId of topicIds) {
        const subtopicsResponse = await subtopicApi.getByTopic(topicId)
        console.log(`Subtopics response for topic ${topicId}:`, subtopicsResponse)
        
        // Handle different response formats
        let subtopicsData = []
        if (subtopicsResponse.success && subtopicsResponse.data) {
          subtopicsData = subtopicsResponse.data
        } else if (Array.isArray(subtopicsResponse)) {
          subtopicsData = subtopicsResponse
        } else if (subtopicsResponse.data && Array.isArray(subtopicsResponse.data)) {
          subtopicsData = subtopicsResponse.data
        }
        
        if (subtopicsData.length > 0) {
          allSubtopics.push(...subtopicsData)
        }
      }
      console.log('All loaded subtopics:', allSubtopics)
      setAvailableSubtopics(allSubtopics)
      
      // Clear selected subtopics that are no longer available
      setSelectedSubtopicIds(prev => 
        prev.filter(id => allSubtopics.some(st => st.id === id))
      )
    } catch (error) {
      console.error('Error loading subtopics:', error)
      setAvailableSubtopics([])
    }
  }

  useEffect(() => {
    const loadSchemeData = async () => {
      try {
        // Get scheme data from localStorage first
        const savedSchemeData = localStorage.getItem('schemeFormData')
        if (savedSchemeData) {
          const parsedData = JSON.parse(savedSchemeData)
          console.log('Loaded scheme data:', parsedData)
          setSchemeData(parsedData)
          
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
                  
                  // Load topics for this subject
                  console.log('Loading topics for subject ID:', selectedSubjectData.id)
                  const topicsResponse = await topicApi.getBySubject(selectedSubjectData.id)
                  console.log('Topics response:', topicsResponse)
                  
                  // Handle different response formats
                  let topicsData = []
                  if (topicsResponse.success && topicsResponse.data) {
                    topicsData = topicsResponse.data
                  } else if (Array.isArray(topicsResponse)) {
                    // Handle direct array response
                    topicsData = topicsResponse
                  } else if (topicsResponse.data && Array.isArray(topicsResponse.data)) {
                    // Handle nested data array
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
            try {
              // You can implement these API calls if available
              setSchoolLevelName('Secondary') // Fallback, replace with API call
            } catch (error) {
              console.warn('Could not load school level name')
            }
          }
          
          if (parsedData.form) {
            try {
              setFormName('Form 12') // Fallback, replace with API call
            } catch (error) {
              console.warn('Could not load form name')
            }
          }
          
          if (parsedData.term) {
            try {
              setTermName('Term 30') // Fallback, replace with API call
            } catch (error) {
              console.warn('Could not load term name')
            }
          }
        }
      } catch (error) {
        console.error('Error loading scheme data:', error)
      }
    }
    
    if (session?.user?.email) {
      loadSchemeData()
    }
  }, [session])

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedSlots.length > 0) {
        saveToStorage()
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [selectedSlots, saveToStorage])

  const handleSlotClick = useCallback((day: string, period: number, timeSlot: string) => {
    if (!currentSubject) {
      // Show alert that subject context is missing
      alert('No subject found in your scheme of work. Please check your scheme setup.')
      return
    }

    if (selectedTopicIds.length === 0 && selectedSubtopicIds.length === 0) {
      // Show alert to select content first
      alert('Please select at least one topic or subtopic to include in your timetable.')
      return
    }

    const existingSlotIndex = selectedSlots.findIndex(
      slot => slot.day === day && slot.period === period
    )

    if (existingSlotIndex >= 0) {
      removeSlot(day, period)
    } else {
      // Get selected topic and subtopic names for timetable slots
      const selectedTopicNames = availableTopics
        .filter(topic => selectedTopicIds.includes(topic.id))
        .map(topic => topic.title || `Topic #${topic.id}`)
      
      const selectedSubtopicNames = availableSubtopics
        .filter(subtopic => selectedSubtopicIds.includes(subtopic.id))
        .map(subtopic => subtopic.title || `Subtopic #${subtopic.id}`)

      const newSlot: LessonSlot = {
        id: `${day}-${period}-${Date.now()}`,
        day,
        period,
        timeSlot,
        subject: currentSubject.name,
        subjectId: currentSubject.id,
        duration: 40,
        topics: selectedTopicNames,
        subtopics: selectedSubtopicNames
      }
      addSlot(newSlot)
    }
  }, [currentSubject, selectedSlots, selectedTopicIds, selectedSubtopicIds, availableTopics, availableSubtopics, addSlot, removeSlot])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
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
                <p className="text-gray-600">Design your perfect teaching schedule with AI-powered insights</p>
              </div>
            </div>
            
            {/* Status Badge */}
            <div className="flex items-center space-x-3">
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                <Clock className="h-3 w-3 mr-1" />
                Workload: optimal
              </Badge>
              <Button variant="outline" size="sm" onClick={() => undo()} disabled={!canUndo}>
                <Undo2 className="h-4 w-4 mr-1" />
                Undo
              </Button>
              <Button variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-1" />
                Clear All
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="h-4 w-4 mr-1" />
                Save Progress
              </Button>
            </div>
          </div>
        </div>

        {/* Topics and Subtopics Selection */}
        {schemeData && (
          <Card className="border-l-4 border-l-emerald-500 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-emerald-600" />
                <span>Select Content for Your Timetable</span>
              </CardTitle>
              <CardDescription>
                Choose the topics and subtopics you want to include in your teaching schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Subject Display */}
              {currentSubject && (
                <div className="flex items-center space-x-2 p-3 bg-emerald-50 rounded-lg">
                  <BookOpen className="h-4 w-4 text-emerald-600" />
                  <span className="font-medium text-emerald-900">Subject:</span>
                  <span className="text-emerald-800">{currentSubject.name}</span>
                  <Badge variant="outline" className="border-emerald-200 text-emerald-700">
                    {currentSubject.code}
                  </Badge>
                </div>
              )}

              {/* Available Topics */}
              {availableTopics.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-gray-900">Available Topics</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {availableTopics.length} topics
                    </Badge>
                  </div>
                  <div className="grid gap-3">
                    {availableTopics.map((topic) => (
                      <div
                        key={topic.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedTopicIds.includes(topic.id)
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                        }`}
                        onClick={() => toggleTopicSelection(topic.id)}
                      >
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
                              <p className="text-sm text-gray-600">{topic.title}</p>
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
                    ))}
                  </div>
                </div>
              )}

              {/* Available Subtopics for Selected Topics */}
              {availableSubtopics.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <List className="h-4 w-4 text-purple-600" />
                    <span className="font-medium text-gray-900">Available Subtopics</span>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      {availableSubtopics.length} subtopics
                    </Badge>
                  </div>
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
                              <p className="text-xs text-gray-600 line-clamp-2">{subtopic.title}</p>
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
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
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

              {/* No Content Available */}
              {availableTopics.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No topics available</p>
                  <p className="text-sm">Topics will appear here based on your scheme of work selection</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Conflict Warnings */}
        {conflictWarnings.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              ⚠️ Scheduling conflicts detected: {conflictWarnings.join(', ')}
            </AlertDescription>
          </Alert>
        )}


        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Timetable Grid - Takes most space */}
          <div className="xl:col-span-2">
            <Card className="shadow-2xl border-0">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Weekly Schedule Grid
                </CardTitle>
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

          {/* Analysis Panel */}
          <div className="space-y-6">
            <AnalysisPanel analytics={analytics} />
            <AITipsPanel tips={aiTips} workloadLevel={workloadLevel} />
          </div>
        </div>

        {/* Progress Summary Footer */}
        {selectedSlots.length > 0 && (
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">
                    {analytics.totalSessions} Teaching Sessions Planned
                  </h3>
                  <p className="text-blue-100">
                    {analytics.totalHours} hours per week • {analytics.patternType} pattern
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary">
                    <Download className="h-4 w-4 mr-2" />
                    Export Schedule
                  </Button>
                  <Button variant="secondary">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share with Team
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Subject Selection Modal */}
      <Dialog open={showContextModal} onOpenChange={setShowContextModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Academic Context</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {schemeData && (
              <div className="space-y-3">
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">School:</span>
                    <span>{schemeData.schoolName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <School className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">Level:</span>
                    <span>{getSchoolLevelName(schemeData.schoolLevel)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">Form:</span>
                    <span>{getFormName(schemeData.form)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="font-medium">Term:</span>
                    <span>{getTermName(schemeData.term)}</span>
                  </div>
                </div>
                
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
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-end">
              <Button onClick={() => setShowContextModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}