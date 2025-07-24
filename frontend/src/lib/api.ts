// File: frontend/src/lib/api.ts
// FULLY UPDATED API client with ALL backend endpoints

import apiClient from './apiClient';

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Removed duplicate ApiClient class and instance. Use apiClient from apiClient.ts

// Types
export interface SchoolLevel {
  id: number;
  name: string;
  code: string;
  description?: string;
  display_order: number;
  grade_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  form_grades?: FormGrade[];
  terms?: Term[];
}

export interface FormGrade {
  id: number;
  name: string;
  code: string;
  description?: string;
  display_order: number;
  school_level_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Term {
  id: number;
  name: string;
  code: string;
  start_date?: string;
  end_date?: string;
  display_order: number;
  form_grade_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SchemeData {
  school_name: string;
  subject_name: string;
  school_level_id: number;
  form_grade_id: number;
  term_id: number;
  status?: string;
  progress?: number;
  content?: any;
  scheme_metadata?: any;
  subject_id?: number;
  due_date?: string;
}

export interface SchemeResponse {
  id: number;
  school_name: string;
  subject_name: string;
  school_level_id: number;
  form_grade_id: number;
  term_id: number;
  user_id: number;
  status: string;
  progress: number;
  content?: any;
  scheme_metadata?: any;
  subject_id?: number;
  created_at: string;
  updated_at: string;
  due_date?: string;
}

// API functions
export const schoolLevelApi = {
  getAll: async (includeRelations = true): Promise<SchoolLevel[]> => {
    const response = await apiClient.get('/api/school-levels', { include_relations: includeRelations });
    if (Array.isArray(response)) {
      return response;
    } else if (response && response.success && Array.isArray(response.data)) {
      return response.data;
    } else {
      return [];
    }
  },

  getById: async (id: number, includeRelations = true): Promise<SchoolLevel | null> => {
    const response = await apiClient.get(`/api/school-levels/${id}`, { include_relations: includeRelations });
    if (response && response.success && response.data) {
      return response.data;
    } else if (response && response.id) {
      return response;
    } else {
      return null;
    }
  },
};

export const formGradeApi = {
  getAll: (params?: any): Promise<any> =>
    apiClient.get('/api/v1/admin/forms-grades/', params),

  getById: (id: number): Promise<any> =>
    apiClient.get(`/api/v1/admin/forms-grades/${id}`),

  getBySchoolLevel: (schoolLevelId: number): Promise<any> =>
    apiClient.get('/api/v1/admin/forms-grades/', { school_level_id: schoolLevelId }),
};

export const termApi = {
  getAll: (params?: any): Promise<any> =>
    apiClient.get('/api/v1/admin/terms/', params),

  getById: (id: number): Promise<any> =>
    apiClient.get(`/api/v1/admin/terms/${id}`),

  getByFormGrade: (formGradeId: number): Promise<any> =>
    apiClient.get('/api/v1/admin/terms/', { form_grade_id: formGradeId }),
};

export const schemeApi = {
  create: (schemeData: SchemeData, userGoogleId: string): Promise<SchemeResponse> =>
    apiClient.post('/api/schemes', schemeData, { user_google_id: userGoogleId }),

  getAll: (userGoogleId: string, skip = 0, limit = 100): Promise<SchemeResponse[]> =>
    apiClient.get('/api/schemes', { 
      user_google_id: userGoogleId, 
      skip, 
      limit 
    }),

  getById: (id: number, userGoogleId: string): Promise<SchemeResponse> =>
    apiClient.get(`/api/schemes/${id}`, { user_google_id: userGoogleId }),

  update: (id: number, schemeData: Partial<SchemeData>, userGoogleId: string): Promise<SchemeResponse> =>
    apiClient.put(`/api/schemes/${id}`, schemeData, { user_google_id: userGoogleId }),

  delete: (id: number, userGoogleId: string): Promise<{ message: string }> =>
    apiClient.delete(`/api/schemes/${id}`, { user_google_id: userGoogleId }),
};

// Dashboard API
export const dashboardApi = {
  async getStats(userGoogleId: string): Promise<any> {
    return apiClient.request<any>(`/api/dashboard/stats?user_google_id=${userGoogleId}`)
  }
}

// User API
export const userApi = {
  async create(data: any): Promise<any> {
    return apiClient.request<any>('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async getCurrentUser(googleId: string): Promise<any> {
    return apiClient.request<any>(`/api/users/me?google_id=${googleId}`)
  },

  async updateCurrentUser(googleId: string, data: any): Promise<any> {
    return apiClient.request<any>(`/api/users/me?google_id=${googleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }
}

// Subject API - Required by your page  
export const subjectApi = {
  async getAll(params?: { term_id?: number; include_inactive?: boolean }): Promise<any> {
    // Real backend call
    return apiClient.get('/api/v1/admin/subjects/', params)
  },

  async getById(id: number): Promise<any> {
    return apiClient.get(`/api/v1/admin/subjects/${id}`)
  },

  async getByTerm(termId: number, includeInactive: boolean = false): Promise<any> {
    return apiClient.get('/api/v1/admin/subjects/', { term_id: termId, include_inactive: includeInactive })
  }
}

export const topicApi = {
  async getAll(params?: { subject_id?: number; search?: string; skip?: number; limit?: number }): Promise<any> {
    return apiClient.get('/api/v1/admin/topics/', params)
  },

  async getById(id: number): Promise<any> {
    return apiClient.get(`/api/v1/admin/topics/${id}`)
  },

  async getBySubject(subjectId: number): Promise<any> {
    return apiClient.get('/api/v1/admin/topics/', { subject_id: subjectId })
  }
}

export const subtopicApi = {
  async getAll(params?: { topic_id?: number; search?: string; skip?: number; limit?: number }): Promise<any> {
    return apiClient.get('/api/v1/admin/subtopics/', params)
  },

  async getById(id: number): Promise<any> {
    return apiClient.get(`/api/v1/admin/subtopics/${id}`)
  },

  async getByTopic(topicId: number): Promise<any> {
    return apiClient.get('/api/v1/admin/subtopics/', { topic_id: topicId })
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

// Helper function to extract topics and subtopics from scheme content
export const extractSchemeContent = (scheme: any) => {
  try {
    const content = scheme.content || {}
    const topics = content.topics || []
    const processedTopics = topics.map((topic: any, index: number) => ({
      id: topic.id || `topic-${index}`,
      title: topic.title || `Topic ${index + 1}`,
      description: topic.description || '',
      subtopics: (topic.subtopics || []).map((subtopic: any, subIndex: number) => ({
        id: subtopic.id || `subtopic-${index}-${subIndex}`,
        title: subtopic.title || `Subtopic ${subIndex + 1}`,
        content: subtopic.content || '',
        duration: subtopic.duration || 1,
        parentTopicId: topic.id || `topic-${index}`
      }))
    }))
    return {
      topics: processedTopics,
      metadata: content.metadata || {},
      totalTopics: processedTopics.length,
      totalSubtopics: processedTopics.reduce((acc: number, topic: any) => acc + (topic.subtopics?.length || 0), 0)
    }
  } catch (error) {
    return {
      topics: [],
      metadata: {},
      totalTopics: 0,
      totalSubtopics: 0
    }
  }
}

export const enhancedSchemeApi = {
  async getUserSchemesWithContent(userGoogleId: string): Promise<any[]> {
    try {
      const schemes = await schemeApi.getAll(userGoogleId)
      return schemes.map(scheme => ({
        ...scheme,
        extractedContent: extractSchemeContent(scheme)
      }))
    } catch (error) {
      throw error
    }
  },
  async getSchemeWithContent(schemeId: number, userGoogleId: string): Promise<any> {
    try {
      const scheme = await schemeApi.getById(schemeId, userGoogleId)
      return {
        ...scheme,
        extractedContent: extractSchemeContent(scheme)
      }
    } catch (error) {
      throw error
    }
  },
  async searchTopicsInSchemes(userGoogleId: string, searchTerm: string): Promise<any[]> {
    try {
      const schemes = await this.getUserSchemesWithContent(userGoogleId)
      const allTopics: any[] = []
      schemes.forEach(scheme => {
        const topics = scheme.extractedContent.topics.filter((topic: any) =>
          topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          topic.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
        topics.forEach((topic: any) => {
          allTopics.push({
            ...topic,
            schemeId: scheme.id,
            schemeName: scheme.subject_name,
            schoolName: scheme.school_name
          })
        })
      })
      return allTopics
    } catch (error) {
      return []
    }
  },
  async searchSubtopicsInSchemes(userGoogleId: string, searchTerm: string): Promise<any[]> {
    try {
      const schemes = await this.getUserSchemesWithContent(userGoogleId)
      const allSubtopics: any[] = []
      schemes.forEach(scheme => {
        scheme.extractedContent.topics.forEach((topic: any) => {
          const subtopics = (topic.subtopics || []).filter((subtopic: any) =>
            subtopic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            subtopic.content.toLowerCase().includes(searchTerm.toLowerCase())
          )
          subtopics.forEach((subtopic: any) => {
            allSubtopics.push({
              ...subtopic,
              topicTitle: topic.title,
              schemeId: scheme.id,
              schemeName: scheme.subject_name,
              schoolName: scheme.school_name
            })
          })
        })
      })
      return allSubtopics
    } catch (error) {
      return []
    }
  }
}

export const sessionHelpers = {
  getUserIdFromSession(session: any): string {
    if (!session?.user) return '1'
    if (session.user.id) return session.user.id.toString()
    if (session.user.sub) return session.user.sub
    if (session.user.email) return session.user.email
    return '1'
  },
  validateUserSession(session: any): boolean {
    return !!(session?.user?.id || session?.user?.email)
  },
  getUserDisplayName(session: any): string {
    if (!session?.user) return 'Guest'
    return session.user.name || session.user.email?.split('@')[0] || 'User'
  }
}

export const contentValidators = {
  validateSchemeContent(content: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    if (!content) {
      errors.push('Content is required')
      return { isValid: false, errors }
    }
    if (!content.topics || !Array.isArray(content.topics)) {
      errors.push('Topics array is required')
    } else {
      content.topics.forEach((topic: any, index: number) => {
        if (!topic.title) {
          errors.push(`Topic ${index + 1} is missing a title`)
        }
        if (topic.subtopics && Array.isArray(topic.subtopics)) {
          topic.subtopics.forEach((subtopic: any, subIndex: number) => {
            if (!subtopic.title) {
              errors.push(`Subtopic ${subIndex + 1} in topic ${index + 1} is missing a title`)
            }
          })
        }
      })
    }
    return { isValid: errors.length === 0, errors }
  }
}