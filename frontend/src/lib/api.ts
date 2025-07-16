// File: frontend/src/lib/api.ts
// FULLY UPDATED API client with ALL backend endpoints

import apiClient, { ApiClient as ApiClientClass } from './apiClient';

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
    apiClient.get('/api/v1/admin/forms-grades', params),

  getById: (id: number): Promise<any> =>
    apiClient.get(`/api/v1/admin/forms-grades/${id}`),

  getBySchoolLevel: (schoolLevelId: number): Promise<any> =>
    apiClient.get('/api/v1/admin/forms-grades', { school_level_id: schoolLevelId }),
};

export const termApi = {
  getAll: (params?: any): Promise<any> =>
    apiClient.get('/api/v1/admin/terms', params),

  getById: (id: number): Promise<any> =>
    apiClient.get(`/api/v1/admin/terms/${id}`),

  getByFormGrade: (formGradeId: number): Promise<any> =>
    apiClient.get('/api/v1/admin/terms', { form_grade_id: formGradeId }),
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
    return apiClient.request<DashboardStats>(`/api/dashboard/stats?user_google_id=${userGoogleId}`)
  }
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

// Subject API - Required by your page  
export const subjectApi = {
  async getAll(params?: { term_id?: number; include_inactive?: boolean }): Promise<any> {
    // Real backend call
    return apiClient.get('/api/v1/admin/subjects', params)
  },

  async getById(id: number): Promise<any> {
    return apiClient.get(`/api/v1/admin/subjects/${id}`)
  },

  async getByTerm(termId: number, includeInactive: boolean = false): Promise<any> {
    return apiClient.get('/api/v1/admin/subjects', { term_id: termId, include_inactive: includeInactive })
  }
}

export const topicApi = {
  async getAll(params?: { subject_id?: number; search?: string; skip?: number; limit?: number }): Promise<any> {
    return apiClient.get('/api/v1/admin/topics', params)
  },

  async getById(id: number): Promise<any> {
    return apiClient.get(`/api/v1/admin/topics/${id}`)
  },

  async getBySubject(subjectId: number): Promise<any> {
    return apiClient.get('/api/v1/admin/topics', { subject_id: subjectId })
  }
}

export const subtopicApi = {
  async getAll(params?: { topic_id?: number; search?: string; skip?: number; limit?: number }): Promise<any> {
    return apiClient.get('/api/v1/admin/subtopics', params)
  },

  async getById(id: number): Promise<any> {
    return apiClient.get(`/api/v1/admin/subtopics/${id}`)
  },

  async getByTopic(topicId: number): Promise<any> {
    return apiClient.get('/api/v1/admin/subtopics', { topic_id: topicId })
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