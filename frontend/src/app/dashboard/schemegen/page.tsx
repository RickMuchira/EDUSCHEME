"use client"

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Loader2, 
  Zap, 
  Download, 
  Edit3, 
  Save, 
  FileText, 
  Settings, 
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  Calendar,
  BookOpen,
  GraduationCap,
  Building2,
  Clock,
  Users,
  Target,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'

interface SchemeWeek {
  week_number: number
  theme?: string
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
  const { data: session } = useSession()
  
  // State Management
  const [context, setContext] = useState<SchemeContext | null>(null)
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

  // Load context data on mount
  useEffect(() => {
    const loadContext = async () => {
      try {
        const contextParam = searchParams.get('context')
        if (contextParam) {
          const parsedContext = JSON.parse(decodeURIComponent(contextParam))
          
          // Fetch additional context from API
          const userGoogleId = session?.user?.email
          if (userGoogleId && parsedContext.schemeId) {
            const schemeResponse = await apiClient.get(`/api/schemes/${parsedContext.schemeId}`, {
              user_google_id: userGoogleId
            })
            
            if (schemeResponse.success) {
              const fullContext: SchemeContext = {
                ...parsedContext,
                school_name: schemeResponse.data.school_name,
                subject_name: schemeResponse.data.subject_name,
                form_grade: schemeResponse.data.form_grade_name,
                term: schemeResponse.data.term_name,
                academic_year: new Date().getFullYear().toString(),
                totalWeeks: 13, // Default term length
                totalLessons: parsedContext.lessonSlots?.length || 0
              }
              setContext(fullContext)
            }
          }
        } else {
          setError('No context data found. Please start from the timetable page.')
        }
      } catch (error) {
        console.error('Error loading context:', error)
        setError('Failed to load context data.')
      }
    }
    
    loadContext()
  }, [searchParams, session])

  // Generate scheme using AI
  const generateScheme = async () => {
    if (!context || !session?.user?.email) return
    
    setIsGenerating(true)
    setGenerationProgress(0)
    setError('')
    
    try {
      setGenerationStatus('Preparing data for AI generation...')
      setGenerationProgress(10)
      
      // Fetch complete timetable data
      const timetableResponse = await apiClient.get(`/api/timetables/by-scheme/${context.schemeId}`, {
        user_google_id: session.user.email
      })
      
      let timetableData = {}
      if (timetableResponse.success && timetableResponse.data) {
        timetableData = timetableResponse.data
      }
      
      const generationData = {
        context: {
          ...context,
          timetable_data: timetableData
        },
        config: generationConfig,
        user_google_id: session.user.email
      }
      
      setGenerationStatus('Sending to Groq AI model...')
      setGenerationProgress(30)
      
      // Call the AI generation endpoint
      const response = await apiClient.post('/api/schemes/generate', generationData)
      
      if (response.success) {
        setGenerationStatus('Processing AI response...')
        setGenerationProgress(70)
        
        // Simulate processing time for better UX
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setGenerationStatus('Finalizing scheme...')
        setGenerationProgress(90)
        
        setGeneratedScheme(response.data.scheme_content.weeks)
        setGenerationProgress(100)
        setGenerationStatus('Generation complete!')
        
        // Auto-hide status after success
        setTimeout(() => {
          setGenerationStatus('')
          setGenerationProgress(0)
        }, 2000)
        
      } else {
        throw new Error(response.message || 'Generation failed')
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
      
      if (response.success) {
        // Show success message and redirect
        setTimeout(() => {
          router.push('/dashboard/my-schemes')
        }, 2000)
      } else {
        throw new Error(response.message || 'Save failed')
      }
    } catch (error: any) {
      console.error('Save error:', error)
      setError(`Save failed: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Export functionality
  const exportScheme = async (format: 'pdf' | 'docx') => {
    if (!context || !generatedScheme.length) return
    
    try {
      const exportData = {
        scheme_id: context.schemeId,
        format,
        content: generatedScheme,
        context
      }
      
      const response = await fetch('/api/schemes/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData)
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `${context.subject_name}-${context.form_grade}-${context.term}-Scheme.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  const toggleWeekExpansion = (weekNumber: number) => {
    const newExpanded = new Set(expandedWeeks)
    if (newExpanded.has(weekNumber)) {
      newExpanded.delete(weekNumber)
    } else {
      newExpanded.add(weekNumber)
    }
    setExpandedWeeks(newExpanded)
  }

  if (!context) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Context</h2>
          <p className="text-gray-600">Preparing scheme generation...</p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg max-w-md">
              <p className="text-red-600">{error}</p>
              <Button 
                onClick={() => router.push('/dashboard/timetable')} 
                className="mt-2"
                variant="outline"
              >
                Back to Timetable
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">AI Scheme Generator</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transform your timetable into a comprehensive scheme of work using advanced AI
          </p>
        </div>

        {/* Context Card */}
        <Card className="border-l-4 border-l-blue-500 bg-blue-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">School</p>
                  <p className="text-sm text-blue-700">{context.school_name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Subject</p>
                  <p className="text-sm text-blue-700">{context.subject_name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Form & Term</p>
                  <p className="text-sm text-blue-700">{context.form_grade} - {context.term}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Lessons</p>
                  <p className="text-sm text-blue-700">{context.totalLessons} lessons planned</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuration Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>AI Generation Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">AI Model</label>
              <Select 
                value={generationConfig.model} 
                onValueChange={(value: any) => setGenerationConfig({...generationConfig, model: value})}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="llama3-8b-8192">Llama 3 8B (Fast)</SelectItem>
                  <SelectItem value="llama3-70b-8192">Llama 3 70B (Advanced)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Generation Style</label>
              <Select 
                value={generationConfig.style} 
                onValueChange={(value: any) => setGenerationConfig({...generationConfig, style: value})}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="detailed">Detailed & Comprehensive</SelectItem>
                  <SelectItem value="concise">Concise & Focused</SelectItem>
                  <SelectItem value="exam-focused">Exam-Focused</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Curriculum Standard</label>
              <Select 
                value={generationConfig.curriculum_standard} 
                onValueChange={(value: any) => setGenerationConfig({...generationConfig, curriculum_standard: value})}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KICD">KICD (Kenya)</SelectItem>
                  <SelectItem value="Cambridge">Cambridge</SelectItem>
                  <SelectItem value="IB">International Baccalaureate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Language Level</label>
              <Select 
                value={generationConfig.language_complexity} 
                onValueChange={(value: any) => setGenerationConfig({...generationConfig, language_complexity: value})}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Generation Progress */}
        {(isGenerating || generationStatus) && (
          <Card className="border-l-4 border-l-purple-500 bg-purple-50">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Loader2 className={cn("h-6 w-6", isGenerating ? "animate-spin text-purple-600" : "text-green-600")} />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-purple-900">{generationStatus}</span>
                      <span className="text-sm text-purple-700">{generationProgress}%</span>
                    </div>
                    <Progress value={generationProgress} className="h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center">
          {!generatedScheme.length ? (
            <Button 
              onClick={generateScheme} 
              disabled={isGenerating}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Zap className="h-5 w-5 mr-2" />
              {isGenerating ? 'Generating...' : 'Generate Scheme of Work'}
            </Button>
          ) : (
            <div className="flex gap-4">
              <Button 
                onClick={saveScheme} 
                disabled={isSaving}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Scheme'}
              </Button>
              
              <Button 
                onClick={() => exportScheme('pdf')} 
                variant="outline"
                size="lg"
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              
              <Button 
                onClick={() => exportScheme('docx')} 
                variant="outline"
                size="lg"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export Word
              </Button>
              
              <Button 
                onClick={generateScheme} 
                variant="outline"
                size="lg"
                disabled={isGenerating}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-l-4 border-l-red-500 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-red-600">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Generated Scheme Preview */}
        {generatedScheme.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Generated Scheme of Work</h2>
              <Badge variant="secondary" className="text-sm">
                {generatedScheme.length} weeks • {generatedScheme.reduce((total, week) => total + week.lessons.length, 0)} lessons
              </Badge>
            </div>
            
            <div className="space-y-4">
              {generatedScheme.map((week) => (
                <Card key={week.week_number} className="overflow-hidden">
                  <CardHeader 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleWeekExpansion(week.week_number)}
                  >
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        {expandedWeeks.has(week.week_number) ? (
                          <ChevronDown className="h-5 w-5" />
                        ) : (
                          <ChevronRight className="h-5 w-5" />
                        )}
                        <Calendar className="h-5 w-5" />
                        <span>Week {week.week_number}</span>
                        {week.theme && <span className="text-gray-600">- {week.theme}</span>}
                      </CardTitle>
                      <Badge variant="outline">
                        {week.lessons.length} lesson{week.lessons.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  {expandedWeeks.has(week.week_number) && (
                    <CardContent>
                      <div className="space-y-6">
                        {week.lessons.map((lesson) => (
                          <div key={lesson.lesson_number} className="border rounded-lg p-4 bg-gray-50">
                            <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                              <div className="lg:col-span-1">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                    {lesson.lesson_number}
                                  </div>
                                  <span className="text-sm font-medium text-gray-600">Lesson {lesson.lesson_number}</span>
                                </div>
                              </div>
                              
                              <div className="lg:col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Topic/Subtopic</label>
                                <p className="text-sm font-medium text-gray-900 mt-1">{lesson.topic_subtopic}</p>
                              </div>
                              
                              <div className="lg:col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Specific Objectives</label>
                                <ul className="text-sm text-gray-900 mt-1 space-y-1">
                                  {lesson.specific_objectives.map((objective, idx) => (
                                    <li key={idx} className="flex items-start space-x-2">
                                      <span className="text-blue-600 mt-1">•</span>
                                      <span>{objective}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              <div className="lg:col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Teaching/Learning Activities</label>
                                <ul className="text-sm text-gray-900 mt-1 space-y-1">
                                  {lesson.teaching_learning_activities.map((activity, idx) => (
                                    <li key={idx} className="flex items-start space-x-2">
                                      <span className="text-green-600 mt-1">•</span>
                                      <span>{activity}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              <div className="lg:col-span-7 grid grid-cols-1 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                                <div>
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Materials/Resources</label>
                                  <ul className="text-sm text-gray-900 mt-1 space-y-1">
                                    {lesson.materials_resources.map((material, idx) => (
                                      <li key={idx} className="flex items-start space-x-2">
                                        <span className="text-purple-600 mt-1">•</span>
                                        <span>{material}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                
                                <div>
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">References</label>
                                  <p className="text-sm text-gray-900 mt-1 font-medium">{lesson.references}</p>
                                </div>
                                
                                <div>
                                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Remarks</label>
                                  <p className="text-sm text-gray-600 mt-1 italic">{lesson.remarks || 'No remarks'}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 