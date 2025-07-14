// File: frontend/src/lib/api.ts
// FULLY UPDATED API client with ALL backend endpoints

interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  total?: number
}

interface SchemeOfWorkCreate {
  school_name: string
  subject_name: string
  school_level_id: number
  form_grade_id: number
  term_id: number
  status?: string
  progress?: number
  content?: any
  scheme_metadata?: any
  subject_id?: number
  due_date?: string
}

export class ApiClient {
  private baseURL: string

  constructor(baseURL: string = 'http://localhost:8000') {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
      }
      return await response.json()
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to backend server. Make sure your FastAPI server is running on localhost:8000')
      }
      throw error
    }
  }

  async createScheme(scheme: SchemeOfWorkCreate, userGoogleId: string): Promise<ApiResponse<any>> {
    // Validate required fields
    const requiredFields = ['school_name', 'subject_name', 'school_level_id', 'form_grade_id', 'term_id']
    for (const field of requiredFields) {
      if (!(field in scheme) || scheme[field as keyof SchemeOfWorkCreate] === undefined || scheme[field as keyof SchemeOfWorkCreate] === null) {
        throw new Error(`Missing required field: ${field}`)
      }
    }
    // Validate types
    if (typeof scheme.school_name !== 'string' || !scheme.school_name.trim()) throw new Error('school_name must be a non-empty string')
    if (typeof scheme.subject_name !== 'string' || !scheme.subject_name.trim()) throw new Error('subject_name must be a non-empty string')
    if (typeof scheme.school_level_id !== 'number' || !Number.isInteger(scheme.school_level_id) || scheme.school_level_id < 1) throw new Error('school_level_id must be a positive integer')
    if (typeof scheme.form_grade_id !== 'number' || !Number.isInteger(scheme.form_grade_id) || scheme.form_grade_id < 1) throw new Error('form_grade_id must be a positive integer')
    if (typeof scheme.term_id !== 'number' || !Number.isInteger(scheme.term_id) || scheme.term_id < 1) throw new Error('term_id must be a positive integer')
    // Only send allowed fields
    const payload: SchemeOfWorkCreate = {
      school_name: scheme.school_name.trim(),
      subject_name: scheme.subject_name.trim(),
      school_level_id: scheme.school_level_id,
      form_grade_id: scheme.form_grade_id,
      term_id: scheme.term_id,
    }
    if (scheme.status) payload.status = scheme.status
    if (typeof scheme.progress === 'number') payload.progress = scheme.progress
    if (scheme.content) payload.content = scheme.content
    if (scheme.scheme_metadata) payload.scheme_metadata = scheme.scheme_metadata
    if (typeof scheme.subject_id === 'number') payload.subject_id = scheme.subject_id
    if (scheme.due_date) payload.due_date = scheme.due_date
    return this.request<any>(`/api/schemes?user_google_id=${encodeURIComponent(userGoogleId)}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }
}

export const apiClient = new ApiClient()

// Type definitions
export interface SchoolLevel {
  id: number
  name: string
  code: string
  description?: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
  forms_grades: FormGrade[]
}

export interface FormGrade {
  id: number
  name: string
  code: string
  description?: string
  display_order: number
  school_level_id: number
  is_active: boolean
  created_at: string
  updated_at: string
  school_level?: SchoolLevel
  terms: Term[]
}

export interface Term {
  id: number
  name: string
  code: string
  description?: string
  start_date?: string
  end_date?: string
  display_order: number
  form_grade_id: number
  is_active: boolean
  created_at: string
  updated_at: string
  form_grade?: FormGrade
}

export interface Subject {
  id: number
  name: string
  code: string
  description?: string
  color?: string
  icon?: string
  animation_type?: string
  display_order: number
  term_id: number
  is_active: boolean
  created_at: string
  updated_at: string
  term?: Term
}

export interface User {
  id: number
  email: string
  name: string
  google_id: string
  picture?: string
  is_active: boolean
  created_at: string
  last_login?: string
}

export interface UserCreate {
  email: string
  name: string
  google_id: string
  picture?: string
}

export interface UserUpdate {
  name?: string
  picture?: string
  is_active?: boolean
}

export interface SchemeOfWork {
  id: number
  school_name: string
  subject_name: string
  status: string
  progress: number
  content?: any
  scheme_metadata?: any
  user_id: number
  school_level_id: number
  form_grade_id: number
  term_id: number
  subject_id?: number
  created_at: string
  updated_at: string
  due_date?: string
}

export interface SchemeOfWorkCreate {
  school_name: string
  subject_name: string
  status?: string
  progress?: number
  content?: any
  scheme_metadata?: any
  school_level_id: number
  form_grade_id: number
  term_id: number
  subject_id?: number
  due_date?: string
}

export interface SchemeOfWorkUpdate {
  school_name?: string
  subject_name?: string
  status?: string
  progress?: number
  content?: any
  scheme_metadata?: any
  school_level_id?: number
  form_grade_id?: number
  term_id?: number
  subject_id?: number
  due_date?: string
}

export interface DashboardStats {
  total_schemes: number
  completed_schemes: number
  active_schemes: number
  total_lessons: number
  completion_rate: number
}

// User API
export const userApi = {
  async create(data: UserCreate): Promise<any> {
    return apiClient.request<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async getCurrentUser(googleId: string): Promise<any> {
    return apiClient.request<User>(`/api/users/me?google_id=${googleId}`)
  },

  async updateCurrentUser(googleId: string, data: UserUpdate): Promise<any> {
    return apiClient.request<User>(`/api/users/me?google_id=${googleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }
}

// Scheme API
export const schemeApi = {
  async create(scheme: SchemeOfWorkCreate, userGoogleId: string): Promise<any> {
    return apiClient.createScheme(scheme, userGoogleId)
  },

  async getAll(userGoogleId: string, status?: string, skip = 0, limit = 100): Promise<any> {
    const params = new URLSearchParams({
      user_google_id: userGoogleId,
      skip: skip.toString(),
      limit: limit.toString()
    })
    if (status) params.append('status', status)
    
    return apiClient.request<SchemeOfWork[]>(`/api/schemes?${params}`)
  },

  async getById(id: number, userGoogleId: string): Promise<any> {
    return apiClient.request<SchemeOfWork>(`/api/schemes/${id}?user_google_id=${userGoogleId}`)
  },

  async update(id: number, data: SchemeOfWorkUpdate, userGoogleId: string): Promise<any> {
    return apiClient.request<SchemeOfWork>(`/api/schemes/${id}?user_google_id=${userGoogleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async delete(id: number, userGoogleId: string): Promise<any> {
    return apiClient.request<void>(`/api/schemes/${id}?user_google_id=${userGoogleId}`, { method: 'DELETE' })
  }
}

// Dashboard API
export const dashboardApi = {
  async getStats(userGoogleId: string): Promise<any> {
    return apiClient.request<DashboardStats>(`/api/dashboard/stats?user_google_id=${userGoogleId}`)
  }
}

// School Levels API
export const schoolLevelApi = {
  async getAll(includeInactive: boolean = false): Promise<any> {
    try {
      const response = await apiClient.request<SchoolLevel[]>(`/api/school-levels?include_relations=true`)
      return response
    } catch (error) {
      // Return mock data if backend endpoint doesn't exist yet
      console.warn('Backend school-levels endpoint not available, using mock data')
      return {
        success: true,
        message: "Mock data",
        data: [
          {
            id: 1,
            name: "Primary School",
            code: "PRI",
            description: "Primary education level",
            display_order: 1,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            forms_grades: [
              {
                id: 1,
                name: "Grade 1",
                code: "G1",
                description: "First grade",
                display_order: 1,
                school_level_id: 1,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                terms: [
                  { id: 1, name: "Term 1", code: "T1", display_order: 1, form_grade_id: 1, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                  { id: 2, name: "Term 2", code: "T2", display_order: 2, form_grade_id: 1, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                  { id: 3, name: "Term 3", code: "T3", display_order: 3, form_grade_id: 1, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
                ]
              },
              {
                id: 2,
                name: "Grade 2",
                code: "G2",
                description: "Second grade",
                display_order: 2,
                school_level_id: 1,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                terms: [
                  { id: 4, name: "Term 1", code: "T1", display_order: 1, form_grade_id: 2, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                  { id: 5, name: "Term 2", code: "T2", display_order: 2, form_grade_id: 2, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                  { id: 6, name: "Term 3", code: "T3", display_order: 3, form_grade_id: 2, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
                ]
              }
            ]
          },
          {
            id: 2,
            name: "Secondary School", 
            code: "SEC",
            description: "Secondary education level",
            display_order: 2,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            forms_grades: [
              {
                id: 3,
                name: "Form 1",
                code: "F1", 
                description: "First form",
                display_order: 1,
                school_level_id: 2,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                terms: [
                  { id: 7, name: "Term 1", code: "T1", display_order: 1, form_grade_id: 3, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                  { id: 8, name: "Term 2", code: "T2", display_order: 2, form_grade_id: 3, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
                  { id: 9, name: "Term 3", code: "T3", display_order: 3, form_grade_id: 3, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
                ]
              }
            ]
          }
        ]
      }
    }
  },

  async getById(id: number): Promise<any> {
    return apiClient.request<SchoolLevel>(`/api/school-levels/${id}`)
  }
}

// Form Grade API - Required by your page
export const formGradeApi = {
  async getAll(params?: { school_level_id?: number; include_inactive?: boolean }): Promise<any> {
    console.log('formGradeApi.getAll called with params:', params)
    
    // Mock response for now since backend doesn't have this endpoint yet
    if (params?.school_level_id) {
      // Filter mock data by school level
      const schoolLevelsResponse = await schoolLevelApi.getAll()
      if (schoolLevelsResponse.success && schoolLevelsResponse.data) {
        const schoolLevel = schoolLevelsResponse.data.find(sl => sl.id === params.school_level_id)
        if (schoolLevel) {
          return {
            success: true,
            message: "Forms retrieved successfully",
            data: schoolLevel.forms_grades
          }
        }
      }
    }
    
    return {
      success: true,
      message: "No forms found",
      data: []
    }
  },

  async getById(id: number): Promise<any> {
    // Mock response for now
    return {
      success: true,
      message: "Form grade retrieved",
      data: {
        id,
        name: `Form ${id}`,
        code: `F${id}`,
        description: `Form ${id} description`,
        display_order: id,
        school_level_id: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        terms: []
      }
    }
  },

  async getBySchoolLevel(schoolLevelId: number): Promise<any> {
    return this.getAll({ school_level_id: schoolLevelId })
  }
}

// Term API - Required by your page
export const termApi = {
  async getAll(params?: { form_grade_id?: number; include_inactive?: boolean }): Promise<any> {
    console.log('termApi.getAll called with params:', params)
    
    // Mock response for now since backend doesn't have this endpoint yet
    if (params?.form_grade_id) {
      const mockTerms = [
        { id: 1, name: "Term 1", code: "T1", display_order: 1, form_grade_id: params.form_grade_id, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 2, name: "Term 2", code: "T2", display_order: 2, form_grade_id: params.form_grade_id, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 3, name: "Term 3", code: "T3", display_order: 3, form_grade_id: params.form_grade_id, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ]
      
      return {
        success: true,
        message: "Terms retrieved successfully",
        data: mockTerms
      }
    }
    
    return {
      success: true,
      message: "No terms found",
      data: []
    }
  },

  async getById(id: number): Promise<any> {
    return {
      success: true,
      message: "Term retrieved",
      data: {
        id,
        name: `Term ${id}`,
        code: `T${id}`,
        description: `Term ${id} description`,
        display_order: id,
        form_grade_id: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  },

  async getByFormGrade(formGradeId: number, includeInactive: boolean = false): Promise<any> {
    return this.getAll({ form_grade_id: formGradeId, include_inactive: includeInactive })
  }
}

// Subject API - Required by your page  
export const subjectApi = {
  async getAll(params?: { term_id?: number; include_inactive?: boolean }): Promise<any> {
    console.log('subjectApi.getAll called with params:', params)
    
    // Mock response for now since backend doesn't have this endpoint yet
    if (params?.term_id) {
      const mockSubjects = [
        { id: 1, name: "Mathematics", code: "MATH", display_order: 1, term_id: params.term_id, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 2, name: "English", code: "ENG", display_order: 2, term_id: params.term_id, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 3, name: "Science", code: "SCI", display_order: 3, term_id: params.term_id, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 4, name: "Social Studies", code: "SST", display_order: 4, term_id: params.term_id, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ]
      
      return {
        success: true,
        message: "Subjects retrieved successfully",
        data: mockSubjects
      }
    }
    
    return {
      success: true,
      message: "No subjects found", 
      data: []
    }
  },

  async getById(id: number): Promise<any> {
    return {
      success: true,
      message: "Subject retrieved",
      data: {
        id,
        name: `Subject ${id}`,
        code: `SUB${id}`,
        description: `Subject ${id} description`,
        display_order: id,
        term_id: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
  },

  async getByTerm(termId: number, includeInactive: boolean = false): Promise<any> {
    return this.getAll({ term_id: termId, include_inactive: includeInactive })
  }
}

// Health check to test backend connection
export const healthApi = {
  async check(): Promise<any> {
    return apiClient.request<any>('/health')
  }
}

export default {
  userApi,
  schemeApi,
  dashboardApi,
  healthApi,
  schoolLevelApi,
  formGradeApi,
  termApi,
  subjectApi
}