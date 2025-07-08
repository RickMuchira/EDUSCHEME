'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  Trash2, 
  Archive, 
  RotateCcw, 
  AlertTriangle, 
  Info, 
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react'

interface EnhancedDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (permanent: boolean) => Promise<void>
  loading?: boolean
  title: string
  itemName: string
  itemType?: string // 'term', 'subject', 'form-grade', etc.
  isActive?: boolean
  children?: React.ReactNode
  showSoftDeleteOption?: boolean
  showHardDeleteOption?: boolean
}

export function EnhancedDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
  title,
  itemName,
  itemType = 'item',
  isActive = true,
  children,
  showSoftDeleteOption = true,
  showHardDeleteOption = true
}: EnhancedDeleteDialogProps) {
  const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await onConfirm(deleteType === 'hard')
    } finally {
      setIsSubmitting(false)
    }
  }

  const softDeleteInfo = {
    title: `Deactivate ${itemType}`,
    description: `This will temporarily hide the ${itemType} from active lists but keep all data intact. You can reactivate it later.`,
    icon: <Archive className="h-5 w-5 text-orange-600" />,
    buttonText: isActive ? 'Deactivate' : 'Already Inactive',
    buttonVariant: 'secondary' as const,
    consequences: [
      `${itemType} will be marked as inactive`,
      'All data and relationships are preserved',
      'Can be reactivated at any time',
      'Will not appear in active lists',
      'Historical data remains accessible'
    ]
  }

  const hardDeleteInfo = {
    title: `Permanently Delete ${itemType}`,
    description: `This will completely remove the ${itemType} and all related data from the system. This action cannot be undone.`,
    icon: <Trash2 className="h-5 w-5 text-red-600" />,
    buttonText: 'Delete Permanently',
    buttonVariant: 'destructive' as const,
    consequences: [
      `${itemType} will be completely removed`,
      'All related data will be deleted',
      'This action cannot be undone',
      'No recovery option available',
      'May affect dependent records'
    ]
  }

  const currentInfo = deleteType === 'soft' ? softDeleteInfo : hardDeleteInfo
  const canSoftDelete = showSoftDeleteOption && isActive
  const canHardDelete = showHardDeleteOption

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <span>{title}</span>
          </AlertDialogTitle>
          <AlertDialogDescription>
            Choose how you want to remove "<strong>{itemName}</strong>" from the system.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          {(canSoftDelete || canHardDelete) ? (
            <Tabs value={deleteType} onValueChange={(value) => setDeleteType(value as 'soft' | 'hard')}>
              <TabsList className="grid w-full grid-cols-2">
                {canSoftDelete && (
                  <TabsTrigger value="soft" className="flex items-center space-x-2">
                    <Archive className="h-4 w-4" />
                    <span>Deactivate</span>
                  </TabsTrigger>
                )}
                {canHardDelete && (
                  <TabsTrigger value="hard" className="flex items-center space-x-2">
                    <Trash2 className="h-4 w-4" />
                    <span>Delete</span>
                  </TabsTrigger>
                )}
              </TabsList>

              {canSoftDelete && (
                <TabsContent value="soft" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <Archive className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-orange-900">Soft Delete (Recommended)</h4>
                        <p className="text-sm text-orange-700 mt-1">
                          {softDeleteInfo.description}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">What happens:</h5>
                      <ul className="space-y-1">
                        {softDeleteInfo.consequences.map((consequence, index) => (
                          <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                            <span>{consequence}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {!isActive && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Info className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-900">Already Inactive</span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          This {itemType} is already inactive. You can reactivate it or choose permanent deletion.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              )}

              {canHardDelete && (
                <TabsContent value="hard" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-red-900">Permanent Deletion</h4>
                        <p className="text-sm text-red-700 mt-1">
                          {hardDeleteInfo.description}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">What happens:</h5>
                      <ul className="space-y-1">
                        {hardDeleteInfo.consequences.map((consequence, index) => (
                          <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
                            <span>{consequence}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-900">Warning</span>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">
                        This action is irreversible. Make sure you really want to permanently delete this {itemType}.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                No deletion options are available for this {itemType}.
              </p>
            </div>
          )}

          {children && (
            <>
              <Separator className="my-4" />
              {children}
            </>
          )}
        </div>

        <AlertDialogFooter className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {currentInfo.icon}
            <Badge variant={deleteType === 'soft' ? 'secondary' : 'destructive'}>
              {currentInfo.title}
            </Badge>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant={currentInfo.buttonVariant}
              onClick={handleConfirm}
              disabled={isSubmitting || (!canSoftDelete && deleteType === 'soft') || (!canHardDelete && deleteType === 'hard')}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {currentInfo.icon}
                  <span className="ml-2">{currentInfo.buttonText}</span>
                </>
              )}
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// Alternative compact version for simple use cases
export function SimpleDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
  loading = false,
  title,
  description,
  itemName
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
  loading?: boolean
  title: string
  description: string
  itemName: string
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span>{title}</span>
          </AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}