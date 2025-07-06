'use client'

import { toast as sonnerToast } from 'sonner'

// Re-export sonner's toast function
export const toast = sonnerToast

// Custom hook that provides a similar API to the old useToast
export function useToast() {
  return {
    toast: sonnerToast,
    dismiss: (toastId?: string) => {
      if (toastId) {
        sonnerToast.dismiss(toastId)
      } else {
        sonnerToast.dismiss()
      }
    },
    // For backward compatibility, provide empty arrays for old API
    toasts: [],
  }
}

// Type definitions for backward compatibility
export type ToastProps = {
  id?: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: 'default' | 'destructive'
  duration?: number
}

// Helper function to convert old toast API to sonner
export function showToast(props: ToastProps) {
  const { title, description, variant, duration } = props
  
  if (variant === 'destructive') {
    return sonnerToast.error(title || 'Error', {
      description,
      duration,
    })
  }
  
  return sonnerToast(title || 'Success', {
    description,
    duration,
  })
}