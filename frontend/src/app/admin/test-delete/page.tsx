'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EnhancedDeleteDialog, SimpleDeleteDialog } from '@/components/ui/enhanced-delete-dialog'
import { Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export default function DeleteTestPage() {
  // Enhanced dialog state
  const [enhancedDialogOpen, setEnhancedDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  
  // Simple dialog state
  const [simpleDialogOpen, setSimpleDialogOpen] = useState(false)
  const [simpleLoading, setSimpleLoading] = useState(false)
  
  // Sample items for testing
  const sampleTerm = {
    id: 1,
    name: "First Term",
    code: "TERM1",
    is_active: true,
    subjects_count: 3,
    display_order: 1
  }
  
  const sampleInactiveTerm = {
    id: 2,
    name: "Old Term",
    code: "OLD1",
    is_active: false,
    subjects_count: 0,
    display_order: 2
  }

  const handleEnhancedDelete = async (permanent: boolean) => {
    setDeleteLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const deleteType = permanent ? 'permanently deleted' : 'deactivated'
    toast.success(`Term "${sampleTerm.name}" ${deleteType} successfully`)
    
    setDeleteLoading(false)
    setEnhancedDialogOpen(false)
  }

  const handleSimpleDelete = async () => {
    setSimpleLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    toast.success('Item deleted successfully')
    
    setSimpleLoading(false)
    setSimpleDialogOpen(false)
  }

  const testScenarios = [
    {
      title: "Active Term with Subjects",
      description: "Term that is currently active and has subjects",
      item: sampleTerm,
      buttonText: "Delete Active Term",
      variant: "destructive" as const
    },
    {
      title: "Inactive Term",
      description: "Term that is already inactive",
      item: sampleInactiveTerm,
      buttonText: "Delete Inactive Term",
      variant: "outline" as const
    }
  ]

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Delete Dialog Testing
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test different delete dialog scenarios and configurations
        </p>
      </div>

      <div className="grid gap-6">
        {/* Enhanced Delete Dialog Tests */}
        <Card>
          <CardHeader>
            <CardTitle>Enhanced Delete Dialog</CardTitle>
            <CardDescription>
              Full-featured delete dialog with soft/hard delete options
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {testScenarios.map((scenario, index) => (
                <Card key={index} className="border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{scenario.title}</CardTitle>
                    <CardDescription>{scenario.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Status:</span>
                        <Badge variant={scenario.item.is_active ? "default" : "secondary"}>
                          {scenario.item.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Subjects:</span>
                        <span>{scenario.item.subjects_count}</span>
                      </div>
                      <Button
                        variant={scenario.variant}
                        className="w-full"
                        onClick={() => setEnhancedDialogOpen(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {scenario.buttonText}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Simple Delete Dialog Test */}
        <Card>
          <CardHeader>
            <CardTitle>Simple Delete Dialog</CardTitle>
            <CardDescription>
              Basic delete confirmation dialog for simple use cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
              <Button
                variant="destructive"
                onClick={() => setSimpleDialogOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Test Simple Delete
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features Overview */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">✨ Enhanced Delete Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Soft Delete (Deactivate)</h4>
                <ul className="space-y-1 text-sm text-blue-700">
                  <li>• Marks item as inactive</li>
                  <li>• Preserves all data</li>
                  <li>• Can be reactivated later</li>
                  <li>• Maintains relationships</li>
                  <li>• Recommended for most cases</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Hard Delete (Permanent)</h4>
                <ul className="space-y-1 text-sm text-blue-700">
                  <li>• Completely removes item</li>
                  <li>• Cannot be undone</li>
                  <li>• May affect related data</li>
                  <li>• Use with caution</li>
                  <li>• For cleanup only</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Delete Dialog */}
      <EnhancedDeleteDialog
        open={enhancedDialogOpen}
        onOpenChange={setEnhancedDialogOpen}
        onConfirm={handleEnhancedDelete}
        loading={deleteLoading}
        title="Delete Term"
        itemName={sampleTerm.name}
        itemType="term"
        isActive={sampleTerm.is_active}
        showSoftDeleteOption={true}
        showHardDeleteOption={true}
      >
        {/* Custom content for testing */}
        <div className="space-y-2">
          <h5 className="font-medium text-gray-900">Term Details:</h5>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Code:</span>
              <span className="ml-2 font-mono">{sampleTerm.code}</span>
            </div>
            <div>
              <span className="text-gray-600">Order:</span>
              <span className="ml-2">{sampleTerm.display_order}</span>
            </div>
            <div>
              <span className="text-gray-600">Status:</span>
              <span className={`ml-2 ${sampleTerm.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                {sampleTerm.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Subjects:</span>
              <span className="ml-2">{sampleTerm.subjects_count}</span>
            </div>
          </div>
          
          {sampleTerm.subjects_count > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mt-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-900">Contains Subjects</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                This term contains {sampleTerm.subjects_count} subject{sampleTerm.subjects_count !== 1 ? 's' : ''}. 
                Deleting this term may affect those subjects.
              </p>
            </div>
          )}
        </div>
      </EnhancedDeleteDialog>

      {/* Simple Delete Dialog */}
      <SimpleDeleteDialog
        open={simpleDialogOpen}
        onOpenChange={setSimpleDialogOpen}
        onConfirm={handleSimpleDelete}
        loading={simpleLoading}
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        itemName="Test Item"
      />
    </div>
  )
}