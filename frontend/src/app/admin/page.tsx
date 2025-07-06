'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Calendar,
  GraduationCap,
  FileText,
  List,
  Plus,
  Eye,
  Activity,
  Clock,
  Target
} from 'lucide-react'
import { utilityApi } from '@/lib/api'
import Link from 'next/link'

interface DashboardStats {
  total_school_levels: number
  total_forms_grades: number
  total_terms: number
  total_subjects: number
  total_topics: number
  total_subtopics: number
}

interface QuickAction {
  title: string
  description: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const quickActions: QuickAction[] = [
  {
    title: 'Add School Level',
    description: 'Create Primary, Secondary, or High School level',
    href: '/admin/school-levels/new',
    icon: GraduationCap,
    color: 'bg-blue-500'
  },
  {
    title: 'Add Subject',
    description: 'Create new subject with colors and animations',
    href: '/admin/subjects/new',
    icon: BookOpen,
    color: 'bg-green-500'
  },
  {
    title: 'Add Topic',
    description: 'Create curriculum topic with objectives',
    href: '/admin/topics/new',
    icon: FileText,
    color: 'bg-purple-500'
  },
  {
    title: 'View Hierarchy',
    description: 'Explore complete curriculum structure',
    href: '/admin/hierarchy',
    icon: List,
    color: 'bg-orange-500'
  }
]

const recentActivities = [
  {
    action: 'Created new subject',
    item: 'Mathematics - Grade 5',
    time: '2 minutes ago',
    color: 'bg-blue-100 text-blue-700'
  },
  {
    action: 'Added topic',
    item: 'Fractions and Decimals',
    time: '15 minutes ago',
    color: 'bg-green-100 text-green-700'
  },
  {
    action: 'Updated term',
    item: 'Term 2 - Form 3',
    time: '1 hour ago',
    color: 'bg-purple-100 text-purple-700'
  },
  {
    action: 'Created subtopic',
    item: 'Basic Addition Methods',
    time: '2 hours ago',
    color: 'bg-orange-100 text-orange-700'
  }
]

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await utilityApi.getStatistics()
        if (response.success) {
          setStats(response.data)
        } else {
          setError('Failed to fetch statistics')
        }
      } catch (err) {
        setError('Error connecting to server')
        console.error('Dashboard stats error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: 'School Levels',
      value: stats?.total_school_levels || 0,
      description: 'Primary, Secondary, High School',
      icon: GraduationCap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Forms & Grades',
      value: stats?.total_forms_grades || 0,
      description: 'Academic grade levels',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Terms',
      value: stats?.total_terms || 0,
      description: 'Academic periods',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      title: 'Subjects',
      value: stats?.total_subjects || 0,
      description: 'Teaching subjects',
      icon: BookOpen,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    },
    {
      title: 'Topics',
      value: stats?.total_topics || 0,
      description: 'Curriculum topics',
      icon: FileText,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20'
    },
    {
      title: 'Subtopics',
      value: stats?.total_subtopics || 0,
      description: 'Detailed lessons',
      icon: List,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/20'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back! Here's your curriculum overview.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            View Reports
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Quick Add
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center text-red-600 dark:text-red-400">
              <Activity className="h-5 w-5 mr-2" />
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {card.title}
              </CardTitle>
              <div className={`h-8 w-8 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {card.value.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quick-actions">Quick Actions</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Curriculum Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-blue-600" />
                  Curriculum Progress
                </CardTitle>
                <CardDescription>
                  Overall completion status of your curriculum setup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>School Structure</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Subject Planning</span>
                    <span>72%</span>
                  </div>
                  <Progress value={72} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Content Development</span>
                    <span>58%</span>
                  </div>
                  <Progress value={58} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-green-600" />
                  System Health
                </CardTitle>
                <CardDescription>
                  Current system status and performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">API Response Time</span>
                  <Badge variant="secondary">Fast</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database Status</span>
                  <Badge className="bg-green-100 text-green-700">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Backup</span>
                  <span className="text-sm text-gray-600">2 hours ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Active Sessions</span>
                  <span className="text-sm text-gray-600">1</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quick-actions">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                  <CardContent className="p-6 text-center">
                    <div className={`h-12 w-12 rounded-lg ${action.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {action.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-orange-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest changes and updates to your curriculum
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className={`h-2 w-2 rounded-full ${activity.color.split(' ')[0]}`}></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {activity.action}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {activity.item}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.time}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                  Growth Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Subjects Created This Month</span>
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-green-600 mr-2">+12</span>
                      <Badge variant="secondary">↗ 24%</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Topics Added This Week</span>
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-blue-600 mr-2">+8</span>
                      <Badge variant="secondary">↗ 15%</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Curriculum Completion</span>
                    <div className="flex items-center">
                      <span className="text-lg font-bold text-purple-600 mr-2">68%</span>
                      <Badge variant="secondary">↗ 8%</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-cyan-600" />
                  Usage Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {((stats?.total_topics || 0) / Math.max(stats?.total_subjects || 1, 1)).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Average Topics per Subject
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {((stats?.total_subtopics || 0) / Math.max(stats?.total_topics || 1, 1)).toFixed(1)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Average Subtopics per Topic
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}