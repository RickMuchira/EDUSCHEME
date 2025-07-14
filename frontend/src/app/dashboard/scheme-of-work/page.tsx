'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

interface SchoolLevel {
  id: number
  name: string
  code: string
  description: string
  forms_grades: FormGrade[]
}

interface FormGrade {
  id: number
  name: string
  code: string
  description: string
  terms: Term[]
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
  { id: 2, name: 'Subject Selection', description: 'Choose your subject', completed: false },
  { id: 3, name: 'Content Planning', description: 'Plan your curriculum', completed: false },
  { id: 4, name: 'Review & Generate', description: 'Review and create scheme', completed: false }
]

export default function SchemeOfWorkPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([])
  const [forms, setForms] = useState<FormGrade[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  
  const [formData, setFormData] = useState({
    schoolName: '',
    schoolLevel: '',
    form: '',
    term: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch school levels on component mount
  useEffect(() => {
    fetchSchoolLevels()
  }, [])

  const fetchSchoolLevels = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/school-levels')
      const data = await response.json()
      if (data.success) {
        setSchoolLevels(data.data)
      }
    } catch (error) {
      console.error('Error fetching school levels:', error)
    }
  }

  const handleSchoolLevelChange = (value: string) => {
    setFormData(prev => ({ ...prev, schoolLevel: value, form: '', term: '' }))
    const selectedLevel = schoolLevels.find(level => level.id.toString() === value)
    if (selectedLevel) {
      setForms(selectedLevel.forms_grades)
      setTerms([])
    }
  }

  const handleFormChange = (value: string) => {
    setFormData(prev => ({ ...prev, form: value, term: '' }))
    const selectedForm = forms.find(form => form.id.toString() === value)
    if (selectedForm) {
      setTerms(selectedForm.terms)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.schoolName.trim()) {
      newErrors.schoolName = 'School name is required'
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
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveAndContinue = async () => {
    if (!validateForm()) return
    
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Store form data for next step
    localStorage.setItem('schemeFormData', JSON.stringify(formData))
    
    setIsLoading(false)
    router.push('/dashboard/scheme-of-work/subjects')
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
            Fill in your teaching details, and we'll generate a customized scheme of work tailored to your schedule in seconds.
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
            <CardTitle className="text-2xl text-gray-900">Fill in the subject and the school details</CardTitle>
            <CardDescription className="text-gray-600">
              Fill the form with the correct details.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* School Name */}
            <div className="space-y-2">
              <Label htmlFor="schoolName" className="text-sm font-medium text-gray-700">
                School Name
              </Label>
              <div className="relative">
                <School className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="schoolName"
                  placeholder="Mangu Highschool"
                  value={formData.schoolName}
                  onChange={(e) => setFormData(prev => ({ ...prev, schoolName: e.target.value }))}
                  className={cn(
                    "pl-10 h-12 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors",
                    errors.schoolName && "border-red-300 focus:border-red-500"
                  )}
                />
              </div>
              {errors.schoolName && (
                <div className="flex items-center space-x-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.schoolName}</span>
                </div>
              )}
            </div>

            {/* School Level */}
            <div className="space-y-2">
              <Label htmlFor="schoolLevel" className="text-sm font-medium text-gray-700">
                School Level
              </Label>
              <Select value={formData.schoolLevel} onValueChange={handleSchoolLevelChange}>
                <SelectTrigger className={cn(
                  "h-12 bg-gray-50/50 border-gray-200 focus:bg-white",
                  errors.schoolLevel && "border-red-300"
                )}>
                  <div className="flex items-center">
                    <GraduationCap className="mr-2 h-5 w-5 text-gray-400" />
                    <SelectValue placeholder="Please select your current school level: choose 'Primary' if you teach in a primary school, or 'Secondary' if you teach in a secondary school." />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {schoolLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{level.name}</span>
                        <Badge variant="outline" className="text-xs">{level.code}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.schoolLevel && (
                <div className="flex items-center space-x-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.schoolLevel}</span>
                </div>
              )}
            </div>

            {/* Form/Grade */}
            <div className="space-y-2">
              <Label htmlFor="form" className="text-sm font-medium text-gray-700">
                Form
              </Label>
              <Select 
                value={formData.form} 
                onValueChange={handleFormChange}
                disabled={!formData.schoolLevel}
              >
                <SelectTrigger className={cn(
                  "h-12 bg-gray-50/50 border-gray-200 focus:bg-white",
                  errors.form && "border-red-300",
                  !formData.schoolLevel && "opacity-50 cursor-not-allowed"
                )}>
                  <SelectValue placeholder={
                    !formData.schoolLevel 
                      ? "Select school level first" 
                      : `Select ${getSchoolLevelName(formData.schoolLevel).toLowerCase()} level`
                  } />
                </SelectTrigger>
                <SelectContent>
                  {forms.map((form) => (
                    <SelectItem key={form.id} value={form.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{form.name}</span>
                        <Badge variant="outline" className="text-xs">{form.code}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.form && (
                <div className="flex items-center space-x-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.form}</span>
                </div>
              )}
            </div>

            {/* Term */}
            <div className="space-y-2">
              <Label htmlFor="term" className="text-sm font-medium text-gray-700">
                Term
              </Label>
              <Select 
                value={formData.term} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, term: value }))}
                disabled={!formData.form}
              >
                <SelectTrigger className={cn(
                  "h-12 bg-gray-50/50 border-gray-200 focus:bg-white",
                  errors.term && "border-red-300",
                  !formData.form && "opacity-50 cursor-not-allowed"
                )}>
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-5 w-5 text-gray-400" />
                    <SelectValue placeholder={
                      !formData.form 
                        ? "Select form first" 
                        : "Select Term"
                    } />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {terms.map((term) => (
                    <SelectItem key={term.id} value={term.id.toString()}>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{term.name}</span>
                        <Badge variant="outline" className="text-xs">{term.code}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.term && (
                <div className="flex items-center space-x-1 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.term}</span>
                </div>
              )}
            </div>

            {/* Summary Card */}
            {formData.schoolName && formData.schoolLevel && formData.form && formData.term && (
              <Alert className="bg-emerald-50 border-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertDescription className="text-emerald-800">
                  <strong>Selected:</strong> {formData.schoolName} • {getSchoolLevelName(formData.schoolLevel)} • {getFormName(formData.form)} • {getTermName(formData.term)}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Button */}
            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleSaveAndContinue}
                disabled={isLoading}
                className="h-12 px-8 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Save and Continue
                    <ArrowRight className="ml-2 h-5 w-5" />
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