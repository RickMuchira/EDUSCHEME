// Updated dashboard page with proper backend integration
// File: frontend/src/app/dashboard/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Calendar, 
  GraduationCap, 
  Building2, 
  School, 
  Edit, 
  Database,
  Loader2,
  AlertCircle,
  FileText,
  BookOpen
} from 'lucide-react'
import { formGradeApi, termApi } from '@/lib/api'
import apiClient from '@/lib/apiClient'
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentScheme, setCurrentScheme] = useState<any>(null)
  const [showContextModal, setShowContextModal] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [timetableId, setTimetableId] = useState<string | null>(null)
  
  // New state for resolved names
  const [formGradeName, setFormGradeName] = useState<string>('Loading...')
  const [termName, setTermName] = useState<string>('Loading...')
  const [loadingNames, setLoadingNames] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSchemeData()
  }, [])

  // Function to load scheme data from localStorage
  const loadSchemeData = () => {
    try {
      // Try multiple localStorage keys for scheme data
      const schemeData = localStorage.getItem('currentScheme') || 
                        localStorage.getItem('schemeFormData') ||
                        localStorage.getItem('currentSchemeId')
      
      console.log('📊 Dashboard loading scheme data:', schemeData)
      
      if (schemeData) {
        let scheme
        try {
          scheme = JSON.parse(schemeData)
        } catch (parseError) {
          console.warn('⚠️ Failed to parse scheme data, treating as ID:', schemeData)
          // If it's just an ID, we'll need to fetch the full scheme
          if (schemeData.match(/^\d+$/)) {
            loadSchemeById(parseInt(schemeData))
            return
          }
        }
        
        if (scheme && typeof scheme === 'object') {
          console.log('✅ Scheme data loaded:', scheme)
          setCurrentScheme(scheme)
          
          // Resolve the names for form/grade and term
          if (scheme.form_grade_id && scheme.term_id) {
            resolveNames(scheme.form_grade_id, scheme.term_id)
          } else {
            console.warn('⚠️ Scheme missing form_grade_id or term_id')
            setLoadingNames(false)
          }
        }
      } else {
        console.log('ℹ️ No scheme data found in localStorage')
        setLoadingNames(false)
      }
    } catch (error) {
      console.error('❌ Error loading scheme data:', error)
      setError('Failed to load scheme data')
      setLoadingNames(false)
    }
  }

  // Function to load scheme by ID
  const loadSchemeById = async (schemeId: number) => {
    try {
      console.log('🔍 Loading scheme by ID:', schemeId)
      setLoadingNames(true)
      
      const response = await apiClient.get(`/api/schemes/${schemeId}`)
      
      if (response.success && response.data) {
        console.log('✅ Scheme loaded by ID:', response.data)
        setCurrentScheme(response.data)
        
        if (response.data.form_grade_id && response.data.term_id) {
          resolveNames(response.data.form_grade_id, response.data.term_id)
        } else {
          setLoadingNames(false)
        }
      } else {
        throw new Error('Failed to load scheme')
      }
    } catch (error) {
      console.error('❌ Error loading scheme by ID:', error)
      setError(`Failed to load scheme: ${error.message}`)
      setLoadingNames(false)
    }
  }

  // Function to resolve ID to actual names
  const resolveNames = async (formGradeId: number, termId: number) => {
    console.log('🔍 Resolving names for form/grade:', formGradeId, 'term:', termId)
    setLoadingNames(true)
    setError(null)
    
    try {
      const promises = []
      
      // Fetch form/grade name
      if (formGradeId) {
        promises.push(
          formGradeApi.getAll({ id: formGradeId })
            .then(response => {
              console.log('📚 Form/Grade API response:', response)
              if (response.success && response.data && response.data.length > 0) {
                const formGrade = response.data.find(fg => fg.id === formGradeId)
                if (formGrade) {
                  setFormGradeName(formGrade.name)
                  return formGrade.name
                }
              }
              throw new Error('Form/Grade not found')
            })
            .catch(error => {
              console.warn('⚠️ Error fetching form/grade:', error)
              setFormGradeName(`Form/Grade ${formGradeId}`)
              return `Form/Grade ${formGradeId}`
            })
        )
      }

      // Fetch term name
      if (termId) {
        promises.push(
          termApi.getAll({ id: termId })
            .then(response => {
              console.log('📅 Term API response:', response)
              if (response.success && response.data && response.data.length > 0) {
                const term = response.data.find(t => t.id === termId)
                if (term) {
                  setTermName(term.name)
                  return term.name
                }
              }
              throw new Error('Term not found')
            })
            .catch(error => {
              console.warn('⚠️ Error fetching term:', error)
              setTermName(`Term ${termId}`)
              return `Term ${termId}`
            })
        )
      }

      await Promise.all(promises)
      console.log('✅ Name resolution completed')
      
    } catch (error) {
      console.error('❌ Error resolving names:', error)
      setError('Failed to load form/grade and term information')
      // Fallback to showing ID-based names
      setFormGradeName(`Form/Grade ${formGradeId}`)
      setTermName(`Term ${termId}`)
    } finally {
      setLoadingNames(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Error Alert */}
        {error && (
          <Card className="border-l-4 border-l-red-500 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
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
                    <p className="text-sm text-gray-900">{currentScheme.school_name || 'Not specified'}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Subject</label>
                    <p className="text-sm text-gray-900">{currentScheme.subject_name || 'Not specified'}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Form/Grade</label>
                    <p className="text-sm text-gray-900">
                      {loadingNames ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Loading...
                        </span>
                      ) : (
                        formGradeName
                      )}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Term</label>
                    <p className="text-sm text-gray-900">
                      {loadingNames ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Loading...
                        </span>
                      ) : (
                        termName
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <Badge variant={currentScheme.status === 'completed' ? 'default' : 'secondary'}>
                    {currentScheme.status || 'draft'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Academic Year</label>
                  <p className="text-sm text-gray-900">{currentScheme.academic_year || 'Not specified'}</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Scheme Context Card - FIXED VERSION */}
        {currentScheme && (
          <Card className="border-l-4 border-l-blue-500 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">{currentScheme.subject_name || 'Subject'}</p>
                      <p className="text-sm text-blue-700">{currentScheme.school_name || 'School'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-blue-700">
                    <div className="flex items-center space-x-1">
                      <Building2 className="h-4 w-4" />
                      <span>
                        {loadingNames ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Loading...
                          </span>
                        ) : (
                          formGradeName
                        )}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {loadingNames ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Loading...
                          </span>
                        ) : (
                          termName
                        )}
                      </span>
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
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome to your teaching management portal</p>
              {timetableId && (
                <p className="text-sm text-blue-600 mt-1">
                  <Database className="h-3 w-3 inline mr-1" />
                  Active Timetable ID: {timetableId}
                </p>
              )}
            </div>
          </div>
          
          {/* Status Badge and Controls */}
          <div className="flex items-center space-x-3">
            {isAutoSaving && (
              <div className="flex items-center space-x-2 text-sm text-amber-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Auto-saving...</span>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowInstructions(true)}
              className="text-gray-600 border-gray-300 hover:bg-gray-50"
            >
              Instructions
            </Button>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                Create Scheme
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Start creating a new scheme of work for your subject.</p>
              <Link href="/dashboard/scheme-of-work">
                <Button className="w-full">Create New Scheme</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Timetable Builder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Design your interactive teaching timetable.</p>
              <Link href="/dashboard/timetable">
                <Button className="w-full" variant="outline">Build Timetable</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-purple-600" />
                Lesson Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">View and download your lesson plans as PDFs.</p>
              <Link href="/dashboard/lesson-plans">
                <Button className="w-full" variant="outline">My Lesson Plans</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Current Scheme Status */}
        {currentScheme && (
          <Card>
            <CardHeader>
              <CardTitle>Current Scheme Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Scheme Status</span>
                  <Badge variant={currentScheme.status === 'completed' ? 'default' : 'secondary'}>
                    {currentScheme.status || 'draft'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Subject:</span>
                    <p className="font-medium">{currentScheme.subject_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">School:</span>
                    <p className="font-medium">{currentScheme.school_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Form/Grade:</span>
                    <p className="font-medium">{loadingNames ? 'Loading...' : formGradeName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Term:</span>
                    <p className="font-medium">{loadingNames ? 'Loading...' : termName}</p>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Link href="/dashboard/timetable">
                    <Button variant="outline" size="sm">Continue Timetable</Button>
                  </Link>
                  <Link href="/dashboard/scheme-of-work">
                    <Button variant="outline" size="sm">Edit Scheme</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}