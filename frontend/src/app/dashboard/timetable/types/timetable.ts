export interface TimeSlot {
  id: string
  time: string
  label: string
  period: number
  isEvening?: boolean
}

export interface Subject {
  id: number
  name: string
  code: string
  color: string
  description?: string
}

export interface Topic {
  id: number
  name: string
  code: string
  description?: string
}

export interface Subtopic {
  id: number
  name: string
  code: string
  description?: string
}

export interface LessonSlot {
  day: string
  timeSlot: string
  period: number
  subject: Subject | null
  topic?: Topic | null
  subtopic?: Subtopic | null
  isDoubleLesson?: boolean
  doublePosition?: 'top' | 'bottom'
  isEvening?: boolean
  notes?: string
}

export interface TimetableData {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  slots?: LessonSlot[]
}

export interface TimetableAnalytics {
  totalSessions: number
  totalHours: number
  singleLessons: number
  doubleLessons: number
  eveningLessons: number
  dailyDistribution: Record<string, number>
  totalDays: number
  averageSessionsPerDay: number
  patternType: string
  patternDescription: string
  workloadLevel: string
  workloadPercentage: number
  efficiency: number
  lastUpdated: Date
}

export interface AITip {
  id: string
  type: 'success' | 'warning' | 'info' | 'optimization' | 'timing' | 'goal'
  title: string
  message: string
  actionable?: boolean
  priority: 'low' | 'medium' | 'high'
}

export interface TimetableTemplate {
  id: string
  name: string
  description: string
  iconType: string  // Icon type as string instead of React component
  sessions: number
  totalHours: number
  pattern: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  slots: Partial<LessonSlot>[]
  benefits: string[]
  bestFor: string
}

export interface WorkloadAssessment {
  level: 'light' | 'optimal' | 'heavy' | 'overloaded'
  percentage: number
  recommendation: string
}

export interface SchedulePattern {
  type: string
  description: string
  strength: number
  suggestions: string[]
} 