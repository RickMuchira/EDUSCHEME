// frontend/src/app/dashboard/timetable/types/content.ts

export interface Subject {
    id: number
    name: string
    code: string
    color: string
    is_active: boolean
    term_id?: number
  }
  
  export interface Topic {
    id: number
    title: string
    description: string
    duration_weeks: number
    subject_id: number
    is_active: boolean
    display_order: number
    created_at: string
    updated_at: string
  }
  
  export interface Subtopic {
    id: number
    title: string
    content: string
    activities?: any[]
    assessment_criteria?: any[]
    resources?: any[]
    duration_lessons: number
    topic_id: number
    is_active: boolean
    display_order: number
    created_at: string
    updated_at: string
  }
  
  export interface ContentSelectionState {
    selectedTopicIds: number[]
    selectedSubtopicIds: number[]
    searchTerm: string
    filterBy: 'all' | 'active' | 'inactive'
    viewMode: 'list' | 'grid' | 'compact'
    showOnlySelected: boolean
  }
  
  export interface ContentStats {
    totalTopics: number
    totalSubtopics: number
    selectedTopics: number
    selectedSubtopics: number
    totalWeeks: number
    totalLessons: number
  }