'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react'
import apiClient from '@/lib/apiClient'

interface SchemeWeek {
  week_number: number
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
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  // Enhanced context loading with better error recovery
  useEffect(() => {
    const loadContext = async () => {
      console.log('Starting context load...')
      console.log('Session status:', sessionStatus)
      console.log('Session data:', session)

      // Wait for session to be ready
      if (sessionStatus === 'loading') {
        console.log('Session still loading, waiting...')
        return
      }
      
      // Auto-hide status after success
      setTimeout(() => {
        setGenerationStatus('')
        setGenerationProgress(0)
      }, 2000)

      if (sessionStatus === 'unauthenticated') {
        console.log('User not authenticated, redirecting to login')
        router.push('/login')
        return
      }

      try {
        const schemeId = searchParams.get('schemeId')
        console.log('SchemeId from URL:', schemeId)
        
        if (!schemeId) {
          console.log('No scheme ID found in URL')
          setError('No scheme ID found. Please start from the timetable page.')
          setIsLoadingContext(false)
          return
        }

        const userGoogleId = session?.user?.email
        console.log('User Google ID:', userGoogleId)
        
        if (!userGoogleId) {
          console.log('No user ID found in session')
          setError('User session not found. Please log in again.')
          setIsLoadingContext(false)
          return
        }

        // Try to load context data from localStorage first
        let contextData = localStorage.getItem('schemeGenerationContext')
        let parsedContext = null

        if (contextData) {
          try {
            parsedContext = JSON.parse(contextData)
            console.log('Found context data in localStorage:', parsedContext)
          } catch (parseError) {
            console.error('Error parsing localStorage context data:', parseError)
            // Don't return here, we'll try to create a basic context from the API
          }
        } else {
          console.log('No context data found in localStorage')
        }

        // Always try to fetch scheme data from API for the latest info
        console.log('Fetching scheme data from API...')
        try {
          const schemeResponse = await apiClient.get(`/api/schemes/${schemeId}`, {
            user_google_id: userGoogleId
          })
          
          console.log('🔍 Scheme API response:', schemeResponse)
          console.log('🔍 Response type:', typeof schemeResponse)
          console.log('🔍 Response keys:', Object.keys(schemeResponse || {}))
          console.log('🔍 Success field:', schemeResponse?.success)
          console.log('🔍 Message field:', schemeResponse?.message)
          
          // Handle different response formats
          let scheme = null
          
          // Check if it's a ResponseWrapper format
          if (schemeResponse && typeof schemeResponse === 'object') {
            if (schemeResponse.success === true && schemeResponse.data) {
              console.log('✅ Success response with data')
              scheme = schemeResponse.data
            } else if (schemeResponse.success === false) {
              console.log('❌ API returned success: false')
              console.log('❌ Error message:', schemeResponse.message)
              console.log('❌ Full error response:', schemeResponse)
              // Instead of throwing, use fallback context and set error
              if (parsedContext) {
                console.log('Using localStorage context as fallback')
                const fallbackContext = {
                  ...parsedContext,
                  schemeId: schemeId,
                  school_name: parsedContext.school_name || 'School Name',
                  subject_name: parsedContext.subject_name || 'Subject',
                  form_grade: parsedContext.form_grade || 'Form 1',
                  term: parsedContext.term || 'Term 1',
                  academic_year: new Date().getFullYear().toString(),
                  totalWeeks: 13,
                  totalLessons: parsedContext.lessonSlots?.length || 0
                }
                setContext(fallbackContext)
                setError(`API error: ${schemeResponse.message || 'Failed to load scheme data'}. Using cached data.`)
                if (contextData) localStorage.removeItem('schemeGenerationContext')
              } else {
                // Create minimal context to allow page to function
                console.log('Creating minimal context for scheme ID:', schemeId)
                const minimalContext = {
                  timetableId: 'default',
                  schemeId: schemeId,
                  school_name: 'School Name',
                  subject_name: 'Subject',
                  form_grade: 'Form 1',
                  term: 'Term 1',
                  academic_year: new Date().getFullYear().toString(),
                  selectedTopics: [],
                  selectedSubtopics: [],
                  lessonSlots: [],
                  totalWeeks: 13,
                  totalLessons: 0
                }
                setContext(minimalContext)
                setError(`Could not load scheme data: ${schemeResponse.message || 'Unknown error'}. You can still generate a basic scheme.`)
              }
              return;
            } else if (schemeResponse.id) {
              console.log('✅ Direct scheme object response')
              scheme = schemeResponse
            } else {
              console.warn('⚠️ Unexpected response format:', schemeResponse)
              // Use minimal context for unknown format
              const minimalContext = {
                timetableId: 'default',
                schemeId: schemeId,
                school_name: 'School Name',
                subject_name: 'Subject',
                form_grade: 'Form 1',
                term: 'Term 1',
                academic_year: new Date().getFullYear().toString(),
                selectedTopics: [],
                selectedSubtopics: [],
                lessonSlots: [],
                totalWeeks: 13,
                totalLessons: 0
              }
              setContext(minimalContext)
              setError('Unexpected response format from API. You can still generate a basic scheme.')
              return;
            }
          } else {
            console.log('❌ Invalid response type:', typeof schemeResponse)
            throw new Error('Invalid response from API')
          }
          
          if (scheme) {
            // Create full context, merging localStorage data with API data
            const fullContext: SchemeContext = {
              timetableId: parsedContext?.timetableId || 'default',
              schemeId: schemeId,
              school_name: scheme.school_name || 'School Name',
              subject_name: scheme.subject_name || 'Subject',
              form_grade: scheme.form_grade_name || scheme.form_grade || 'Form 1',
              term: scheme.term_name || scheme.term || 'Term 1',
              academic_year: new Date().getFullYear().toString(),
              selectedTopics: parsedContext?.selectedTopics || [],
              selectedSubtopics: parsedContext?.selectedSubtopics || [],
              lessonSlots: parsedContext?.lessonSlots || [],
              totalWeeks: 13, // Default term length
              totalLessons: parsedContext?.lessonSlots?.length || 0
            }
            
            console.log('Setting context:', fullContext)
            setContext(fullContext)
            
            // Clean up localStorage after successful loading
            if (contextData) {
              localStorage.removeItem('schemeGenerationContext')
            }
          } else {
            throw new Error('No scheme data received from API')
          }
        } catch (apiError: any) {
          console.error('API error:', apiError)
          
          // Don't throw error here - instead use fallback context
          console.log('API failed, using fallback context with localStorage data or defaults')
          
          // If we have some context from localStorage, use it as fallback
          if (parsedContext) {
            console.log('Using localStorage context as fallback')
            const fallbackContext: SchemeContext = {
              ...parsedContext,
              schemeId: schemeId,
              school_name: parsedContext.school_name || 'School Name',
              subject_name: parsedContext.subject_name || 'Subject',
              form_grade: parsedContext.form_grade || 'Form 1',
              term: parsedContext.term || 'Term 1',
              academic_year: new Date().getFullYear().toString(),
              totalWeeks: 13,
              totalLessons: parsedContext.lessonSlots?.length || 0
            }
            setContext(fallbackContext)
            localStorage.removeItem('schemeGenerationContext')
            setError(`API connection issue: ${apiError.message}. Using cached data.`)
          } else {
            // Create minimal context to allow page to function
            console.log('Creating minimal context for scheme ID:', schemeId)
            const minimalContext: SchemeContext = {
              timetableId: 'default',
              schemeId: schemeId,
              school_name: 'School Name',
              subject_name: 'Subject',
              form_grade: 'Form 1',
              term: 'Term 1',
              academic_year: new Date().getFullYear().toString(),
              selectedTopics: [],
              selectedSubtopics: [],
              lessonSlots: [],
              totalWeeks: 13,
              totalLessons: 0
            }
            setContext(minimalContext)
            setError(`Could not load scheme data: ${apiError.message}. You can still generate a basic scheme.`)
          }
        }
      } catch (error: any) {
        console.error('Error loading context:', error)
        setError(`Failed to load context data: ${error.message}`)
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
      setGenerationStatus('Generating scheme content...')
      setGenerationProgress(50)


      // Send a single payload object with context and generation_config keys
      const response = await apiClient.post(
        '/api/schemes/generate',
        {
          context,
          generation_config: generationConfig
        },
        {
          user_google_id: session.user.email
        }
      )

      console.log('🔍 Generation API response:', response)
      console.log('🔍 Response type:', typeof response)
      console.log('🔍 Response keys:', Object.keys(response || {}))
      console.log('🔍 Success field:', response?.success)
      console.log('🔍 Message field:', response?.message)

      // Handle different response formats
      if (response && typeof response === 'object') {
        if (response.success === true && response.data) {
          console.log('✅ Generation success with data')
          setGeneratedScheme(response.data.weeks || [])
          setGenerationStatus('Generation completed successfully!')
          setGenerationProgress(100)
        } else if (response.success === false) {
          console.log('❌ Generation API returned success: false')
          console.log('❌ Error message:', response.message)
          console.log('❌ Full error response:', response)
          throw new Error(response.message || 'Generation failed')
        } else if (response.weeks) {
          console.log('✅ Direct weeks data format')
          setGeneratedScheme(response.weeks || [])
          setGenerationStatus('Generation completed successfully!')
          setGenerationProgress(100)
        } else {
          console.log('⚠️ Unexpected generation response format:', response)
          throw new Error('Unexpected response format from generation API')
        }
      } else {
        console.log('❌ Invalid generation response type:', typeof response)
        throw new Error('Invalid response from generation API')
      }
    } catch (error: any) {
      console.error('Generation error:', error)
      setError(`Generation failed: ${error.message}`)
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
        user_google_id: session.user.email
      }
      
      const response = await apiClient.put(`/api/schemes/${context.schemeId}/content`, saveData)
      
      console.log('Save API response:', response)
      
      // Handle different response formats
      if (response && typeof response === 'object') {
        if (response.success === true) {
          // Show success message and redirect
          setTimeout(() => {
            router.push('/dashboard/my-schemes')
          }, 2000)
        } else if (response.success === false) {
          throw new Error(response.message || 'Save failed')
        } else {
          // Assume success if no explicit success field
          setTimeout(() => {
            router.push('/dashboard/my-schemes')
          }, 2000)
        }
      } else {
        throw new Error('Invalid response from save API')
      }
    } catch (error: any) {
      console.error('Save error:', error)
      setError(`Save failed: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Show loading state
  if (sessionStatus === 'loading' || isLoadingContext) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Context</h2>
          <p className="text-gray-600">Preparing scheme generation...</p>
        </div>
      </div>
    )
  }

  // Show error state with recovery options
  if (error && !context) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Error</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-y-2">
            <Button 
              onClick={() => router.push('/dashboard/timetable')} 
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Timetable
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="w-full"
            >
              Retry Loading
            </Button>
          </div>
        </div>
      </div>
    )
  }


  // Check for incomplete context (missing real school/subject info)
  const isIncompleteContext = !!(
    context && (
      !context.school_name || context.school_name === 'School Name' ||
      !context.subject_name || context.subject_name === 'Subject' ||
      !context.form_grade || context.form_grade === 'Form 1' ||
      !context.term || context.term === 'Term 1'
    )
  )

  // Main render with context available
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => router.push('/dashboard/timetable')}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Timetable
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900">AI Scheme Generator</h1>
          <p className="text-gray-600 mt-2">
            Generate a comprehensive scheme of work using AI
          </p>
        </div>

        {/* Error Alert with helpful actions */}
        {(error || isIncompleteContext) && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-orange-500 mr-2 mt-0.5" />
              <div className="flex-1">
                <p className="text-orange-700 mb-3">
                  {isIncompleteContext
                    ? 'The scheme context is incomplete. Please ensure you have selected a real school, subject, form/grade, and term. You may need to create a new scheme or return to the timetable.'
                    : error}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={async () => {
                      setError('')
                      setIsLoadingContext(true)
                      // Try to fetch available schemes
                      try {
                        const userGoogleId = session?.user?.email
                        if (userGoogleId) {
                          const response = await apiClient.get('/api/schemes', {
                            user_google_id: userGoogleId
                          })
                          if (response.success && response.data && response.data.length > 0) {
                            const firstScheme = response.data[0]
                            router.push(`/dashboard/schemegen?schemeId=${firstScheme.id}`)
                          } else {
                            router.push('/dashboard/scheme-of-work')
                          }
                        }
                      } catch (err) {
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
                  Error: {error ? 'Yes' : 'No'}
                </div>
                <div>
                  <strong>Quick Actions:</strong>
                  <br />
                  <button 
                    onClick={() => console.log('Current context:', context)}
                    className="text-blue-600 underline text-xs"
                  >
                    Log Context
                  </button>
                  <br />
                  <button 
                    onClick={() => localStorage.clear()}
                    className="text-blue-600 underline text-xs"
                  >
                    Clear Storage
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {context && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Scheme Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">School:</span>
                  <p className="text-gray-600">{context.school_name}</p>
                </div>
                <div>
                  <span className="font-medium">Subject:</span>
                  <p className="text-gray-600">{context.subject_name}</p>
                </div>
                <div>
                  <span className="font-medium">Form/Grade:</span>
                  <p className="text-gray-600">{context.form_grade}</p>
                </div>
                <div>
                  <span className="font-medium">Term:</span>
                  <p className="text-gray-600">{context.term}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generation Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Generation Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                  <option value="llama3-8b-8192">Llama 3 8B (Faster)</option>
                  <option value="llama3-70b-8192">Llama 3 70B (More Detailed)</option>
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
              disabled={isGenerating || !context || isIncompleteContext}
              className="w-full bg-blue-600 hover:bg-blue-700"
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
              <CardTitle>Generated Scheme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {generatedScheme.map((week) => (
                  <div key={week.week_number} className="border rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-2">Week {week.week_number}</h3>
                    <div className="space-y-2">
                      {week.lessons.map((lesson) => (
                        <div key={lesson.lesson_number} className="border-l-4 border-blue-500 pl-4">
                          <h4 className="font-medium">Lesson {lesson.lesson_number}: {lesson.topic_subtopic}</h4>
                          <div className="text-sm text-gray-600 mt-1">
                            <strong>Objectives:</strong> {lesson.specific_objectives.join(', ')}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            <strong>Activities:</strong> {lesson.teaching_learning_activities.join(', ')}
                          </div>
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
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}