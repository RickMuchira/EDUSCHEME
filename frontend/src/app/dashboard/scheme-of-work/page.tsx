'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  FileText, 
  ArrowRight, 
  School, 
  GraduationCap, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { schoolLevelApi, schemeApi, formGradeApi, termApi, subjectApi } from '@/lib/api'
import apiClient from '@/lib/apiClient'


interface SchoolLevel {
  id: number
  name: string
  code: string
  description?: string
  forms_grades?: FormGrade[]
}


interface FormGrade {
  id: number
  name: string
  code: string
  description?: string
  terms?: Term[]
}

interface Term {
  id: number
  name: string
  code: string
  start_date: string
  end_date: string
}

const steps = [
  { id: 1, name: 'School Details', description: 'Fill the form with the correct details', completed: false },
  { id: 2, name: 'Review & Submit', description: 'Review and finalize your scheme', completed: false }
]

export default function SchemeOfWorkPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([])
  const [forms, setForms] = useState<FormGrade[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // Subject cascading selection
  const [subjects, setSubjects] = useState<any[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>('')

  const [formData, setFormData] = useState({
    schoolName: '',
    schoolLevel: '',
    form: '',
    term: ''
  })

  useEffect(() => {
    fetchSchoolLevels()
  }, [])

  // Debug: log schoolLevels after fetch
  useEffect(() => {
    if (schoolLevels.length > 0) {
      console.log('schoolLevels:', schoolLevels)
    }
  }, [schoolLevels])

  useEffect(() => {
    if (formData.schoolLevel) {
      // Use nested forms_grades from selected school level
      const level = schoolLevels.find(l => l.id.toString() === formData.schoolLevel)
      if (level && Array.isArray(level.forms_grades)) {
        setForms(level.forms_grades)
        console.log('forms for selected school level:', level.forms_grades)
      } else {
        setForms([])
        console.log('No forms found for selected school level')
      }
      setFormData(prev => ({ ...prev, form: '', term: '' }))
    }
  }, [formData.schoolLevel, schoolLevels])

  useEffect(() => {
    if (formData.form) {
      // Use nested terms from selected form/grade
      const form = forms.find(f => f.id.toString() === formData.form)
      if (form && Array.isArray(form.terms)) {
        setTerms(form.terms)
        console.log('terms for selected form:', form.terms)
      } else {
        setTerms([])
        console.log('No terms found for selected form')
      }
      setFormData(prev => ({ ...prev, term: '' }))
    }
  }, [formData.form, forms])

  // Fetch subjects when term changes
  useEffect(() => {
    if (formData.term) {
      subjectApi.getByTerm(parseInt(formData.term)).then(response => {
        // Support both {success, data} and array response
        if (Array.isArray(response)) {
          setSubjects(response)
          console.log('subjects (array):', response)
        } else if (response && response.success && Array.isArray(response.data)) {
          setSubjects(response.data)
          console.log('subjects (data):', response.data)
        } else {
          setSubjects([])
          console.log('subjects: empty or invalid response', response)
        }
      }).catch((err) => {
        setSubjects([])
        console.log('subjects: error', err)
      })
      setSelectedSubject('')
    }
  }, [formData.term])

  const fetchSchoolLevels = async () => {
    try {
      const response: any = await schoolLevelApi.getAll()
      // Support both {success, data} and array response
      if (Array.isArray(response)) {
        setSchoolLevels(response)
        console.log('schoolLevels (array):', response)
      } else if (response && response.success && Array.isArray(response.data)) {
        setSchoolLevels(response.data)
        console.log('schoolLevels (data):', response.data)
      } else {
        setSchoolLevels([])
        console.log('schoolLevels: empty or invalid response', response)
      }
    } catch (error) {
      console.error('Error fetching school levels:', error)
      setSchoolLevels([])
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.schoolName.trim()) {
      newErrors.schoolName = 'Please enter your school name'
    }
    if (!formData.schoolLevel) {
      newErrors.schoolLevel = 'Please select a school level'
    }
    if (!formData.form) {
      newErrors.form = 'Please select a form/grade'
    }
    if (!formData.term) {
      newErrors.term = 'Please select a term'
    }
    if (!selectedSubject) {
      newErrors.subject = 'Please select a subject'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveAndContinue = async () => {
    if (!session?.user?.email) {
      setErrors({ general: 'Please sign in to continue' });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({ general: '' });

    try {
      // Use Google ID from session (session.user.id)
      const userGoogleId = session?.user?.id;
      const userEmail = session?.user?.email;
      const userName = session?.user?.name;
      const userPicture = session?.user?.image;
      const schemeData = {
        school_name: formData.schoolName,
        subject_name: subjects.find(s => s.id.toString() === selectedSubject)?.name || '',
        subject_id: selectedSubject ? parseInt(selectedSubject) : undefined,
        school_level_id: parseInt(formData.schoolLevel),
        form_grade_id: parseInt(formData.form),
        term_id: parseInt(formData.term),
        status: 'completed',
        progress: 100,
        content: {
          form_data: formData,
          selected_subject: selectedSubject,
          step_completed: 'school_details'
        },
        scheme_metadata: {
          created_from: 'scheme_of_work_wizard',
          step: 1
        },
        user_email: userEmail,
        user_name: userName,
        user_picture: userPicture
      };

      const response = await apiClient.request(
        `/api/schemes?user_google_id=${encodeURIComponent(userGoogleId)}`,
        {
          method: 'POST',
          body: JSON.stringify(schemeData),
        }
      );
      if (response && response.data && response.data.id) {
        console.log('Scheme saved successfully:', response);
        localStorage.setItem('currentSchemeId', response.data.id.toString())
        localStorage.setItem('schemeFormData', JSON.stringify({ ...formData, selectedSubject }))
        router.push('/dashboard/timetable');
      } else {
        setErrors({ general: response?.message || 'Failed to save scheme. Please try again.' });
      }
    } catch (error: any) {
      console.error('Error saving scheme:', error);
      if (error.message && error.message.includes('Cannot connect to backend server')) {
        setErrors({ general: 'Cannot connect to backend server. Please make sure the FastAPI server is running on localhost:8000' });
      } else {
        setErrors({ general: error.message || 'Failed to save scheme. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  }

  const getSchoolLevelName = (id: string) => {
    return schoolLevels.find(level => level.id.toString() === id)?.name || ''
  }

  const getFormName = (id: string) => {
    return forms.find(form => form.id.toString() === id)?.name || ''
  }

  const getTermName = (id: string) => {
    return terms.find(term => term.id.toString() === id)?.name || ''
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-full mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900">Create a Scheme of Work</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Fill in your teaching details, and we'll help you create a customized timetable in the next step.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4 overflow-x-auto pb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center min-w-0">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200",
                  currentStep >= step.id 
                    ? "bg-emerald-600 text-white shadow-lg" 
                    : "bg-gray-200 text-gray-600"
                )}>
                  {currentStep > step.id ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium text-gray-900">{step.name}</div>
                  <div className="text-xs text-gray-500 hidden sm:block">{step.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "w-16 h-1 mx-4 rounded-full transition-all duration-200",
                  currentStep > step.id ? "bg-emerald-600" : "bg-gray-200"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Main Form Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl text-gray-900">Fill in your school details</CardTitle>
            <CardDescription className="text-gray-600">
              Provide your teaching context to create the perfect scheme.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {errors.general && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">{errors.general}</AlertDescription>
              </Alert>
            )}

            {/* School Name */}
            <div className="space-y-2">
              <Label htmlFor="schoolName" className="text-sm font-medium text-gray-700">
                School Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="schoolName"
                placeholder="Enter your school name"
                value={formData.schoolName}
                onChange={(e) => setFormData({...formData, schoolName: e.target.value})}
                className={errors.schoolName ? 'border-red-300' : ''}
              />
              {errors.schoolName && <p className="text-sm text-red-600">{errors.schoolName}</p>}
            </div>

            {/* School Level */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                School Level <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.schoolLevel} 
                onValueChange={(value) => setFormData({...formData, schoolLevel: value})}
              >
                <SelectTrigger className={errors.schoolLevel ? 'border-red-300' : ''}>
                  <SelectValue placeholder="Select school level" />
                </SelectTrigger>
                <SelectContent>
                  {schoolLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <School className="w-4 h-4" />
                        <span>{level.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.schoolLevel && <p className="text-sm text-red-600">{errors.schoolLevel}</p>}
            </div>

            {/* Form/Grade */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Form/Grade <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.form} 
                onValueChange={(value) => setFormData({...formData, form: value})}
                disabled={!formData.schoolLevel}
              >
                <SelectTrigger className={errors.form ? 'border-red-300' : ''}>
                  <SelectValue placeholder="Select form/grade" />
                </SelectTrigger>
                <SelectContent>
                  {forms.map((form) => (
                    <SelectItem key={form.id} value={form.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4" />
                        <span>{form.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
            </div>

            {/* Term */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Term <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.term} 
                onValueChange={(value) => setFormData({...formData, term: value})}
                disabled={!formData.form}
              >
                <SelectTrigger className={errors.term ? 'border-red-300' : ''}>
                  <SelectValue placeholder="Select term" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term.id} value={term.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{term.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.term && <p className="text-sm text-red-600">{errors.term}</p>}
            </div>


            {/* Subject Selection */}
            {formData.term && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">
                  Subject <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedSubject}
                  onValueChange={(value) => setSelectedSubject(value)}
                  disabled={subjects.length === 0}
                >
                  <SelectTrigger className={errors.subject ? 'border-red-300' : ''}>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        <div className="flex items-center space-x-2">
                          <span>{subject.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.subject && <p className="text-sm text-red-600">{errors.subject}</p>}
              </div>
            )}

            {/* Summary */}
            {formData.schoolLevel && formData.form && formData.term && selectedSubject && (
              <div className="mt-6 p-4 bg-emerald-50 rounded-lg">
                <h3 className="font-medium text-emerald-900 mb-2">Summary</h3>
                <div className="space-y-1 text-sm text-emerald-700">
                  <p><strong>School:</strong> {formData.schoolName}</p>
                  <p><strong>Level:</strong> {getSchoolLevelName(formData.schoolLevel)}</p>
                  <p><strong>Form:</strong> {getFormName(formData.form)}</p>
                  <p><strong>Term:</strong> {getTermName(formData.term)}</p>
                  <p><strong>Subject:</strong> {subjects.find(s => s.id.toString() === selectedSubject)?.name || ''}</p>
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-6">
              <Button 
                onClick={handleSaveAndContinue}
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving & Creating Timetable...
                  </>
                ) : (
                  <>
                    Save & Continue to Timetable
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}