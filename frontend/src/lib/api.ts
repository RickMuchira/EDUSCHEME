// File: frontend/src/lib/api.ts
// FULLY UPDATED API client with ALL backend endpoints

const API_BASE_URL = 'http://localhost:8000'

// Base API response wrapper
interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  total?: number
}

// Base API client with error handling
class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async patch<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

const apiClient = new ApiClient(API_BASE_URL)

// Type definitions
export interface SchoolLevel {
  id: number
  name: string
  code: string
  description?: string
  display_order: number
  school_id: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Section {
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

export interface Topic {
  id: number
  title: string
  description?: string
  learning_objectives: string[]
  duration_weeks: number
  display_order: number
  subject_id: number
  is_active: boolean
  created_at: string
  updated_at: string
  subject?: Subject
  subtopics_count?: number
}

export interface Subtopic {
  id: number
  title: string
  content?: string
  activities: any[]
  assessment_criteria: any[]
  resources: any[]
  duration_lessons: number
  display_order: number
  topic_id: number
  is_active: boolean
  created_at: string
  updated_at: string
  topic?: Topic
}

// Create types for API input
export interface SchoolLevelCreate {
  name: string
  code: string
  description?: string
  display_order: number
  school_id: number
  is_active: boolean
}

export interface SchoolLevelUpdate {
  name?: string
  code?: string
  description?: string
  display_order?: number
  school_id?: number
  is_active?: boolean
}

export interface SectionCreate {
  name: string
  code: string
  description?: string
  display_order: number
  school_level_id: number
  is_active: boolean
}

export interface SectionUpdate {
  name?: string
  code?: string
  description?: string
  display_order?: number
  school_level_id?: number
  is_active?: boolean
}

export interface FormGradeCreate {
  name: string
  code: string
  description?: string
  display_order: number
  school_level_id: number
  is_active: boolean
}

export interface FormGradeUpdate {
  name?: string
  code?: string
  description?: string
  display_order?: number
  school_level_id?: number
  is_active?: boolean
}

export interface TermCreate {
  name: string
  code: string
  description?: string
  start_date?: string
  end_date?: string
  display_order: number
  form_grade_id: number
  is_active: boolean
}

export interface TermUpdate {
  name?: string
  code?: string
  description?: string
  start_date?: string
  end_date?: string
  display_order?: number
  form_grade_id?: number
  is_active?: boolean
}

export interface SubjectCreate {
  name: string
  code: string
  description?: string
  color?: string
  icon?: string
  animation_type?: string
  display_order: number
  term_id: number
  is_active: boolean
}

export interface SubjectUpdate {
  name?: string
  code?: string
  description?: string
  color?: string
  icon?: string
  animation_type?: string
  display_order?: number
  term_id?: number
  is_active?: boolean
}

export interface TopicCreate {
  title: string
  description?: string
  learning_objectives: string[]
  duration_weeks: number
  display_order: number
  subject_id: number
  is_active: boolean
}

export interface TopicUpdate {
  title?: string
  description?: string
  learning_objectives?: string[]
  duration_weeks?: number
  display_order?: number
  subject_id?: number
  is_active?: boolean
}

export interface SubtopicCreate {
  title: string
  content?: string
  activities: any[]
  assessment_criteria: any[]
  resources: any[]
  duration_lessons: number
  display_order: number
  topic_id: number
  is_active: boolean
}

export interface SubtopicUpdate {
  title?: string
  content?: string
  activities?: any[]
  assessment_criteria?: any[]
  resources?: any[]
  duration_lessons?: number
  display_order?: number
  topic_id?: number
  is_active?: boolean
}

// School Levels API - COMPLETE
export const schoolLevelApi = {
  async getAll(includeInactive: boolean = false): Promise<ApiResponse<SchoolLevel[]>> {
    return apiClient.get<SchoolLevel[]>(`/api/v1/admin/school-levels/?include_inactive=${includeInactive}`)
  },

  async getById(id: number): Promise<ApiResponse<SchoolLevel>> {
    return apiClient.get<SchoolLevel>(`/api/v1/admin/school-levels/${id}`)
  },

  async create(data: SchoolLevelCreate): Promise<ApiResponse<SchoolLevel>> {
    return apiClient.post<SchoolLevel>('/api/v1/admin/school-levels/', data)
  },

  async update(id: number, data: SchoolLevelUpdate): Promise<ApiResponse<SchoolLevel>> {
    return apiClient.patch<SchoolLevel>(`/api/v1/admin/school-levels/${id}`, data)
  },

  async delete(id: number, softDelete: boolean = true): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/api/v1/admin/school-levels/${id}?soft_delete=${softDelete}`)
  }
}

// Sections API - COMPLETE
export const sectionApi = {
  async getAll(params?: { school_level_id?: number; include_inactive?: boolean }): Promise<ApiResponse<Section[]>> {
    const searchParams = new URLSearchParams()
    if (params?.school_level_id) searchParams.append('school_level_id', params.school_level_id.toString())
    if (params?.include_inactive) searchParams.append('include_inactive', 'true')
    
    return apiClient.get<Section[]>(`/api/v1/admin/sections/?${searchParams}`)
  },

  async getById(id: number): Promise<ApiResponse<Section>> {
    return apiClient.get<Section>(`/api/v1/admin/sections/${id}`)
  },

  async create(data: SectionCreate): Promise<ApiResponse<Section>> {
    return apiClient.post<Section>('/api/v1/admin/sections/', data)
  },

  async update(id: number, data: SectionUpdate): Promise<ApiResponse<Section>> {
    return apiClient.patch<Section>(`/api/v1/admin/sections/${id}`, data)
  },

  async delete(id: number, softDelete: boolean = true): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/api/v1/admin/sections/${id}?soft_delete=${softDelete}`)
  }
}

// Form Grades API - COMPLETE
export const formGradeApi = {
  async getAll(params?: { school_level_id?: number; include_inactive?: boolean }): Promise<ApiResponse<FormGrade[]>> {
    const searchParams = new URLSearchParams()
    if (params?.school_level_id) searchParams.append('school_level_id', params.school_level_id.toString())
    if (params?.include_inactive) searchParams.append('include_inactive', 'true')
    
    return apiClient.get<FormGrade[]>(`/api/v1/admin/forms-grades/?${searchParams}`)
  },

  async getById(id: number): Promise<ApiResponse<FormGrade>> {
    return apiClient.get<FormGrade>(`/api/v1/admin/forms-grades/${id}`)
  },

  async create(data: FormGradeCreate): Promise<ApiResponse<FormGrade>> {
    return apiClient.post<FormGrade>('/api/v1/admin/forms-grades/', data)
  },

  async update(id: number, data: FormGradeUpdate): Promise<ApiResponse<FormGrade>> {
    return apiClient.patch<FormGrade>(`/api/v1/admin/forms-grades/${id}`, data)
  },

  async delete(id: number, softDelete: boolean = true): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/api/v1/admin/forms-grades/${id}?soft_delete=${softDelete}`)
  }
}

// Terms API - COMPLETE
export const termApi = {
  async getAll(params?: { form_grade_id?: number; include_inactive?: boolean; current_only?: boolean }): Promise<ApiResponse<Term[]>> {
    const searchParams = new URLSearchParams()
    if (params?.form_grade_id) searchParams.append('form_grade_id', params.form_grade_id.toString())
    if (params?.include_inactive) searchParams.append('include_inactive', 'true')
    if (params?.current_only) searchParams.append('current_only', 'true')
    
    return apiClient.get<Term[]>(`/api/v1/admin/terms/?${searchParams}`)
  },

  // 🔧 FIXED: Added missing getByFormGrade method that was causing the error
  async getByFormGrade(formGradeId: number, includeInactive: boolean = false): Promise<ApiResponse<Term[]>> {
    const searchParams = new URLSearchParams()
    searchParams.append('form_grade_id', formGradeId.toString())
    if (includeInactive) searchParams.append('include_inactive', 'true')
    
    return apiClient.get<Term[]>(`/api/v1/admin/terms/?${searchParams}`)
  },

  async getById(id: number): Promise<ApiResponse<Term>> {
    return apiClient.get<Term>(`/api/v1/admin/terms/${id}`)
  },

  async create(data: TermCreate): Promise<ApiResponse<Term>> {
    return apiClient.post<Term>('/api/v1/admin/terms/', data)
  },

  async update(id: number, data: TermUpdate): Promise<ApiResponse<Term>> {
    return apiClient.patch<Term>(`/api/v1/admin/terms/${id}`, data)
  },

  async delete(id: number, softDelete: boolean = true): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/api/v1/admin/terms/${id}?soft_delete=${softDelete}`)
  }
}

// Subjects API - COMPLETE
export const subjectApi = {
  async getAll(params?: { term_id?: number; include_inactive?: boolean; search?: string }): Promise<ApiResponse<Subject[]>> {
    const searchParams = new URLSearchParams()
    if (params?.term_id) searchParams.append('term_id', params.term_id.toString())
    if (params?.include_inactive) searchParams.append('include_inactive', 'true')
    if (params?.search) searchParams.append('search', params.search)
    
    return apiClient.get<Subject[]>(`/api/v1/admin/subjects/?${searchParams}`)
  },

  // 🔧 FIXED: Added missing getByTerm method that was causing the error
  async getByTerm(termId: number, includeInactive: boolean = false): Promise<ApiResponse<Subject[]>> {
    const searchParams = new URLSearchParams()
    searchParams.append('term_id', termId.toString())
    if (includeInactive) searchParams.append('include_inactive', 'true')
    
    return apiClient.get<Subject[]>(`/api/v1/admin/subjects/?${searchParams}`)
  },

  async get(id: number): Promise<ApiResponse<Subject>> {
    return apiClient.get<Subject>(`/api/v1/admin/subjects/${id}`)
  },

  async getById(id: number): Promise<ApiResponse<Subject>> {
    return apiClient.get<Subject>(`/api/v1/admin/subjects/${id}`)
  },

  async create(data: SubjectCreate): Promise<ApiResponse<Subject>> {
    return apiClient.post<Subject>('/api/v1/admin/subjects/', data)
  },

  async update(id: number, data: SubjectUpdate): Promise<ApiResponse<Subject>> {
    return apiClient.put<Subject>(`/api/v1/admin/subjects/${id}`, data)
  },

  async delete(id: number, softDelete: boolean = true): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/api/v1/admin/subjects/${id}?soft_delete=${softDelete}`)
  }
}

// Topics API - COMPLETE WITH MISSING ENDPOINTS
export const topicApi = {
  async getAll(params?: { subject_id?: number; search?: string }): Promise<ApiResponse<Topic[]>> {
    const searchParams = new URLSearchParams()
    if (params?.subject_id) searchParams.append('subject_id', params.subject_id.toString())
    if (params?.search) searchParams.append('search', params.search)
    
    return apiClient.get<Topic[]>(`/api/v1/admin/topics/?${searchParams}`)
  },

  // 🔧 FIXED: Added missing getBySubject method
  async getBySubject(subjectId: number): Promise<ApiResponse<Topic[]>> {
    return apiClient.get<Topic[]>(`/api/v1/admin/topics/?subject_id=${subjectId}`)
  },

  async getById(id: number): Promise<ApiResponse<Topic>> {
    return apiClient.get<Topic>(`/api/v1/admin/topics/${id}`)
  },

  async create(data: TopicCreate): Promise<ApiResponse<Topic>> {
    return apiClient.post<Topic>('/api/v1/admin/topics/', data)
  },

  // 🆕 ADDED: Missing update method (backend has this endpoint)
  async update(id: number, data: TopicUpdate): Promise<ApiResponse<Topic>> {
    return apiClient.put<Topic>(`/api/v1/admin/topics/${id}`, data)
  },

  // 🆕 ADDED: Missing delete method (backend has this endpoint)
  async delete(id: number, softDelete: boolean = true): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/api/v1/admin/topics/${id}?soft_delete=${softDelete}`)
  }
}

// Subtopics API - COMPLETE WITH MISSING ENDPOINTS
export const subtopicApi = {
  async getAll(params?: { topic_id?: number; search?: string; min_lessons?: number; max_lessons?: number }): Promise<ApiResponse<Subtopic[]>> {
    const searchParams = new URLSearchParams()
    if (params?.topic_id) searchParams.append('topic_id', params.topic_id.toString())
    if (params?.search) searchParams.append('search', params.search)
    if (params?.min_lessons) searchParams.append('min_lessons', params.min_lessons.toString())
    if (params?.max_lessons) searchParams.append('max_lessons', params.max_lessons.toString())
    
    return apiClient.get<Subtopic[]>(`/api/v1/admin/subtopics/?${searchParams}`)
  },

  async getByTopic(topicId: number): Promise<ApiResponse<Subtopic[]>> {
    return apiClient.get<Subtopic[]>(`/api/v1/admin/subtopics/?topic_id=${topicId}`)
  },

  async getById(id: number): Promise<ApiResponse<Subtopic>> {
    return apiClient.get<Subtopic>(`/api/v1/admin/subtopics/${id}`)
  },

  async create(data: SubtopicCreate): Promise<ApiResponse<Subtopic>> {
    return apiClient.post<Subtopic>('/api/v1/admin/subtopics/', data)
  },

  // 🆕 ADDED: Missing update method (backend has this endpoint)
  async update(id: number, data: SubtopicUpdate): Promise<ApiResponse<Subtopic>> {
    return apiClient.put<Subtopic>(`/api/v1/admin/subtopics/${id}`, data)
  },

  // 🆕 ADDED: Missing delete method (backend has this endpoint)
  async delete(id: number, softDelete: boolean = true): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/api/v1/admin/subtopics/${id}?soft_delete=${softDelete}`)
  }
}

// Statistics API
export const statisticsApi = {
  async getAll(schoolId?: number): Promise<ApiResponse<any>> {
    const searchParams = new URLSearchParams()
    if (schoolId) searchParams.append('school_id', schoolId.toString())
    
    return apiClient.get<any>(`/api/v1/admin/statistics/?${searchParams}`)
  }
}

// Subject Options API
export const subjectOptionsApi = {
  async getAll(): Promise<ApiResponse<any>> {
    return apiClient.get<any>('/api/v1/admin/subject-options/')
  }
}

// Hierarchy API
export const hierarchyApi = {
  async getBySchool(schoolId: number): Promise<ApiResponse<any>> {
    return apiClient.get<any>(`/api/v1/admin/hierarchy/${schoolId}`)
  }
}

// Bulk Operations API
export const bulkApi = {
  async createStructure(data: any): Promise<ApiResponse<any>> {
    return apiClient.post<any>('/api/v1/admin/bulk/create-structure/', data)
  }
}

// Health Check API
export const healthApi = {
  async check(): Promise<any> {
    return apiClient.get<any>('/health')
  }
}

export default {
  schoolLevelApi,
  sectionApi,
  formGradeApi,
  termApi,
  subjectApi,
  topicApi,
  subtopicApi,
  statisticsApi,
  subjectOptionsApi,
  hierarchyApi,
  bulkApi,
  healthApi
}