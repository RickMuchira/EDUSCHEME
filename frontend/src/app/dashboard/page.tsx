// Updated timetable page with name resolution fix
// File: frontend/src/app/dashboard/timetable/page.tsx

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
  Loader2
} from 'lucide-react'
import { formGradeApi, termApi } from '@/lib/api'

export default function TimetablePage() {
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

  useEffect(() => {
    // Get current scheme from localStorage or URL params
    const schemeData = localStorage.getItem('currentScheme')
    if (schemeData) {
      const scheme = JSON.parse(schemeData)
      setCurrentScheme(scheme)
      // Resolve the names for form/grade and term
      resolveNames(scheme.form_grade_id, scheme.term_id)
    }
  }, [])

  // Function to resolve ID to actual names
  const resolveNames = async (formGradeId: number, termId: number) => {
    setLoadingNames(true)
    
    try {
      // Fetch form/grade name
      if (formGradeId) {
        const formGradeResponse = await formGradeApi.getById(formGradeId)
        if (formGradeResponse.success && formGradeResponse.data) {
          setFormGradeName(formGradeResponse.data.name)
        } else if (formGradeResponse.name) {
          // Handle case where response structure might be different
          setFormGradeName(formGradeResponse.name)
        } else {
          setFormGradeName(`Form/Grade ${formGradeId}`)
        }
      }

      // Fetch term name
      if (termId) {
        const termResponse = await termApi.getById(termId)
        if (termResponse.success && termResponse.data) {
          setTermName(termResponse.data.name)
        } else if (termResponse.name) {
          // Handle case where response structure might be different
          setTermName(termResponse.name)
        } else {
          setTermName(`Term ${termId}`)
        }
      }
    } catch (error) {
      console.error('Error resolving names:', error)
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
                    {currentScheme.status}
                  </Badge>
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
                      <p className="font-medium text-blue-900">{currentScheme.subject_name}</p>
                      <p className="text-sm text-blue-700">{currentScheme.school_name}</p>
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

        {/* Rest of your timetable components would go here */}
        <Card>
          <CardHeader>
            <CardTitle>Timetable Builder</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Your timetable builder interface would continue here...
            </p>
            {/* Add your existing timetable builder components */}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}