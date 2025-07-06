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

export default function GradeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id ? Number(params.id) : null
  const [grade, setGrade] = useState<FormGrade | null>(null)
  const [loading, setLoading] = useState(true)

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
    </div>
  )
} 