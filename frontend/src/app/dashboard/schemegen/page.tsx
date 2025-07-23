'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertCircle, ArrowLeft, Download, FileText } from 'lucide-react'
import apiClient from '@/lib/apiClient'

interface SchemeWeek {
  week_number: number
  theme?: string
  learning_focus?: string
  lessons: SchemeLesson[]
}

interface SchemeLesson {
  lesson_number: number
  topic_subtopic: string
  specific_objectives: string[]
  teaching_learning_activities: string[]
  materials_resources: string[]
  references: string
  remarks: string
}

interface GenerationConfig {
  model: 'llama3-8b-8192' | 'llama3-70b-8192'
  style: 'detailed' | 'concise' | 'exam-focused'
  curriculum_standard: 'KICD' | 'Cambridge' | 'IB'
  language_complexity: 'simple' | 'intermediate' | 'advanced'
}

interface SchemeContext {
  timetableId: string
  schemeId: string
  school_name: string
  subject_name: string
  form_grade: string
  term: string
  academic_year: string
  school_level: string
  selectedTopics: any[]
  selectedSubtopics: any[]
  lessonSlots: any[]
  totalWeeks: number
  totalLessons: number
}

export default function SchemeGeneratorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status: sessionStatus } = useSession()
  
  // State Management
  const [context, setContext] = useState<SchemeContext | null>(null)
  const [isLoadingContext, setIsLoadingContext] = useState(true)
  const [generationConfig, setGenerationConfig] = useState<GenerationConfig>({
    model: 'llama3-8b-8192',
    style: 'detailed',
    curriculum_standard: 'KICD',
    language_complexity: 'intermediate'
  })
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStatus, setGenerationStatus] = useState('')
  const [generatedScheme, setGeneratedScheme] = useState<SchemeWeek[]>([])
  const [selectedWeek, setSelectedWeek] = useState<number>(1)
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]))
  const [isEditing, setIsEditing] = useState(false) // FIXED: This was "setIsfrontend" before
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  // Check if context is incomplete (improved logic)
  const isIncompleteContext = !context || 
    context.school_name === 'School Name' || 
    context.subject_name === 'Subject' ||
    context.form_grade === 'Form 1' ||
    context.term === 'Term 1' ||
    !context.school_name ||
    !context.subject_name

  // Improved context loading with DB priority, then localStorage, then demo
  useEffect(() => {
    const loadContext = async () => {
      console.log('🔄 Starting enhanced context load...')
      console.log('Session status:', sessionStatus)
      console.log('Session data:', session)

      if (sessionStatus === 'loading') {
        console.log('⏳ Session still loading, waiting...')
        return
      }

      if (sessionStatus === 'unauthenticated') {
        console.log('🚫 User not authenticated, redirecting to login')
        router.push('/login')
        return
      }

      try {
        const schemeId = searchParams.get('schemeId')
        console.log('📋 SchemeId from URL:', schemeId)
        if (!schemeId) {
          console.log('❌ No scheme ID found in URL')
          setError('No scheme ID found. Please start from the timetable page.')
          setIsLoadingContext(false)
          return
        }

        const userGoogleId = (session?.user as any)?.id || (session?.user as any)?.sub || session?.user?.email
        console.log('👤 User Google ID:', userGoogleId)
        if (!userGoogleId) {
          console.log('❌ No user ID found in session')
          setError('User session not found. Please log in again.')
          setIsLoadingContext(false)
          return
        }

        // Step 1: Try to load scheme data from API
        let scheme = null
        try {
          const schemeResponse = await apiClient.get(`/api/schemes/${schemeId}`, {
            user_google_id: userGoogleId
          })
          console.log('📊 Raw API Response:', schemeResponse)
          if (schemeResponse?.success === true && schemeResponse?.data) {
            console.log('✅ Got ResponseWrapper format with data')
            scheme = schemeResponse.data
          } else if (schemeResponse?.id && typeof schemeResponse.id === 'number') {
            console.log('✅ Got direct Pydantic model format')
            scheme = schemeResponse
          } else if (schemeResponse?.success === false) {
            console.log('❌ API returned error:', schemeResponse.message)
            throw new Error(schemeResponse.message || 'API returned error')
          } else {
            console.log('⚠️ Unknown response format:', schemeResponse)
            throw new Error('Unexpected response format from API')
          }
        } catch (apiError) {
          console.error('🚨 API Error Details:', apiError)
          scheme = null
        }

        // Step 2: Try to load timetable data from API
        let timetableData = null
        try {
          const timetableResponse = await apiClient.get(`/api/timetables/by-scheme/${schemeId}`, {
            user_google_id: userGoogleId
          })
          console.log('📅 Timetable API Response:', timetableResponse)
          if (timetableResponse?.success === true && timetableResponse?.data) {
            timetableData = timetableResponse.data
          } else if (timetableResponse?.success === false) {
            console.log('❌ Timetable API returned error:', timetableResponse.message)
            timetableData = null
          } else {
            timetableData = null
          }
        } catch (ttError) {
          console.error('⚠️ Error loading timetable from API:', ttError)
          timetableData = null
        }

        // Step 3: Build comprehensive context
        let finalContext: SchemeContext
        if (scheme) {
          // Build context from database scheme + timetable data
          console.log('🏗️ Building context from database scheme and timetable')
          finalContext = {
            timetableId: timetableData?.id?.toString() || 'default',
            schemeId: schemeId,
            school_name: scheme.school_name || 'Unknown School',
            subject_name: scheme.subject_name || 'Unknown Subject',
            form_grade: scheme.form_grade_name || scheme.form_grade || 'Unknown Grade',
            term: scheme.term_name || scheme.term || 'Unknown Term',
            academic_year: scheme.academic_year || new Date().getFullYear().toString(),
            school_level: scheme.school_level_name || 'Secondary',
            selectedTopics: timetableData?.selected_topics || [],
            selectedSubtopics: timetableData?.selected_subtopics || [],
            lessonSlots: timetableData?.slots || [],
            totalWeeks: timetableData?.total_weeks || 13,
            totalLessons: timetableData?.total_lessons || 0
          }
          console.log('✅ Successfully built database context:', finalContext)
          setContext(finalContext)
        } else {
          // Fallback: Create demo context
          console.log('🎭 Creating demo context for testing')
          finalContext = {
            timetableId: 'demo',
            schemeId: schemeId,
            school_name: 'Demo High School',
            subject_name: 'Mathematics',
            form_grade: 'Form 1',
            term: 'Term 1',
            academic_year: new Date().getFullYear().toString(),
            school_level: 'Secondary',
            selectedTopics: [
              { id: 1, title: "Algebra Basics" },
              { id: 2, title: "Linear Equations" }
            ],
            selectedSubtopics: [
              { id: 1, title: "Variables and Constants" },
              { id: 2, title: "Simple Expressions" }
            ],
            lessonSlots: [
              { day: 'Monday', time: '08:00-09:00', topic: 'Algebra Basics' },
              { day: 'Tuesday', time: '08:00-09:00', topic: 'Linear Equations' }
            ],
            totalWeeks: 13,
            totalLessons: 2
          }
          setContext(finalContext)
          setError('Cannot connect to backend database. Using demo context - AI generation will still work for testing purposes.')
        }
        console.log('🎯 Final context set:', finalContext)
      } catch (error: any) {
        console.error('💥 Critical error in context loading:', error)
        const emergencyContext: SchemeContext = {
          timetableId: 'emergency',
          schemeId: searchParams.get('schemeId') || 'unknown',
          school_name: 'Emergency Demo School',
          subject_name: 'Mathematics',
          form_grade: 'Form 1',
          term: 'Term 1',
          academic_year: new Date().getFullYear().toString(),
          school_level: 'Secondary',
          selectedTopics: [],
          selectedSubtopics: [],
          lessonSlots: [],
          totalWeeks: 13,
          totalLessons: 0
        }
        setContext(emergencyContext)
        setError(`System error: ${error.message}. Using emergency demo context.`)
      } finally {
        setIsLoadingContext(false)
      }
    }
    loadContext()
  }, [searchParams, session, sessionStatus, router])

  // Generate scheme function
  const generateScheme = async () => {
    if (!context || !session?.user?.email) return

    setIsGenerating(true)
    setError('')
    setGenerationProgress(0)
    setGenerationStatus('Starting generation...')

    try {
      setGenerationStatus('Preparing context and timetable data...')
      setGenerationProgress(25)

      // Prepare the context with proper timetable integration
      const generationContext = {
        // Basic scheme information
        school_name: context.school_name,
        subject_name: context.subject_name,
        form_grade: context.form_grade,
        term: context.term,
        academic_year: context.academic_year,
        school_level: context.school_level,
        
        // Timetable data for AI
        selectedTopics: context.selectedTopics,
        selectedSubtopics: context.selectedSubtopics,
        lessonSlots: context.lessonSlots,
        totalLessons: context.totalLessons,
        totalWeeks: context.totalWeeks,
        
        // Additional context
        timetable_data: {
          selected_topics: context.selectedTopics,
          selected_subtopics: context.selectedSubtopics,
          slots: context.lessonSlots,
          total_lessons: context.totalLessons,
          total_weeks: context.totalWeeks
        }
      }

      setGenerationStatus('Sending request to AI service...')
      setGenerationProgress(50)

      console.log('🚀 Sending generation request with context:', generationContext)

      // Send generation request with proper structure
      const userGoogleId = (session.user as any).id || (session.user as any).sub || session.user.email
      const response = await apiClient.post(
        '/api/schemes/generate',
        {
          context: generationContext,
          generation_config: generationConfig
        },
        {
          user_google_id: userGoogleId
        }
      )

      console.log('🔍 Generation API response:', response)
      
      setGenerationStatus('Processing AI response...')
      setGenerationProgress(75)

      // Handle different response formats more robustly
      if (response && typeof response === 'object') {
        if (response.success === true && response.data) {
          console.log('✅ Generation success with ResponseWrapper format')
          const weeks = response.data.weeks || response.data.scheme_content?.weeks || []
          setGeneratedScheme(weeks)
          setGenerationStatus('Generation completed successfully!')
          setGenerationProgress(100)
        } else if (response.success === false) {
          console.log('❌ Generation API returned success: false')
          console.log('❌ Error message:', response.message)
          throw new Error(response.message || response.error || 'Generation failed')
        } else if (response.weeks && Array.isArray(response.weeks)) {
          console.log('✅ Direct weeks data format')
          setGeneratedScheme(response.weeks)
          setGenerationStatus('Generation completed successfully!')
          setGenerationProgress(100)
        } else if (response.scheme_content?.weeks) {
          console.log('✅ Nested scheme content format')
          setGeneratedScheme(response.scheme_content.weeks)
          setGenerationStatus('Generation completed successfully!')
          setGenerationProgress(100)
        } else if (Array.isArray(response)) {
          console.log('✅ Direct array format')
          setGeneratedScheme(response)
          setGenerationStatus('Generation completed successfully!')
          setGenerationProgress(100)
        } else {
          console.log('⚠️ Unexpected generation response format:', response)
          console.log('Response keys:', Object.keys(response))
          throw new Error('Unexpected response format from generation API')
        }
      } else {
        console.log('❌ Invalid generation response type:', typeof response)
        throw new Error('Invalid response from generation API')
      }
    } catch (error: any) {
      console.error('Generation error:', error)
      setError(`Generation failed: ${error.message}`)
      setGenerationProgress(0)
      setGenerationStatus('Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  // Save generated scheme
  const saveScheme = async () => {
    if (!context || !generatedScheme.length || !session?.user?.email) return
    
    setIsSaving(true)
    setError('')
    
    try {
      // Get the correct Google ID from session
      const userGoogleId = (session.user as any).id || (session.user as any).sub || session.user.email
      
      const saveData = {
        generated_content: {
          weeks: generatedScheme,
          metadata: {
            generated_at: new Date().toISOString(),
            ai_model: generationConfig.model,
            generation_config: generationConfig
          }
        },
        ai_model_used: generationConfig.model,
        user_google_id: userGoogleId
      }
      
      console.log('💾 Saving scheme with data:', saveData)
      console.log('🔑 User Google ID:', userGoogleId)
      console.log('📧 User email:', session.user.email)
      console.log('📋 Scheme ID:', context.schemeId)
      console.log('📊 Generated scheme weeks:', generatedScheme.length)
      
      const response = await apiClient.put(`/api/schemes/${context.schemeId}/content`, saveData, {
        user_google_id: userGoogleId
      })
      
      console.log('📥 Save response:', response)
      console.log('✅ Response success:', response?.success)
      console.log('📝 Response message:', response?.message)
      console.log('📊 Response data:', response?.data)
      
      if (response && response.success) {
        setGenerationStatus('Scheme saved successfully!')
        setTimeout(() => setGenerationStatus(''), 3000)
      } else {
        console.error('❌ Save failed - Full response:', response)
        throw new Error(response?.message || 'Failed to save scheme')
      }
    } catch (error: any) {
      console.error('Save error:', error)
      setError(`Failed to save scheme: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  // PDF Download function
  const downloadPDF = async () => {
    if (!context?.schemeId) {
      setError('No scheme available for PDF generation')
      return
    }

    try {
      setIsSaving(true)
      const userGoogleId = (session?.user as any)?.id || (session?.user as any)?.sub || session?.user?.email
      
      console.log('📄 Downloading PDF for scheme:', context.schemeId)
      
      // Create the download URL
      const downloadUrl = `/api/schemes/${context.schemeId}/pdf?user_google_id=${encodeURIComponent(userGoogleId)}`
      const fullUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}${downloadUrl}`
      
      // Create a temporary link element and trigger download
      const link = document.createElement('a')
      link.href = fullUrl
      link.download = `Scheme_of_Work_${context.subject_name}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setGenerationStatus('PDF download started!')
      setTimeout(() => setGenerationStatus(''), 3000)
      
    } catch (error: any) {
      console.error('PDF download error:', error)
      setError(`Failed to download PDF: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Loading state
  if (isLoadingContext) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading scheme context...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">AI Scheme Generator</h1>
          <p className="text-gray-600 mt-2">Generate comprehensive schemes of work using AI</p>
        </div>

        {/* Context Display */}
        {context && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Scheme Context</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">School:</span> {context.school_name}
                </div>
                <div>
                  <span className="font-medium">Subject:</span> {context.subject_name}
                </div>
                <div>
                  <span className="font-medium">Form/Grade:</span> {context.form_grade}
                </div>
                <div>
                  <span className="font-medium">Term:</span> {context.term}
                </div>
                <div>
                  <span className="font-medium">Total Weeks:</span> {context.totalWeeks}
                </div>
                <div>
                  <span className="font-medium">Total Lessons:</span> {context.totalLessons}
                </div>
              </div>

              {/* Explicitly list selected topics, subtopics, and lesson slots */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <span className="font-semibold text-blue-700">Selected Topics:</span>
                  <ul className="list-disc list-inside text-sm mt-1">
                    {context.selectedTopics && context.selectedTopics.length > 0 ? (
                      context.selectedTopics.map((topic: any, idx: number) => (
                        <li key={topic.id || idx}>{topic.title || topic.name || JSON.stringify(topic)}</li>
                      ))
                    ) : (
                      <li className="text-gray-400">None selected</li>
                    )}
                  </ul>
                </div>
                <div>
                  <span className="font-semibold text-blue-700">Selected Subtopics:</span>
                  <ul className="list-disc list-inside text-sm mt-1">
                    {context.selectedSubtopics && context.selectedSubtopics.length > 0 ? (
                      context.selectedSubtopics.map((sub: any, idx: number) => (
                        <li key={sub.id || idx}>{sub.title || sub.name || JSON.stringify(sub)}</li>
                      ))
                    ) : (
                      <li className="text-gray-400">None selected</li>
                    )}
                  </ul>
                </div>
                <div>
                  <span className="font-semibold text-blue-700">Lesson Slots:</span>
                  <ul className="list-disc list-inside text-sm mt-1">
                    {context.lessonSlots && context.lessonSlots.length > 0 ? (
                      context.lessonSlots.map((slot: any, idx: number) => (
                        <li key={idx}>
                          {slot.day || slot.day_of_week || 'Day'} {slot.time || slot.time_slot || ''} {slot.topic || slot.lesson_title || ''}
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-400">No slots added</li>
                    )}
                  </ul>
                </div>
              </div>

              {isIncompleteContext && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
                    <div className="text-sm text-yellow-700">
                      <strong>Notice:</strong> Some context data is incomplete. The AI will still generate a basic scheme, but for best results, ensure you have proper school, subject, and grade information.
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <div className="text-sm">
                <p className="text-red-700">
                  {isIncompleteContext && context?.school_name === 'School Name' 
                    ? 'The scheme context is incomplete. Please ensure you have selected a real school, subject, form/grade, and term. You may need to create a new scheme or return to the timetable.'
                    : error}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button
                    onClick={async () => {
                      setError('')
                      setIsLoadingContext(true)
                      // Test different API endpoints
                      try {
                        const userGoogleId = (session?.user as any)?.id || (session?.user as any)?.sub || session?.user?.email
                        if (userGoogleId) {
                          // Test 1: Try to get all schemes
                          console.log('Testing API endpoint: /api/schemes')
                          const response = await apiClient.get('/api/schemes', {
                            user_google_id: userGoogleId
                          })
                          console.log('All schemes response:', response)
                          
                          if (response.success && response.data && response.data.length > 0) {
                            const firstScheme = response.data[0]
                            router.push(`/dashboard/schemegen?schemeId=${firstScheme.id}`)
                          } else if (Array.isArray(response) && response.length > 0) {
                            // Direct array response
                            const firstScheme = response[0]
                            router.push(`/dashboard/schemegen?schemeId=${firstScheme.id}`)
                          } else {
                            router.push('/dashboard/scheme-of-work')
                          }
                        }
                      } catch (err) {
                        console.error('Find schemes error:', err)
                        router.push('/dashboard/scheme-of-work')
                      } finally {
                        setIsLoadingContext(false)
                      }
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Find Available Schemes
                  </Button>
                  <Button
                    onClick={() => router.push('/dashboard/scheme-of-work')}
                    variant="outline"
                    size="sm"
                  >
                    Create New Scheme
                  </Button>
                  <Button
                    onClick={() => router.push('/dashboard/timetable')}
                    variant="outline"
                    size="sm"
                  >
                    Back to Timetable
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generation Configuration */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Generation Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">AI Model</label>
                <select
                  value={generationConfig.model}
                  onChange={(e) => setGenerationConfig(prev => ({ 
                    ...prev, 
                    model: e.target.value as GenerationConfig['model']
                  }))}
                  className="w-full p-2 border rounded-md"
                  disabled={isIncompleteContext}
                >
                  <option value="llama3-8b-8192">Llama 3 8B (Fast)</option>
                  <option value="llama3-70b-8192">Llama 3 70B (Detailed)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Style</label>
                <select
                  value={generationConfig.style}
                  onChange={(e) => setGenerationConfig(prev => ({ 
                    ...prev, 
                    style: e.target.value as GenerationConfig['style']
                  }))}
                  className="w-full p-2 border rounded-md"
                  disabled={isIncompleteContext}
                >
                  <option value="detailed">Detailed</option>
                  <option value="concise">Concise</option>
                  <option value="exam-focused">Exam Focused</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Curriculum</label>
                <select
                  value={generationConfig.curriculum_standard}
                  onChange={(e) => setGenerationConfig(prev => ({ 
                    ...prev, 
                    curriculum_standard: e.target.value as GenerationConfig['curriculum_standard']
                  }))}
                  className="w-full p-2 border rounded-md"
                  disabled={isIncompleteContext}
                >
                  <option value="KICD">KICD</option>
                  <option value="Cambridge">Cambridge</option>
                  <option value="IB">IB</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Language</label>
                <select
                  value={generationConfig.language_complexity}
                  onChange={(e) => setGenerationConfig(prev => ({ 
                    ...prev, 
                    language_complexity: e.target.value as GenerationConfig['language_complexity']
                  }))}
                  className="w-full p-2 border rounded-md"
                  disabled={isIncompleteContext}
                >
                  <option value="simple">Simple</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
            
            <Button 
              onClick={generateScheme}
              disabled={isGenerating || !context}
              className="w-full bg-blue-600 hover:bg-blue-700 mt-4"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Scheme'
              )}
            </Button>

            {/* Test API Connection Button */}
            {process.env.NODE_ENV === 'development' && (
              <Button 
                onClick={async () => {
                  try {
                    const response = await apiClient.get('/health')
                    console.log('Health check response:', response)
                    setGenerationStatus('✅ API connection working!')
                    setTimeout(() => setGenerationStatus(''), 3000)
                  } catch (error) {
                    console.error('Health check failed:', error)
                    setError(`API connection failed: ${(error as any).message}`)
                  }
                }}
                variant="outline"
                className="w-full mt-2"
              >
                Test API Connection
              </Button>
            )}
            
            {/* Generation Progress */}
            {(isGenerating || generationStatus) && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{generationStatus}</span>
                  <span>{generationProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Generated Scheme Display */}
        {generatedScheme.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Generated Scheme
                <div className="flex gap-2">
                  <Button onClick={downloadPDF} disabled={isSaving} variant="outline" size="sm">
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Preparing PDF...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </>
                    )}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {generatedScheme.map((week) => (
                  <div key={week.week_number} className="border rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-2 flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Week {week.week_number}
                      {week.theme && ` - ${week.theme}`}
                    </h3>
                    <div className="space-y-2">
                      {week.lessons.map((lesson) => (
                        <div key={lesson.lesson_number} className="border-l-4 border-blue-500 pl-4">
                          <h4 className="font-medium">Lesson {lesson.lesson_number}: {lesson.topic_subtopic}</h4>
                          <div className="text-sm text-gray-600 mt-1">
                            <strong>Objectives:</strong> {lesson.specific_objectives?.join(', ') || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            <strong>Activities:</strong> {lesson.teaching_learning_activities?.join(', ') || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            <strong>Materials:</strong> {lesson.materials_resources?.join(', ') || 'N/A'}
                          </div>
                          {lesson.references && (
                            <div className="text-sm text-gray-600 mt-1">
                              <strong>References:</strong> {lesson.references}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex gap-2">
                <Button onClick={saveScheme} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Scheme'
                  )}
                </Button>
                
                <Button onClick={downloadPDF} disabled={isSaving || !context?.schemeId} variant="outline">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Preparing PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Debug Information Panel (only show in development) */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mb-6 bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm">Debug Information</CardTitle>
            </CardHeader>
            <CardContent className="text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <strong>URL Parameters:</strong>
                  <br />
                  Scheme ID: {searchParams.get('schemeId')}
                  <br />
                  Session Status: {sessionStatus}
                  <br />
                  User Email: {session?.user?.email || 'None'}
                </div>
                <div>
                  <strong>Context Status:</strong>
                  <br />
                  Loading: {isLoadingContext.toString()}
                  <br />
                  Context Available: {context ? 'Yes' : 'No'}
                  <br />
                  Error: {error || 'None'}
                </div>
                <div>
                  <strong>Generation:</strong>
                  <br />
                  Is Generating: {isGenerating.toString()}
                  <br />
                  Progress: {generationProgress}%
                  <br />
                  Generated Weeks: {generatedScheme.length}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}