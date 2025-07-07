"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { formGradeApi, type FormGrade } from '@/lib/api'
import { Checkbox } from '@/components/ui/checkbox'
import { subjectApi } from '@/lib/api'

export default function GradeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id ? Number(params.id) : null
  const [grade, setGrade] = useState<FormGrade | null>(null)
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState<any[]>([])
  const [assignedSubjectIds, setAssignedSubjectIds] = useState<number[]>([])
  const [subjectsLoading, setSubjectsLoading] = useState(true)
  const [savingSubjects, setSavingSubjects] = useState(false)

  useEffect(() => {
    const fetchGrade = async () => {
      if (!id) return
      setLoading(true)
      const response = await formGradeApi.getById(id)
      if (response.success && response.data) {
        setGrade(response.data)
      } else {
        toast.error(response.message || 'Failed to load grade')
      }
      setLoading(false)
    }
    fetchGrade()
  }, [id])

  // Fetch all subjects in the pool
  useEffect(() => {
    const fetchSubjects = async () => {
      setSubjectsLoading(true)
      const response = await subjectApi.getAll()
      if (response.success && response.data) {
        setSubjects(response.data)
        // TODO: fetch assigned subjects for this grade/form and setAssignedSubjectIds
      }
      setSubjectsLoading(false)
    }
    fetchSubjects()
  }, [])

  // Handler for toggling subject assignment
  const handleToggleSubject = (subjectId: number) => {
    setAssignedSubjectIds((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    )
  }

  // Handler for saving assignments (placeholder)
  const handleSaveSubjects = async () => {
    setSavingSubjects(true)
    // TODO: Call backend to save assignedSubjectIds for this grade/form
    toast.success('Subject assignments saved (placeholder)')
    setSavingSubjects(false)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mb-4" />
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading grade...</p>
      </div>
    )
  }

  if (!grade) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <p className="text-lg text-red-600 dark:text-red-400 font-semibold">Grade not found.</p>
        <Link href="/admin/forms-grades">
          <Button variant="outline" className="mt-4">Back to Grades</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="flex items-center space-x-4 mb-8">
        <Link href={`/admin/forms-grades?school_level_id=${grade.school_level_id}`}>
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Grades
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          {grade.name} <Badge variant={grade.is_active ? 'default' : 'secondary'}>{grade.is_active ? 'Active' : 'Inactive'}</Badge>
        </h1>
        <Button variant="default" size="sm" onClick={() => router.push(`/admin/forms-grades/${grade.id}/edit`)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </div>
      <Card className="w-full shadow-lg border border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl">Grade Details</CardTitle>
          <CardDescription className="text-gray-500">All information about this grade</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <span className="font-semibold">Code:</span> {grade.code}
            </div>
            <div>
              <span className="font-semibold">Description:</span> {grade.description || '—'}
            </div>
            <div>
              <span className="font-semibold">Display Order:</span> {grade.display_order}
            </div>
            <div>
              <span className="font-semibold">School Level:</span> {grade.school_level?.name || grade.school_level_id}
            </div>
            <div>
              <span className="font-semibold">Created:</span> {new Date(grade.created_at).toLocaleString()}
            </div>
            <div>
              <span className="font-semibold">Updated:</span> {new Date(grade.updated_at).toLocaleString()}
            </div>
            <div>
              <span className="font-semibold">ID:</span> {grade.id}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject Assignment Section */}
      <Card className="w-full mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Assign Subjects to this {grade.school_level?.grade_type === 'form' ? 'Form' : 'Grade'}</CardTitle>
          <CardDescription>Select which subjects are available for this {grade.school_level?.grade_type === 'form' ? 'form' : 'grade'}.</CardDescription>
        </CardHeader>
        <CardContent>
          {subjectsLoading ? (
            <div className="text-gray-500">Loading subjects...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {subjects.map((subject) => (
                <label key={subject.id} className="flex items-center space-x-3 p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <Checkbox
                    checked={assignedSubjectIds.includes(subject.id)}
                    onCheckedChange={() => handleToggleSubject(subject.id)}
                  />
                  <span className="font-medium" style={{ color: subject.color }}>
                    <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: subject.color }} />
                    {subject.name}
                  </span>
                  <span className="ml-auto text-xs text-gray-400">{subject.description}</span>
                </label>
              ))}
            </div>
          )}
          <div className="flex justify-end mt-6">
            <Button onClick={handleSaveSubjects} disabled={savingSubjects}>
              {savingSubjects ? 'Saving...' : 'Save Assignments'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 