'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Pencil, Trash2, Check, X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DeleteDialog } from '@/components/ui/delete-dialog'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

interface Term {
  id: number
  name: string
  code: string
  form_grade_id: number
  created_at: string
  updated_at: string
  is_active: boolean
}

export default function TermsPage() {
  const searchParams = useSearchParams()
  const formGradeId = searchParams.get('form_grade_id')
  const [terms, setTerms] = useState<Term[]>([])
  const [loading, setLoading] = useState(false)
  const [numTerms, setNumTerms] = useState('')
  const [creating, setCreating] = useState(false)
  const [activeTab, setActiveTab] = useState<string | null>(null)
  const [editingTermId, setEditingTermId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editCode, setEditCode] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [termToDelete, setTermToDelete] = useState<Term | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active')

  // Fetch terms for the grade
  const fetchTerms = async () => {
    if (!formGradeId) return
    setLoading(true)
    try {
      let url = `${API_BASE_URL}/api/v1/admin/terms?form_grade_id=${formGradeId}`
      // Always include_inactive for 'all' and 'inactive' to get both active and inactive terms
      if (statusFilter === 'all' || statusFilter === 'inactive') {
        url += `&include_inactive=true`
      }
      const res = await fetch(url)
      const data = await res.json()
      let terms = data.data?.filter((t: Term) => t.form_grade_id === Number(formGradeId)) || []
      if (statusFilter === 'inactive') {
        terms = terms.filter((t: Term) => !t.is_active)
      } else if (statusFilter === 'active') {
        terms = terms.filter((t: Term) => t.is_active)
      }
      setTerms(terms)
      if (terms.length > 0) {
        setActiveTab(terms[0].id.toString())
      }
    } catch (err) {
      toast.error('Failed to load terms')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTerms()
    // eslint-disable-next-line
  }, [formGradeId, statusFilter])

  // Handle create terms
  const handleCreateTerms = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formGradeId || !numTerms || isNaN(Number(numTerms)) || Number(numTerms) < 1) {
      toast.error('Enter a valid number of terms')
      return
    }
    setCreating(true)
    try {
      for (let i = 1; i <= Number(numTerms); i++) {
        await fetch(`${API_BASE_URL}/api/v1/admin/terms/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Term ${i}`,
            code: `T${i}`,
            form_grade_id: Number(formGradeId),
            is_active: true
          })
        })
      }
      toast.success('Terms created successfully')
      setNumTerms('')
      fetchTerms()
    } catch (err) {
      toast.error('Failed to create terms')
    } finally {
      setCreating(false)
    }
  }

  // Edit handlers
  const startEdit = (term: Term) => {
    setEditingTermId(term.id)
    setEditName(term.name)
    setEditCode(term.code)
  }
  const cancelEdit = () => {
    setEditingTermId(null)
    setEditName('')
    setEditCode('')
  }
  const saveEdit = async (term: Term) => {
    setEditLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/terms/${term.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, code: editCode })
      })
      if (res.ok) {
        toast.success('Term updated')
        setEditingTermId(null)
        fetchTerms()
      } else {
        toast.error('Failed to update term')
      }
    } catch {
      toast.error('Failed to update term')
    } finally {
      setEditLoading(false)
    }
  }

  // Delete handlers
  const confirmDelete = (term: Term) => {
    setTermToDelete(term)
    setDeleteDialogOpen(true)
  }
  const handleDeleteConfirm = async (hardDelete: boolean) => {
    if (!termToDelete) return
    try {
      setDeleteLoading(true)
      const res = await fetch(`${API_BASE_URL}/api/v1/admin/terms/${termToDelete.id}?soft_delete=${hardDelete ? 'false' : 'true'}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(hardDelete ? 'Term permanently deleted' : 'Term deactivated')
        setDeleteDialogOpen(false)
        setTermToDelete(null)
        fetchTerms()
      } else {
        toast.error('Failed to delete term')
      }
    } catch {
      toast.error('Failed to delete term')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (!formGradeId) {
    return (
      <Card className="max-w-xl mx-auto mt-10">
        <CardHeader>
          <CardTitle>Select a Grade</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please select a grade to manage its terms.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Manage Terms</CardTitle>
          <CardDescription>for Grade ID: {formGradeId}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTerms} className="mb-6 flex items-center space-x-2">
            <Input
              type="number"
              min={1}
              placeholder="Number of terms to create"
              value={numTerms}
              onChange={e => setNumTerms(e.target.value)}
              className="w-40"
              disabled={creating}
            />
            <Button type="submit" disabled={creating || !numTerms}>
              {creating ? 'Creating...' : 'Create Terms'}
            </Button>
          </form>
          <div className="flex items-center space-x-2 mb-4">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('active')}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === 'inactive' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('inactive')}
            >
              Inactive
            </Button>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Existing Terms</h3>
            {loading ? (
              <p>Loading terms...</p>
            ) : terms.length === 0 ? (
              <p className="text-gray-500">No terms found for this grade.</p>
            ) : (
              <Tabs value={activeTab || undefined} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4">
                  {terms.map(term => (
                    <TabsTrigger key={term.id} value={term.id.toString()}>{term.name}</TabsTrigger>
                  ))}
                </TabsList>
                {terms.map(term => (
                  <TabsContent key={term.id} value={term.id.toString()} className="border rounded p-4 relative">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{term.name} ({term.code})</div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(term)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete(term)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                      </div>
                    </div>
                    {editingTermId === term.id ? (
                      <form onSubmit={e => { e.preventDefault(); saveEdit(term) }} className="flex items-center space-x-2 mb-2">
                        <Input value={editName} onChange={e => setEditName(e.target.value)} className="w-32" disabled={editLoading} />
                        <Input value={editCode} onChange={e => setEditCode(e.target.value)} className="w-20" disabled={editLoading} />
                        <Button type="submit" size="icon" disabled={editLoading}><Check className="h-4 w-4" /></Button>
                        <Button type="button" size="icon" variant="ghost" onClick={cancelEdit}><X className="h-4 w-4" /></Button>
                      </form>
                    ) : null}
                    {!term.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2 text-green-600 border-green-300"
                        onClick={async () => {
                          try {
                            const res = await fetch(`${API_BASE_URL}/api/v1/admin/terms/${term.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ is_active: true })
                            })
                            if (res.ok) {
                              toast.success('Term reactivated')
                              fetchTerms()
                            } else {
                              toast.error('Failed to reactivate term')
                            }
                          } catch {
                            toast.error('Failed to reactivate term')
                          }
                        }}
                      >
                        Reactivate
                      </Button>
                    )}
                    <div className="text-xs text-gray-500">Created: {new Date(term.created_at).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-500">Updated: {new Date(term.updated_at).toLocaleDateString()}</div>
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>
        </CardContent>
      </Card>
      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Term"
        itemName={termToDelete?.name || ''}
        itemType="term"
        isActive={!!termToDelete?.is_active}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
        showSoftDeleteOption={true}
      />
    </div>
  )
} 