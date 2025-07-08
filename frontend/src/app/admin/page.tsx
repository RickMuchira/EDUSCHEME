'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  GraduationCap,
  Users,
  Calendar,
  BookMarked,
  FileText,
  List,
  Plus,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Target,
  BarChart3,
  Eye,
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
  ServerOff
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface DashboardStats {
  total_school_levels: number
  total_forms_grades: number
  total_terms: number
  total_subjects: number
  total_topics: number
  total_subtopics: number
  active_school_levels: number
  active_forms_grades: number
  active_terms: number
  active_subjects: number
  active_topics: number
  active_subtopics: number
}

interface SystemHealth {
  status: 'excellent' | 'good' | 'warning' | 'critical'
  score: number
  issues: string[]
  recommendations: string[]
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting')

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      setConnectionStatus('connecting')
      
      console.log('Fetching dashboard data from:', 'http://localhost:8000/api/v1/admin/statistics/')
      
      const response = await fetch('http://localhost:8000/api/v1/admin/statistics/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('API Response:', data)
      
      if (data.success && data.data) {
        setStats(data.data)
        calculateSystemHealth(data.data)
        setConnectionStatus('connected')
      } else {
        throw new Error(data.message || 'API returned unsuccessful response')
      }
    } catch (err: any) {
      console.error('Dashboard error:', err)
      
      // More specific error messages
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Cannot connect to backend server. Make sure your FastAPI server is running on localhost:8000')
      } else if (err.message?.includes('CORS')) {
        setError('CORS error: Backend server needs to allow requests from localhost:3000')
      } else if (err.message?.includes('ERR_CONNECTION_REFUSED')) {
        setError('Backend server is not running. Please start your FastAPI server.')
      } else {
        setError(`Connection error: ${err.message || 'Unknown error occurred'}`)
      }
      setConnectionStatus('failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const calculateSystemHealth = (data: DashboardStats) => {
    let score = 0
    const issues: string[] = []
    const recommendations: string[] = []

    if (data.total_school_levels > 0) {
      score += 25
      if (data.total_forms_grades > 0) {
        score += 20
        if (data.total_terms > 0) {
          score += 20
          if (data.total_subjects > 0) {
            score += 20
            if (data.total_topics > 0) {
              score += 10
              if (data.total_subtopics > 0) {
                score += 5
              } else {
                recommendations.push('Add subtopics for detailed lesson planning')
              }
            } else {
              issues.push('No curriculum topics created')
            }
          } else {
            issues.push('No subjects added to terms')
          }
        } else {
          issues.push('No academic terms configured')
        }
      } else {
        issues.push('No forms/grades created under school levels')
      }
    } else {
      issues.push('No school levels configured - this is the foundation of your system')
    }

    let status: SystemHealth['status'] = 'critical'
    if (score >= 90) status = 'excellent'
    else if (score >= 70) status = 'good'
    else if (score >= 40) status = 'warning'

    setSystemHealth({ status, score, issues, recommendations })
  }

  const statCards = [
    {
      title: 'School Levels',
      value: stats?.active_school_levels || 0,
      total: stats?.total_school_levels || 0,
      description: 'Foundation of your system',
      icon: GraduationCap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      href: '/admin/school-levels',
      isFoundation: true
    },
    {
      title: 'Forms & Grades',
      value: stats?.active_forms_grades || 0,
      total: stats?.total_forms_grades || 0,
      description: 'Grade levels within schools',
      icon: Users,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      href: '/admin/school-levels',
      parentCount: stats?.total_school_levels || 0
    },
    {
      title: 'Academic Terms',
      value: stats?.active_terms || 0,
      total: stats?.total_terms || 0,
      description: 'Terms within grades',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      href: '/admin/school-levels',
      parentCount: stats?.total_forms_grades || 0
    },
    {
      title: 'Subjects',
      value: stats?.active_subjects || 0,
      total: stats?.total_subjects || 0,
      description: 'Subjects within terms',
      icon: BookMarked,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      href: '/admin/school-levels',
      parentCount: stats?.total_terms || 0
    },
    {
      title: 'Topics',
      value: stats?.active_topics || 0,
      total: stats?.total_topics || 0,
      description: 'Topics within subjects',
      icon: FileText,
      color: 'text-rose-600',
      bgColor: 'bg-rose-100',
      href: '/admin/school-levels',
      parentCount: stats?.total_subjects || 0
    },
    {
      title: 'Subtopics',
      value: stats?.active_subtopics || 0,
      total: stats?.total_subtopics || 0,
      description: 'Detailed lessons',
      icon: List,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      href: '/admin/school-levels',
      parentCount: stats?.total_topics || 0
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">Connecting to Backend</p>
            <p className="text-gray-500">Fetching your school data from localhost:8000...</p>
            <div className="text-xs text-gray-400 bg-gray-100 p-2 rounded">
              API Endpoint: /api/v1/admin/statistics/
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert className="border-red-200 bg-red-50 mb-6">
          <ServerOff className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="space-y-3">
              <p className="font-medium">Backend Connection Failed</p>
              <p className="text-sm">{error}</p>
              
              <div className="space-y-2 text-sm">
                <p className="font-medium">Troubleshooting Steps:</p>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>Make sure your FastAPI server is running: <code className="bg-red-100 px-1 rounded">uvicorn main:app --reload</code></li>
                  <li>Check if backend is accessible at: <a href="http://localhost:8000/docs" target="_blank" className="text-red-700 underline">http://localhost:8000/docs</a></li>
                  <li>Test the API endpoint directly: <a href="http://localhost:8000/api/v1/admin/statistics/" target="_blank" className="text-red-700 underline">http://localhost:8000/api/v1/admin/statistics/</a></li>
                  <li>Add CORS configuration to your FastAPI backend</li>
                </ol>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={fetchDashboardData}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Connection
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.open('http://localhost:8000/docs', '_blank')}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Check Backend API
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        {/* Offline Mode */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-900 flex items-center space-x-2">
              <WifiOff className="w-5 h-5" />
              <span>Offline Mode</span>
            </CardTitle>
            <CardDescription className="text-yellow-700">
              You can still access the management interface, but data won't be loaded until backend connection is restored.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/admin/school-levels">
                <Button variant="outline" className="w-full justify-start">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Manage School Levels
                </Button>
              </Link>
              <Link href="/admin/school-levels/new">
                <Button className="w-full justify-start bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add School Level
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header with Connection Status */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <h1 className="text-4xl font-bold text-gray-900">School Management Hub</h1>
            <div className="flex items-center space-x-2">
              {systemHealth && (
                <Badge className={cn(
                  "px-3 py-1",
                  systemHealth.status === 'excellent' && "bg-green-100 text-green-800 border-green-200",
                  systemHealth.status === 'good' && "bg-blue-100 text-blue-800 border-blue-200",
                  systemHealth.status === 'warning' && "bg-yellow-100 text-yellow-800 border-yellow-200",
                  systemHealth.status === 'critical' && "bg-red-100 text-red-800 border-red-200"
                )}>
                  <Activity className="w-3 h-3 mr-1" />
                  {systemHealth.status}
                </Badge>
              )}
              <Badge className="px-2 py-1 bg-green-100 text-green-800 border-green-200">
                <Wifi className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            </div>
          </div>
          <p className="text-lg text-gray-600">
            Manage your complete educational hierarchy from school levels down to lessons
          </p>
        </div>

        <div className="flex space-x-3">
          <Button variant="outline" onClick={fetchDashboardData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
          <Link href="/admin/hierarchy">
            <Button variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              View Hierarchy
            </Button>
          </Link>
          <Link href="/admin/school-levels/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add School Level
            </Button>
          </Link>
        </div>
      </div>

      {/* System Health Alert */}
      {systemHealth && systemHealth.status !== 'excellent' && (
        <Alert className={cn(
          "border-l-4",
          systemHealth.status === 'critical' && "border-red-500 bg-red-50",
          systemHealth.status === 'warning' && "border-yellow-500 bg-yellow-50",
          systemHealth.status === 'good' && "border-blue-500 bg-blue-50"
        )}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">System Setup: {systemHealth.score}/100</span>
                <Progress value={systemHealth.score} className="w-32" />
              </div>
              {systemHealth.issues.length > 0 && (
                <div className="text-sm">
                  <span className="font-medium">Next steps:</span> {systemHealth.issues.join(', ')}
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Hierarchy Flow Visualization */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Educational Hierarchy Overview</span>
          </CardTitle>
          <CardDescription className="text-blue-700">
            Your complete school structure flows from School Levels down to individual lessons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-white rounded-lg">
            <div className="flex items-center space-x-4 overflow-x-auto">
              {statCards.slice(0, 6).map((card, index) => (
                <div key={index} className="flex items-center flex-shrink-0">
                  <div className="text-center">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-2", card.bgColor)}>
                      <card.icon className={cn("w-6 h-6", card.color)} />
                    </div>
                    <div className="text-lg font-bold text-gray-900">{card.value}</div>
                    <div className="text-xs text-gray-600">{card.title}</div>
                  </div>
                  {index < 5 && (
                    <ArrowRight className="w-4 h-4 text-gray-400 mx-3" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <Link key={index} href={card.href}>
            <Card className={cn(
              "hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer",
              card.isFoundation && "ring-2 ring-blue-200"
            )}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                  {card.isFoundation && (
                    <Badge variant="secondary" className="ml-2 text-xs">Foundation</Badge>
                  )}
                </CardTitle>
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", card.bgColor)}>
                  <card.icon className={cn("h-5 w-5", card.color)} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">{card.value}</span>
                  <span className="text-xs text-gray-500">active</span>
                  <span className="text-lg text-gray-400">/</span>
                  <span className="text-lg font-semibold text-gray-500">{card.total}</span>
                  <span className="text-xs text-gray-400">total</span>
                </div>
                <p className="text-sm text-gray-600">{card.description}</p>
                
                {/* Show ratio to parent level */}
                {card.parentCount !== undefined && card.parentCount > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Average per parent</span>
                      <span>{(card.total / card.parentCount).toFixed(1)}</span>
                    </div>
                    <Progress 
                      value={Math.min((card.total / card.parentCount / 3) * 100, 100)} 
                      className="h-1"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Primary Action */}
      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
        <CardHeader>
          <CardTitle className="text-emerald-900 flex items-center space-x-2">
            <GraduationCap className="w-6 h-6" />
            <span>School Levels - Your Starting Point</span>
          </CardTitle>
          <CardDescription className="text-emerald-700">
            Everything in your system starts with school levels. Create and manage your educational structure here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {stats?.total_school_levels === 0 
                  ? "No school levels created yet. Start by creating your first school level."
                  : `You have ${stats?.total_school_levels} school level${stats?.total_school_levels === 1 ? '' : 's'} configured.`
                }
              </p>
              <div className="flex space-x-2">
                <Link href="/admin/school-levels">
                  <Button variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    Manage School Levels
                  </Button>
                </Link>
                <Link href="/admin/school-levels/new">
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4 mr-2" />
                    {stats?.total_school_levels === 0 ? 'Create First School Level' : 'Add School Level'}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-green-600" />
              <span>System Health</span>
            </CardTitle>
            <CardDescription>Overall setup progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {systemHealth && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Setup Progress</span>
                  <span className="text-2xl font-bold">{systemHealth.score}/100</span>
                </div>
                <Progress value={systemHealth.score} className="h-2" />
                
                <div className="space-y-2">
                  {systemHealth.score >= 25 && (
                    <div className="flex items-center text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                      <span>School levels configured</span>
                    </div>
                  )}
                  {systemHealth.issues.map((issue, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-600">
                      <AlertCircle className="w-4 h-4 text-yellow-500 mr-2" />
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>Content Overview</span>
            </CardTitle>
            <CardDescription>Distribution of educational content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats && stats.total_school_levels > 0 
                    ? (stats.total_forms_grades / stats.total_school_levels).toFixed(1)
                    : '0'
                  }
                </div>
                <div className="text-xs text-blue-700">Grades per School</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats && stats.total_forms_grades > 0 
                    ? (stats.total_subjects / stats.total_forms_grades).toFixed(1)
                    : '0'
                  }
                </div>
                <div className="text-xs text-green-700">Subjects per Grade</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {stats && stats.total_subjects > 0 
                    ? (stats.total_topics / stats.total_subjects).toFixed(1)
                    : '0'
                  }
                </div>
                <div className="text-xs text-purple-700">Topics per Subject</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {stats && stats.total_topics > 0 
                    ? (stats.total_subtopics / stats.total_topics).toFixed(1)
                    : '0'
                  }
                </div>
                <div className="text-xs text-orange-700">Lessons per Topic</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AdminDashboard