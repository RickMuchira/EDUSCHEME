// frontend/src/app/dashboard/timetable/page.tsx
"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Calendar, 
  Clock, 
  Brain, 
  Save, 
  Download, 
  Share2,
  Undo2,
  RotateCcw,
  Settings,
  Edit,
  CheckCircle2,
  Sparkles,
  Info,
  AlertTriangle,
  Database,
  Play,
  ArrowRight
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
import { subjectApi, topicApi, subtopicApi } from '@/lib/api'
import { useSession } from 'next-auth/react'

export default function TimetablePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([])
  const [currentSubject, setCurrentSubject] = useState<any>(null)
  const [availableTopics, setAvailableTopics] = useState<any[]>([])
  const [availableSubtopics, setAvailableSubtopics] = useState<any[]>([])
  const [selectedTopicIds, setSelectedTopicIds] = useState<number[]>([])
  const [selectedSubtopicIds, setSelectedSubtopicIds] = useState<number[]>([])
  const [showContextModal, setShowContextModal] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const {
    timetableData,
    selectedSlots,
    currentSubject: currentSubjectState,
    selectedTopics,
    selectedSubtopics,
    history,
    historyIndex,
    timetableId,
    addSlot,
    removeSlot,
    setSelectedTopics,
    setSelectedSubtopics,
    loadState,
    canUndo,
    canRedo,
    undo,
    redo,
    clearHistory,
    reset,
    lastSaveTime,
    isAutoSaving,
    selectedScheme,
    setSelectedScheme
  } = useTimetableState()

  const { analytics, conflictWarnings } = useTimetableAnalytics(selectedSlots)

  // Load subjects on component mount
  useEffect(() => {
    loadSubjects()
  }, [])

  // Load topics when subject changes
  useEffect(() => {
    if (currentSubject?.id) {
      loadTopicsBySubject(currentSubject.id)
    }
  }, [currentSubject])

  // Load subtopics when topics are selected
  useEffect(() => {
    if (selectedTopicIds.length > 0) {
      loadSubtopicsByTopics(selectedTopicIds)
    } else {
      setAvailableSubtopics([])
    }
  }, [selectedTopicIds])

  const loadSubjects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔄 Loading subjects...')
      const response = await subjectApi.getAll()
      
      if (response.success && response.data) {
        setAvailableSubjects(response.data)
        console.log('✅ Subjects loaded:', response.data.length)
        
        // Set first subject as default if none selected
        if (response.data.length > 0 && !currentSubject) {
          const firstSubject = response.data[0]
          setCurrentSubject(firstSubject)
          console.log('📝 Default subject set:', firstSubject.name)
        }
      } else {
        throw new Error(response.message || 'Failed to load subjects')
      }
    } catch (error: any) {
      console.error('❌ Error loading subjects:', error)
      setError(`Failed to load subjects: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const loadTopicsBySubject = async (subjectId: number) => {
    try {
      setLoading(true)
      console.log('🔄 Loading topics for subject:', subjectId)
      
      const response = await topicApi.getBySubject(subjectId)
      
      if (response.success && response.data) {
        setAvailableTopics(response.data)
        console.log('✅ Topics loaded:', response.data.length)
        
        // Clear previous selections
        setSelectedTopicIds([])
        setAvailableSubtopics([])
        setSelectedSubtopicIds([])
      } else {
        throw new Error(response.message || 'Failed to load topics')
      }
    } catch (error: any) {
      console.error('❌ Error loading topics:', error)
      setError(`Failed to load topics: ${error.message}`)
      setAvailableTopics([])
    } finally {
      setLoading(false)
    }
  }

  const loadSubtopicsByTopics = async (topicIds: number[]) => {
    try {
      setLoading(true)
      console.log('🔄 Loading subtopics for topics:', topicIds)
      
      // Load subtopics for all selected topics
      const allSubtopics: any[] = []
      
      for (const topicId of topicIds) {
        const response = await subtopicApi.getByTopic(topicId)
        if (response.success && response.data) {
          allSubtopics.push(...response.data)
        }
      }
      
      setAvailableSubtopics(allSubtopics)
      console.log('✅ Subtopics loaded:', allSubtopics.length)
      
      // Clear previous subtopic selections
      setSelectedSubtopicIds([])
    } catch (error: any) {
      console.error('❌ Error loading subtopics:', error)
      setError(`Failed to load subtopics: ${error.message}`)
      setAvailableSubtopics([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubjectChange = (subjectId: string) => {
    const subject = availableSubjects.find(s => s.id.toString() === subjectId)
    if (subject) {
      setCurrentSubject(subject)
      console.log('📝 Subject changed to:', subject.name)
    }
  }

  const handleTopicSelect = (topicId: number, checked: boolean) => {
    setSelectedTopicIds(prev => {
      if (checked) {
        return [...prev, topicId]
      } else {
        return prev.filter(id => id !== topicId)
      }
    })
  }

  const handleSubtopicSelect = (subtopicId: number, checked: boolean) => {
    setSelectedSubtopicIds(prev => {
      if (checked) {
        return [...prev, subtopicId]
      } else {
        return prev.filter(id => id !== subtopicId)
      }
    })
  }

  const handleBulkTopicSelect = (topicIds: number[], selected: boolean) => {
    if (selected) {
      setSelectedTopicIds(prev => [...new Set([...prev, ...topicIds])])
    } else {
      setSelectedTopicIds(prev => prev.filter(id => !topicIds.includes(id)))
    }
  }

  const handleBulkSubtopicSelect = (subtopicIds: number[], selected: boolean) => {
    if (selected) {
      setSelectedSubtopicIds(prev => [...new Set([...prev, ...subtopicIds])])
    } else {
      setSelectedSubtopicIds(prev => prev.filter(id => !subtopicIds.includes(id)))
    }
  }

  const handleSlotClick = useCallback((slot: any) => {
    if (!currentSubject) {
      alert('Please select a subject first.')
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
      removeSlot(slot.day, slot.timeSlot)
      console.log(`🗑️ Removed slot: ${slot.day} ${slot.timeSlot}`)
    } else {
      // Get selected topic and subtopic data for timetable slots
      const selectedTopicData = availableTopics.filter(topic => selectedTopicIds.includes(topic.id))
      const selectedSubtopicData = availableSubtopics.filter(subtopic => selectedSubtopicIds.includes(subtopic.id))

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

  const handleSaveAndContinue = async () => {
    try {
      setIsSaving(true)
      
      // Check if there's content to save
      if (selectedSlots.length === 0) {
        alert('Please add some time slots to your timetable before saving.')
        return
      }

      if (!currentSubject) {
        alert('Please select a subject before saving.')
        return
      }

      console.log('💾 Saving timetable to database...')
      
      // The timetable data is auto-saved by the useTimetableState hook
      // which already handles database persistence
      
      // Wait a moment for any pending auto-save to complete
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      console.log('✅ Timetable saved successfully!')
      console.log('📊 Final timetable data:', {
        subject: currentSubject.name,
        topicsSelected: selectedTopicIds.length,
        subtopicsSelected: selectedSubtopicIds.length,
        slotsScheduled: selectedSlots.length,
        timetableId: timetableId
      })
      
      // Navigate to scheme generation page
      router.push('/dashboard/scheme-gen')
      
    } catch (error) {
      console.error('❌ Error saving timetable:', error)
      alert('Error saving timetable. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportTimetable = () => {
    // Export functionality
    console.log('📄 Exporting timetable...')
    alert('Export functionality coming soon!')
  }

  const handleResetTimetable = () => {
    if (confirm('Are you sure you want to reset your timetable? This action cannot be undone.')) {
      reset()
      setSelectedTopicIds([])
      setSelectedSubtopicIds([])
      console.log('🔄 Timetable reset successfully')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Context Modal - Show current setup */}
        <Dialog open={showContextModal} onOpenChange={setShowContextModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Current Timetable Context
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Academic Context</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Subject:</span> {currentSubject?.name || 'Not selected'}</p>
                    <p><span className="font-medium">Code:</span> {currentSubject?.code || 'N/A'}</p>
                    <p><span className="font-medium">Status:</span> {currentSubject?.is_active ? 'Active' : 'Inactive'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Content Selection</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Topics Selected:</span> {selectedTopicIds.length}</p>
                    <p><span className="font-medium">Subtopics Selected:</span> {selectedSubtopicIds.length}</p>
                    <p><span className="font-medium">Total Slots:</span> {selectedSlots.length}</p>
                  </div>
                </div>
              </div>

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

        {/* Main Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-full">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Interactive Timetable Builder</h1>
              <p className="text-gray-600">Design your perfect teaching schedule with enhanced content selection</p>
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
            {isAutoSaving || isSaving ? (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 animate-pulse">
                <Save className="h-3 w-3 mr-1" />
                {isSaving ? 'Saving...' : 'Auto-saving...'}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Saved
              </Badge>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowContextModal(true)}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <Edit className="h-4 w-4 mr-2" />
              View Context
            </Button>

            <Button 
              variant="default" 
              size="sm"
              onClick={handleSaveAndContinue}
              className="bg-green-600 hover:bg-green-700"
              disabled={selectedSlots.length === 0 || isSaving}
            >
              {isSaving ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Save & Continue
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Instructions Panel */}
        {showInstructions && (
          <TimetableInstructions onClose={() => setShowInstructions(false)} />
        )}

        {/* Enhanced Content Selection Panel */}
        <ContentSelectionPanel
          subjects={availableSubjects}
          currentSubject={currentSubject}
          availableTopics={availableTopics}
          availableSubtopics={availableSubtopics}
          selectedTopicIds={selectedTopicIds}
          selectedSubtopicIds={selectedSubtopicIds}
          loading={loading}
          error={error}
          onSubjectChange={handleSubjectChange}
          onTopicSelect={handleTopicSelect}
          onSubtopicSelect={handleSubtopicSelect}
          onBulkTopicSelect={handleBulkTopicSelect}
          onBulkSubtopicSelect={handleBulkSubtopicSelect}
        />

        {/* Success message when content is selected */}
        {selectedTopicIds.length > 0 || selectedSubtopicIds.length > 0 ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              ✅ Great! You've selected your content. Now click on time slots below to build your timetable.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              📚 Please select a subject and choose topics/subtopics first, then you can start building your timetable.
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
          
          {/* Timetable Grid */}
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
                {!showInstructions && selectedSlots.length === 0 && (selectedTopicIds.length > 0 || selectedSubtopicIds.length > 0) && (
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

          {/* Analysis Panel */}
          <div className="xl:col-span-1">
            <AnalysisPanel 
              analytics={analytics} 
              isAutoSaving={isAutoSaving || isSaving}
              lastSaveTime={lastSaveTime}
            />
          </div>

          {/* AI Tips Panel */}
          <div className="xl:col-span-1">
            <AITipsPanel 
              selectedSlots={selectedSlots}
              analytics={analytics}
              conflictWarnings={conflictWarnings}
            />
          </div>
        </div>

        {/* Action Buttons */}
        {selectedSlots.length > 0 && (
          <div className="flex justify-center space-x-4 pt-6">
            <Button variant="outline" onClick={handleResetTimetable}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Timetable
            </Button>
            
            <Button variant="outline" onClick={handleExportTimetable}>
              <Download className="h-4 w-4 mr-2" />
              Export Schedule
            </Button>
            
            <Button variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Share Timetable
            </Button>
            
            <Button 
              onClick={handleSaveAndContinue}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Save className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Continue to Scheme Generation
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}