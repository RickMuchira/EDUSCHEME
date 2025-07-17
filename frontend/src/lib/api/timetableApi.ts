// frontend/src/lib/api/timetableApi.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface TimetableSlot {
  day_of_week: string
  time_slot: string
  period_number: number
  subject_id?: number
  topic_id?: number
  subtopic_id?: number
  is_double_lesson?: boolean
  double_position?: 'top' | 'bottom'
  is_evening?: boolean
  notes?: string
}

interface AutosaveData {
  timetable_id?: string
  name?: string
  description?: string
  subject_id?: number
  slots: TimetableSlot[]
  selected_topics?: any[]
  selected_subtopics?: any[]
}

interface TimetableResponse {
  success: boolean
  message: string
  data: any
  analytics?: any
}

class TimetableApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  // Auto-save timetable data
  async autosave(data: AutosaveData, userId: number): Promise<TimetableResponse> {
    return this.request<TimetableResponse>(`/api/timetables/autosave?user_id=${userId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Create a new timetable
  async create(timetableData: any, userId: number): Promise<TimetableResponse> {
    return this.request<TimetableResponse>(`/api/timetables?user_id=${userId}`, {
      method: 'POST',
      body: JSON.stringify(timetableData),
    })
  }

  // Update existing timetable
  async update(timetableId: string, data: any, userId: number): Promise<TimetableResponse> {
    return this.request<TimetableResponse>(`/api/timetables/${timetableId}?user_id=${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Get a specific timetable
  async get(timetableId: string, userId: number): Promise<TimetableResponse> {
    return this.request<TimetableResponse>(`/api/timetables/${timetableId}?user_id=${userId}`)
  }

  // List all timetables for a user
  async list(userId: number, subjectId?: number): Promise<TimetableResponse> {
    const params = new URLSearchParams({ user_id: userId.toString() })
    if (subjectId) {
      params.append('subject_id', subjectId.toString())
    }
    return this.request<TimetableResponse>(`/api/timetables?${params}`)
  }

  // Delete a timetable
  async delete(timetableId: string, userId: number): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/timetables/${timetableId}?user_id=${userId}`, {
      method: 'DELETE',
    })
  }

  // Add a single slot
  async addSlot(timetableId: string, slotData: TimetableSlot, userId: number): Promise<TimetableResponse> {
    return this.request<TimetableResponse>(`/api/timetables/${timetableId}/slots?user_id=${userId}`, {
      method: 'POST',
      body: JSON.stringify(slotData),
    })
  }

  // Remove a single slot
  async removeSlot(
    timetableId: string, 
    dayOfWeek: string, 
    timeSlot: string, 
    userId: number
  ): Promise<{ success: boolean; message: string }> {
    const params = new URLSearchParams({
      user_id: userId.toString(),
      day_of_week: dayOfWeek,
      time_slot: timeSlot,
    })
    return this.request(`/api/timetables/${timetableId}/slots?${params}`, {
      method: 'DELETE',
    })
  }

  // Get analytics for a timetable
  async getAnalytics(timetableId: string, userId: number): Promise<TimetableResponse> {
    return this.request<TimetableResponse>(`/api/timetables/${timetableId}/analytics?user_id=${userId}`)
  }

  // Convert frontend slot format to backend format
  convertSlotToBackend(slot: any, subjectId?: number, topicId?: number, subtopicId?: number): TimetableSlot {
    return {
      day_of_week: slot.day,
      time_slot: slot.timeSlot,
      period_number: slot.period,
      subject_id: subjectId,
      topic_id: topicId,
      subtopic_id: subtopicId,
      is_double_lesson: slot.isDoubleLesson || false,
      double_position: slot.doublePosition,
      is_evening: slot.isEvening || false,
      notes: slot.notes || '',
    }
  }

  // Convert backend slot format to frontend format
  convertSlotToFrontend(backendSlot: any): any {
    return {
      day: backendSlot.day_of_week,
      timeSlot: backendSlot.time_slot,
      period: backendSlot.period_number,
      subject: backendSlot.subject,
      topic: backendSlot.topic,
      subtopic: backendSlot.subtopic,
      isDoubleLesson: backendSlot.is_double_lesson,
      doublePosition: backendSlot.double_position,
      isEvening: backendSlot.is_evening,
      notes: backendSlot.notes,
    }
  }
}

export const timetableApi = new TimetableApiClient()
export type { TimetableSlot, AutosaveData, TimetableResponse }