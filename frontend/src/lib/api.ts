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

export class ApiClient {
  private baseURL: string;
  
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('API request failed:', error);
      // Check if it's a connection error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to backend server. Make sure your FastAPI server is running on localhost:8000');
      }
      throw error;
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

export const apiClient = new ApiClient();

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
  getAll: (includeRelations = true): Promise<SchoolLevel[]> =>
    apiClient.get('/api/school-levels', { include_relations: includeRelations }),

  getById: (id: number, includeRelations = true): Promise<SchoolLevel> =>
    apiClient.get(`/api/school-levels/${id}`, { include_relations: includeRelations }),
};

export const formGradeApi = {
  getAll: (): Promise<FormGrade[]> =>
    apiClient.get('/api/form-grades'),

  getById: (id: number): Promise<FormGrade> =>
    apiClient.get(`/api/form-grades/${id}`),

  getBySchoolLevel: (schoolLevelId: number): Promise<FormGrade[]> =>
    apiClient.get('/api/form-grades', { school_level_id: schoolLevelId }),
};

export const termApi = {
  getAll: (): Promise<Term[]> =>
    apiClient.get('/api/terms'),

  getById: (id: number): Promise<Term> =>
    apiClient.get(`/api/terms/${id}`),

  getByFormGrade: (formGradeId: number): Promise<Term[]> =>
    apiClient.get('/api/terms', { form_grade_id: formGradeId }),
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