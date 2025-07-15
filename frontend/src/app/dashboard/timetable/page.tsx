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
  Info
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

  // Toggle subtopic selection
  const toggleSubtopicSelection = useCallback((subtopicId: number) => {
    setSelectedSubtopicIds(prev => 
      prev.includes(subtopicId)
        ? prev.filter(id => id !== subtopicId)
        : [...prev, subtopicId]
    )
  }, [])

  // Handle slot click
  const handleSlotClick = useCallback((slot: LessonSlot) => {
    const isCurrentlySelected = selectedSlots.some(
      s => s.day === slot.day && s.timeSlot === slot.timeSlot
    )

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
  useEffect(() => {
    const loadSubjects = async () => {
      try {
        if (session?.user?.email) {
          const subjects = await subjectApi.getAll()
          setAvailableSubjects(subjects || [])
          
          if (subjects && subjects.length > 0 && !currentSubject) {
            setCurrentSubject(subjects[0])
            setCurrentSubjectState(subjects[0])
          }
        }
      } catch (error) {
        console.error('Error loading subjects:', error)
      }
    }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
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
                        {topic.title}
                        {selectedTopicIds.includes(topic.id) && (
                          <CheckCircle2 className="h-3 w-3 ml-1" />
                        )}
                      </Button>
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
              </div>
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

        {/* Main Content Grid - Give more space to timetable */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Timetable Grid - Takes most space (2/3 of the width) */}
          <div className="xl:col-span-2">
            <Card className="shadow-lg border-0 bg-white">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Weekly Schedule Grid
                </CardTitle>
                {!showInstructions && selectedSlots.length === 0 && (
                  <CardDescription className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    Click any time slot to start building your timetable
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

          {/* Analysis Panel - Takes remaining space (1/3 of the width) */}
          <div className="xl:col-span-1 space-y-6">
            <AnalysisPanel analytics={analytics} />
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
                    <Sparkles className="h-4 w-4 text-emerald-200" />
                    <span className="text-sm text-emerald-100">
                      {selectedSlots.length < 3 ? 'Getting Started' : 
                       selectedSlots.length < 6 ? 'Good Progress' : 'Well Planned'}
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