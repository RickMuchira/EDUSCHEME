// Error handling utilities for consistent error management
// Place this file at: frontend/src/lib/errors.ts

export interface AppError {
    message: string
    status?: number
    code?: string
    details?: any
  }
  
  /**
   * Safely converts any value to a string error message
   * Prevents [object Object] errors
   */
  export function safeErrorMessage(error: any): string {
    // Handle null/undefined
    if (error === null || error === undefined) {
      return 'An unknown error occurred'
    }
  
    // Handle strings
    if (typeof error === 'string') {
      return error.trim() || 'An unknown error occurred'
    }
  
    // Handle Error objects
    if (error instanceof Error) {
      return error.message || 'An unknown error occurred'
    }
  
    // Handle objects with message property
    if (typeof error === 'object' && error.message) {
      return safeErrorMessage(error.message)
    }
  
    // Handle API error responses
    if (typeof error === 'object') {
      // FastAPI style errors
      if (error.detail) {
        if (typeof error.detail === 'string') {
          return error.detail
        }
        if (Array.isArray(error.detail)) {
          return error.detail
            .map((item: any) => safeErrorMessage(item))
            .join(', ')
        }
      }
  
      // Generic error property
      if (error.error) {
        return safeErrorMessage(error.error)
      }
  
      // Try to extract meaningful information
      if (error.status || error.statusCode) {
        const status = error.status || error.statusCode
        return `HTTP ${status}: ${error.statusText || 'Request failed'}`
      }
    }
  
    // Last resort: try to stringify safely
    try {
      const stringified = JSON.stringify(error)
      if (stringified && stringified !== '{}') {
        return stringified
      }
    } catch {
      // JSON.stringify failed
    }
  
    return 'An unknown error occurred'
  }
  
  /**
   * Creates a standardized error object
   */
  export function createAppError(
    error: any,
    defaultMessage: string = 'An error occurred',
    status?: number
  ): AppError {
    const message = safeErrorMessage(error) || defaultMessage
    
    return {
      message,
      status: status || (error?.status) || (error?.statusCode) || 500,
      code: error?.code || 'UNKNOWN_ERROR',
      details: error?.details || error?.data || null
    }
  }
  
  /**
   * Handles async operations with proper error handling
   */
  export async function handleAsyncError<T>(
    operation: () => Promise<T>,
    errorMessage: string = 'Operation failed'
  ): Promise<{ success: true; data: T } | { success: false; error: AppError }> {
    try {
      const data = await operation()
      return { success: true, data }
    } catch (error) {
      const appError = createAppError(error, errorMessage)
      console.error('Async operation failed:', appError)
      return { success: false, error: appError }
    }
  }
  
  /**
   * Logs errors consistently
   */
  export function logError(error: any, context?: string): void {
    const errorMessage = safeErrorMessage(error)
    const logMessage = context ? `[${context}] ${errorMessage}` : errorMessage
    
    console.error(logMessage, error)
    
    // In production, you might want to send to an error tracking service
    // if (process.env.NODE_ENV === 'production') {
    //   // Send to error tracking service
    // }
  }
  
  /**
   * Validates that a value is a valid ID (positive integer)
   */
  export function validateId(value: any, fieldName: string = 'ID'): number {
    const num = parseInt(value, 10)
    
    if (isNaN(num) || num <= 0) {
      throw new Error(`Invalid ${fieldName}: must be a positive integer`)
    }
    
    return num
  }
  
  /**
   * Safely parses query parameters
   */
  export function safeParseQueryParam(
    value: string | string[] | undefined,
    defaultValue: string = ''
  ): string {
    if (Array.isArray(value)) {
      return value[0] || defaultValue
    }
    return value || defaultValue
  }
  
  /**
   * Safely parses numeric query parameters
   */
  export function safeParseNumericQueryParam(
    value: string | string[] | undefined,
    defaultValue?: number
  ): number | undefined {
    const stringValue = safeParseQueryParam(value)
    
    if (!stringValue) {
      return defaultValue
    }
    
    const num = parseInt(stringValue, 10)
    return isNaN(num) ? defaultValue : num
  }
  
  /**
   * Creates user-friendly error messages based on HTTP status codes
   */
  export function getHttpErrorMessage(status: number): string {
    switch (status) {
      case 400:
        return 'Bad request. Please check your input and try again.'
      case 401:
        return 'You are not authorized. Please log in and try again.'
      case 403:
        return 'You do not have permission to access this resource.'
      case 404:
        return 'The requested resource was not found.'
      case 409:
        return 'This resource already exists. Please use a different name.'
      case 422:
        return 'Please check your input for validation errors.'
      case 429:
        return 'Too many requests. Please wait a moment and try again.'
      case 500:
        return 'Internal server error. Please try again later.'
      case 502:
        return 'Bad gateway. The server is temporarily unavailable.'
      case 503:
        return 'Service unavailable. Please try again later.'
      case 504:
        return 'Gateway timeout. Please try again later.'
      default:
        return `HTTP ${status}: An error occurred while processing your request.`
    }
  }
  
  /**
   * Retries an operation with exponential backoff
   */
  export async function retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any
  
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        if (attempt === maxRetries - 1) {
          break
        }
        
        const delay = baseDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw lastError
  }
  
  /**
   * Debounces error logging to prevent spam
   */
  class ErrorDebouncer {
    private errorCounts: Map<string, number> = new Map()
    private lastLogTime: Map<string, number> = new Map()
    private readonly maxLogsPerMinute = 5
    private readonly windowMs = 60000 // 1 minute
    
    public shouldLog(errorMessage: string): boolean {
      const now = Date.now()
      const lastTime = this.lastLogTime.get(errorMessage) || 0
      const count = this.errorCounts.get(errorMessage) || 0
      
      // Reset counter if window has passed
      if (now - lastTime > this.windowMs) {
        this.errorCounts.set(errorMessage, 0)
        this.lastLogTime.set(errorMessage, now)
        return true
      }
      
      // Check if we've exceeded the limit
      if (count >= this.maxLogsPerMinute) {
        return false
      }
      
      this.errorCounts.set(errorMessage, count + 1)
      this.lastLogTime.set(errorMessage, now)
      return true
    }
  }
  
  export const errorDebouncer = new ErrorDebouncer()
  
  /**
   * Safely logs errors with debouncing
   */
  export function debouncedLogError(error: any, context?: string): void {
    const errorMessage = safeErrorMessage(error)
    
    if (errorDebouncer.shouldLog(errorMessage)) {
      logError(error, context)
    }
  }
  
  /**
   * Safely extracts error message from ApiError or any other error type
   * Use this in component catch blocks to handle ApiError objects properly
   */
  export function getErrorMessage(error: any): string {
    // Handle ApiError objects (from our API client)
    if (error && typeof error === 'object' && error.name === 'ApiError') {
      return error.message || 'An API error occurred'
    }
    // Handle other error types
    return safeErrorMessage(error)
  }
  
  // Export utility functions as default
  export default {
    safeErrorMessage,
    createAppError,
    handleAsyncError,
    logError,
    validateId,
    safeParseQueryParam,
    safeParseNumericQueryParam,
    getHttpErrorMessage,
    retryOperation,
    debouncedLogError
  }