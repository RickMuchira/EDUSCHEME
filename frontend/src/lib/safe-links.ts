// File: frontend/src/lib/safe-links.ts
// Helper functions to generate safe URLs with validation

/**
 * Validates if a value is a valid ID (positive integer)
 */
export function isValidId(id: any): id is number {
    return typeof id === 'number' && !isNaN(id) && id > 0 && Number.isInteger(id)
  }
  
  /**
   * Safely converts a value to a valid ID, returning null if invalid
   */
  export function toValidId(value: any): number | null {
    if (value === null || value === undefined) return null
    
    const num = typeof value === 'string' ? parseInt(value, 10) : Number(value)
    
    return isValidId(num) ? num : null
  }
  
  /**
   * Creates a safe URL with validated parameters
   */
  export function createSafeUrl(basePath: string, params: Record<string, any> = {}): string {
    const validParams: Record<string, string> = {}
    
    // Validate each parameter
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined) {
        console.warn(`⚠️ Skipping null/undefined parameter: ${key}`)
        continue
      }
      
      // Special handling for ID parameters
      if (key.includes('id') || key.includes('Id')) {
        const validId = toValidId(value)
        if (validId === null) {
          console.error(`❌ Invalid ID parameter: ${key} = ${value}`)
          throw new Error(`Invalid ${key}: ${value}. Must be a positive integer.`)
        }
        validParams[key] = validId.toString()
      } else {
        // For non-ID parameters, just convert to string
        validParams[key] = String(value)
      }
    }
    
    // Build query string
    const queryString = new URLSearchParams(validParams).toString()
    const separator = queryString ? '?' : ''
    
    const url = `${basePath}${separator}${queryString}`
    console.log(`🔗 Generated safe URL: ${url}`)
    
    return url
  }
  
  /**
   * Safe navigation functions for common routes
   */
  export const safeRoutes = {
    // Terms routes
    termsForFormGrade: (formGradeId: any) => {
      return createSafeUrl('/admin/terms', { form_grade_id: formGradeId })
    },
    
    newTermForFormGrade: (formGradeId: any) => {
      return createSafeUrl('/admin/terms/new', { form_grade_id: formGradeId })
    },
    
    editTerm: (termId: any) => {
      return createSafeUrl(`/admin/terms/${toValidId(termId)}/edit`)
    },
    
    // Subjects routes
    subjectsForTerm: (termId: any) => {
      return createSafeUrl('/admin/subjects', { term_id: termId })
    },
    
    newSubjectForTerm: (termId: any) => {
      return createSafeUrl('/admin/subjects/new', { term_id: termId })
    },
    
    editSubject: (subjectId: any) => {
      return createSafeUrl(`/admin/subjects/${toValidId(subjectId)}/edit`)
    },
    
    viewSubject: (subjectId: any) => {
      return createSafeUrl(`/admin/subjects/${toValidId(subjectId)}`)
    },
    
    // Forms/Grades routes
    formsGradesForSchoolLevel: (schoolLevelId: any) => {
      return createSafeUrl('/admin/forms-grades', { school_level_id: schoolLevelId })
    },
    
    newFormGradeForSchoolLevel: (schoolLevelId: any) => {
      return createSafeUrl('/admin/forms-grades/new', { school_level_id: schoolLevelId })
    },
    
    editFormGrade: (formGradeId: any) => {
      return createSafeUrl(`/admin/forms-grades/${toValidId(formGradeId)}/edit`)
    },
    
    viewFormGrade: (formGradeId: any) => {
      return createSafeUrl(`/admin/forms-grades/${toValidId(formGradeId)}`)
    }
  }
  
  /**
   * React hook for safe navigation
   */
  export function useSafeNavigation() {
    const navigate = (path: string, params?: Record<string, any>) => {
      try {
        const safeUrl = createSafeUrl(path, params)
        window.location.href = safeUrl
      } catch (error) {
        console.error('❌ Navigation failed:', error)
        throw error
      }
    }
    
    return { navigate, safeRoutes }
  }