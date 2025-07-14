'use client'

import { useState, useEffect } from 'react'
import { apiClient, schoolLevelApi, SchoolLevel, FormGrade, Term } from '../../lib/api'
import { useSession } from 'next-auth/react'

export default function SchemeWizardPage() {
  const { data: session } = useSession()
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([])
  const [formGrades, setFormGrades] = useState<FormGrade[]>([])
  const [terms, setTerms] = useState<Term[]>([])
  const [formData, setFormData] = useState({
    schoolName: '',
    schoolLevelId: '',
    formGradeId: '',
    termId: '',
    subject: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch school levels and hierarchy on mount
  useEffect(() => {
    async function fetchLevels() {
      setIsLoading(true)
      try {
        const res = await schoolLevelApi.getAll()
        if (res.success && res.data) {
          setSchoolLevels(res.data)
        } else {
          setError('Failed to load school levels')
        }
      } catch (e: any) {
        setError(e.message || 'Error loading school levels')
      } finally {
        setIsLoading(false)
      }
    }
    fetchLevels()
  }, [])

  // Update form grades when school level changes
  useEffect(() => {
    if (!formData.schoolLevelId) {
      setFormGrades([])
      setTerms([])
      setFormData(prev => ({ ...prev, formGradeId: '', termId: '' }))
      return
    }
    const level = schoolLevels.find(l => l.id === Number(formData.schoolLevelId))
    setFormGrades(level ? level.forms_grades : [])
    setFormData(prev => ({ ...prev, formGradeId: '', termId: '' }))
    setTerms([])
  }, [formData.schoolLevelId, schoolLevels])

  // Update terms when form grade changes
  useEffect(() => {
    if (!formData.formGradeId) {
      setTerms([])
      setFormData(prev => ({ ...prev, termId: '' }))
      return
    }
    const form = formGrades.find(f => f.id === Number(formData.formGradeId))
    setTerms(form ? form.terms : [])
    setFormData(prev => ({ ...prev, termId: '' }))
  }, [formData.formGradeId, formGrades])

  const validateForm = (): string[] => {
    const errors: string[] = []
    if (!formData.schoolName.trim()) errors.push('School name is required')
    if (!formData.schoolLevelId) errors.push('School level must be selected')
    if (!formData.formGradeId) errors.push('Form/Grade must be selected')
    if (!formData.termId) errors.push('Term must be selected')
    return errors
  }

  const handleSaveAndContinue = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const validationErrors = validateForm()
      if (validationErrors.length > 0) {
        setError(`Please fix these errors:\n${validationErrors.join('\n')}`)
        return
      }
      if (!session?.user || !(session.user as any).id) {
        setError('User not authenticated. Please log in.')
        return
      }
      const schemeData = {
        title: `${formData.schoolName} - ${formData.subject || 'General'} - Term ${formData.termId}`,
        school_name: formData.schoolName.trim(),
        subject_name: formData.subject.trim() || 'General',
        school_level_id: Number(formData.schoolLevelId),
        form_grade_id: Number(formData.formGradeId),
        term_id: Number(formData.termId)
      }
      // Debug: log payload and user ID
      console.log('Submitting scheme:', schemeData, 'userGoogleId:', (session.user as any).id)
      const response = await apiClient.createScheme(schemeData, (session.user as any).id)
      if (response.success) {
        alert('✅ Scheme saved successfully!')
      } else {
        setError(response.message || 'Failed to save scheme.')
      }
    } catch (error: any) {
      // Try to extract backend error message if present
      let errorMsg = error.message || 'Failed to save scheme. Please try again.'
      if (error.response) {
        try {
          const data = await error.response.json()
          if (data && data.detail) errorMsg = data.detail
        } catch {}
      }
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Fill in your school details</h1>
        <p className="text-gray-600">Provide your teaching context to create the perfect scheme.</p>
      </div>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700 whitespace-pre-line">{error}</div>
            </div>
          </div>
        </div>
      )}
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">School Name <span className="text-red-500">*</span></label>
          <input type="text" value={formData.schoolName} onChange={e => setFormData(prev => ({ ...prev, schoolName: e.target.value }))} className="w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter your school name" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">School Level <span className="text-red-500">*</span></label>
          <select value={formData.schoolLevelId} onChange={e => setFormData(prev => ({ ...prev, schoolLevelId: e.target.value }))} className="w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
            <option value="">Select school level</option>
            {schoolLevels.map(level => <option key={level.id} value={level.id}>{level.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Form/Grade <span className="text-red-500">*</span></label>
          <select value={formData.formGradeId} onChange={e => setFormData(prev => ({ ...prev, formGradeId: e.target.value }))} className="w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
            <option value="">Select form/grade</option>
            {formGrades.map(form => <option key={form.id} value={form.id}>{form.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Term <span className="text-red-500">*</span></label>
          <select value={formData.termId} onChange={e => setFormData(prev => ({ ...prev, termId: e.target.value }))} className="w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
            <option value="">Select term</option>
            {terms.map(term => <option key={term.id} value={term.id}>{term.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
          <input type="text" value={formData.subject} onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))} className="w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter subject (optional, defaults to 'General')" />
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-800 mb-3">Summary</h3>
          <div className="text-sm text-green-700 space-y-2">
            <div><strong>School:</strong> {formData.schoolName || 'Not entered'}</div>
            <div><strong>Level:</strong> {schoolLevels.find(l => l.id === Number(formData.schoolLevelId))?.name || 'Not selected'}</div>
            <div><strong>Form:</strong> {formGrades.find(f => f.id === Number(formData.formGradeId))?.name || 'Not selected'}</div>
            <div><strong>Term:</strong> {terms.find(t => t.id === Number(formData.termId))?.name || 'Not selected'}</div>
            <div><strong>Subject:</strong> {formData.subject || 'General (default)'}</div>
          </div>
        </div>
        <button onClick={handleSaveAndContinue} disabled={isLoading || validateForm().length > 0} className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200">
          {isLoading ? (<span className="flex items-center justify-center"><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Saving...</span>) : ('✅ Save & Continue to Timetable')}
        </button>
      </div>
    </div>
  )
} 