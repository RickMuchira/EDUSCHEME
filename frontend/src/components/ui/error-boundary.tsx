'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home, Plus } from 'lucide-react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Alert, AlertDescription } from './alert'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error!} retry={this.retry} />
      }

      return <DefaultErrorFallback error={this.state.error!} retry={this.retry} />
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error
  retry: () => void
}

export function DefaultErrorFallback({ error, retry }: ErrorFallbackProps) {
  const isSchemeError = error.message.includes('scheme') || 
                       error.message.includes('subject') ||
                       error.message.includes('incomplete')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl text-gray-900">
            {isSchemeError ? 'Scheme Error' : 'Something went wrong'}
          </CardTitle>
          <CardDescription>
            {isSchemeError 
              ? 'There was an issue with your scheme data'
              : 'An unexpected error occurred'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700 text-sm">
              {error.message}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button 
              onClick={retry} 
              className="w-full"
              variant="default"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>

            {isSchemeError && (
              <Button 
                onClick={() => {
                  localStorage.removeItem('currentSchemeId')
                  localStorage.removeItem('schemeFormData')
                  window.location.href = '/dashboard/scheme-of-work'
                }}
                className="w-full"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Scheme
              </Button>
            )}

            <Button 
              onClick={() => window.location.href = '/dashboard'}
              className="w-full"
              variant="outline"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="text-sm text-gray-500 cursor-pointer">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                {error.stack}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Hook for using error boundary programmatically
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Manual error handling:', error, errorInfo)
    
    // Check if it's a scheme-related error
    if (error.message.includes('scheme') || 
        error.message.includes('subject') ||
        error.message.includes('incomplete')) {
      
      // Clear invalid scheme data
      localStorage.removeItem('currentSchemeId')
      localStorage.removeItem('schemeFormData')
      
      // Redirect to scheme creation
      window.location.href = '/dashboard/scheme-of-work'
    }
    
    throw error // Re-throw to be caught by error boundary
  }
} 