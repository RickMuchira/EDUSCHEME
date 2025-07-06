'use client'

import { useState } from 'react'
import { AlertTriangle, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  itemName: string
  itemType: string
  isActive: boolean
  onConfirm: (hardDelete: boolean) => Promise<void>
  loading?: boolean
  showSoftDeleteOption?: boolean
}

export function DeleteDialog({
  open,
  onOpenChange,
  title,
  itemName,
  itemType,
  isActive,
  onConfirm,
  loading = false,
  showSoftDeleteOption = true
}: DeleteDialogProps) {
  const [hardDelete, setHardDelete] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const handleConfirm = async () => {
    await onConfirm(hardDelete)
    // Reset state after action
    setHardDelete(false)
    setConfirmed(false)
  }

  const handleCancel = () => {
    setHardDelete(false)
    setConfirmed(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-left">
            You are about to delete the following {itemType}:
          </DialogDescription>
        </DialogHeader>

        {/* Item Information */}
        <div className="my-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {itemName}
              </h4>
              <Badge variant={isActive ? 'default' : 'secondary'}>
                {isActive ? (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Active
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3 w-3 mr-1" />
                    Inactive
                  </>
                )}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Type: {itemType}
            </p>
          </div>
        </div>

        {/* Delete Options */}
        {showSoftDeleteOption && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Delete Options:</Label>
                
                {/* Soft Delete Option */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="soft-delete"
                    checked={!hardDelete}
                    onCheckedChange={() => setHardDelete(false)}
                  />
                  <div className="space-y-1">
                    <Label 
                      htmlFor="soft-delete" 
                      className="text-sm font-medium cursor-pointer"
                    >
                      Soft Delete (Recommended)
                    </Label>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Mark as inactive. Can be restored later.
                    </p>
                  </div>
                </div>

                {/* Hard Delete Option */}
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="hard-delete"
                    checked={hardDelete}
                    onCheckedChange={() => setHardDelete(true)}
                  />
                  <div className="space-y-1">
                    <Label 
                      htmlFor="hard-delete" 
                      className="text-sm font-medium cursor-pointer text-red-600"
                    >
                      Permanent Delete
                    </Label>
                    <p className="text-xs text-red-500">
                      Permanently remove from database. Cannot be undone!
                    </p>
                  </div>
                </div>
              </div>

              {/* Confirmation Checkbox for Hard Delete */}
              {hardDelete && (
                <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="confirm-hard-delete"
                      checked={confirmed}
                      onCheckedChange={setConfirmed}
                    />
                    <div className="space-y-1">
                      <Label 
                        htmlFor="confirm-hard-delete" 
                        className="text-sm font-medium cursor-pointer text-red-700 dark:text-red-300"
                      >
                        I understand this action is irreversible
                      </Label>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        This will permanently delete "{itemName}" and all related data.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <DialogFooter className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading || (hardDelete && !confirmed)}
            className="min-w-[100px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                {hardDelete ? 'Delete Forever' : 'Delete'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 