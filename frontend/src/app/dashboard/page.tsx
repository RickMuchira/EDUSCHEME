'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  FileText,
  Plus,
  BookOpen,
  Calendar,
  BarChart3,
  ArrowRight,
  Clock,
  CheckCircle2,
  Star,
  TrendingUp,
  Users,
  Target
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface DashboardStats {
  totalSchemes: number
  completedSchemes: number
  activeSchemes: number
  totalLessons: number
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalSchemes: 0,
    completedSchemes: 0,
    activeSchemes: 0,
    totalLessons: 0
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    // Simulate fetching user stats
    setStats({
      totalSchemes: 12,
      completedSchemes: 8,
      activeSchemes: 4,
      totalLessons: 156
    })
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  const recentSchemes = [
    { id: 1, title: 'Mathematics - Form 2 Term 1', status: 'completed', progress: 100, dueDate: '2024-03-15' },
    { id: 2, title: 'English - Form 1 Term 2', status: 'in-progress', progress: 75, dueDate: '2024-04-20' },
    { id: 3, title: 'Science - Form 3 Term 1', status: 'draft', progress: 25, dueDate: '2024-05-10' }
  ]

  const quickActions = [
    {
      title: 'Create New Scheme',
      description: 'Design a curriculum scheme',
      icon: Plus,
      color: 'bg-emerald-500',
      href: '/dashboard/scheme-of-work'
    },
    {
      title: 'Browse Templates',
      description: 'Pre-built schemes',
      icon: BookOpen,
      color: 'bg-blue-500',
      href: '/dashboard/templates'
    },
    {
      title: 'Plan Lessons',
      description: 'Create lesson plans',
      icon: Calendar,
      color: 'bg-purple-500',
      href: '/dashboard/lesson-plans'
    },
    {
      title: 'View Analytics',
      description: 'Track your progress',
      icon: BarChart3,
      color: 'bg-orange-500',
      href: '/dashboard/analytics'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div className="text-center lg:text-left">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {session?.user?.name?.split(' ')[0] || 'Teacher'}! 👋
          </h1>
          <p className="text-lg text-gray-600">
            Ready to create amazing learning experiences? Let's get started with your curriculum planning.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-600 text-sm font-medium">Total Schemes</p>
                  <p className="text-3xl font-bold text-emerald-900">{stats.totalSchemes}</p>
                </div>
                <div className="h-12 w-12 bg-emerald-500 rounded-full flex items-center justify-center">
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Completed</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.completedSchemes}</p>
                </div>
                <div className="h-12 w-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Active Schemes</p>
                  <p className="text-3xl font-bold text-purple-900">{stats.activeSchemes}</p>
                </div>
                <div className="h-12 w-12 bg-purple-500 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Total Lessons</p>
                  <p className="text-3xl font-bold text-orange-900">{stats.totalLessons}</p>
                </div>
                <div className="h-12 w-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">Quick Actions</CardTitle>
            <CardDescription>Get started with these common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <div className="group p-6 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 transition-all duration-200 cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center",
                        action.color
                      )}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-gray-700">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-500">{action.description}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Schemes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Recent Schemes</CardTitle>
                <CardDescription>Your latest curriculum work</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentSchemes.map((scheme) => (
                  <div key={scheme.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{scheme.title}</h4>
                      <Badge variant={
                        scheme.status === 'completed' ? 'default' :
                        scheme.status === 'in-progress' ? 'secondary' : 'outline'
                      }>
                        {scheme.status === 'completed' ? 'Completed' :
                         scheme.status === 'in-progress' ? 'In Progress' : 'Draft'}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{scheme.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${scheme.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        Due: {new Date(scheme.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
                <Link href="/dashboard/my-schemes">
                  <Button variant="outline" className="w-full">
                    View All Schemes
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Today's Focus */}
          <div className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Today's Focus</CardTitle>
                <CardDescription>Your priorities for today</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm text-gray-700">Complete Mathematics Term 2 outline</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-700">Review Science curriculum changes</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <Star className="h-5 w-5 text-purple-600" />
                  <span className="text-sm text-gray-700">Plan next week's lessons</span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900">Achievement</CardTitle>
                <CardDescription>Your teaching milestone</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-3">
                  <div className="h-16 w-16 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
                    <Star className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Curriculum Master</h3>
                  <p className="text-sm text-gray-600">You've created 10+ schemes of work!</p>
                  <Badge className="bg-gradient-to-r from-emerald-500 to-blue-500">
                    Level 3 Educator
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
