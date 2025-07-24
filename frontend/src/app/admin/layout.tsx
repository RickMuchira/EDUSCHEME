'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { 
  LayoutDashboard,
  GraduationCap,
  BarChart3,
  Settings,
  Menu,
  Bell,
  ChevronRight,
  Home,
  Plus,
  Eye
} from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

// Simplified navigation focused on school-level flow
const navigation = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    description: 'Overview & system health',
    color: 'bg-blue-500'
  },
  {
    id: 'school-levels',
    name: 'School Management',
    href: '/admin/school-levels',
    icon: GraduationCap,
    description: 'Manage all educational levels',
    color: 'bg-emerald-500'
  },
  {
    id: 'reports',
    name: 'Reports & Analytics',
    href: '/admin/reports',
    icon: BarChart3,
    description: 'System reports and insights',
    color: 'bg-purple-500'
  },
  {
    id: 'settings',
    name: 'System Settings',
    href: '/admin/settings',
    icon: Settings,
    description: 'Configure system preferences',
    color: 'bg-gray-500'
  }
]

function Sidebar() {
  const pathname = usePathname()
  
  return (
    <div className="flex h-full flex-col bg-white border-r border-gray-200">
      {/* Logo & Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">EduScheme</h1>
            <p className="text-sm text-gray-500">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-4 text-sm font-medium rounded-xl transition-all duration-200",
                isActive
                  ? "bg-gray-100 text-gray-900 shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-colors",
                isActive ? item.color : "bg-gray-100 group-hover:bg-gray-200"
              )}>
                <item.icon className={cn(
                  "w-6 h-6",
                  isActive ? "text-white" : "text-gray-500"
                )} />
              </div>
              <div className="flex-1">
                <div className="font-semibold">{item.name}</div>
                <div className="text-xs text-gray-400 mt-1">{item.description}</div>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Hierarchy Mini Tree */}
      <div className="px-4 pb-2">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 mt-2">Hierarchy</div>
        <div className="max-h-48 overflow-y-auto border rounded bg-gray-50 p-2">
          {/* TODO: Add mini SchoolLevelTree here */}
          <div className="text-xs text-gray-400 p-2">
            Mini hierarchy tree will be displayed here
          </div>
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className="p-4 border-t border-gray-200 space-y-3">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Quick Actions
        </div>
        
        <Link href="/admin/school-levels/new">
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Plus className="w-4 h-4 mr-2" />
            New School Level
          </Button>
        </Link>
        
        <Link href="/admin/hierarchy">
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Eye className="w-4 h-4 mr-2" />
            View Hierarchy
          </Button>
        </Link>
      </div>

      {/* System Status */}
      <div className="p-4 border-t border-gray-200">
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
            <span className="text-sm font-medium text-green-800">System Online</span>
          </div>
          <p className="text-xs text-green-600 mt-1">All services operational</p>
        </div>
      </div>
    </div>
  )
}

function Header() {
  const pathname = usePathname()
  
  // Get page title from pathname
  const getPageTitle = () => {
    if (pathname === '/admin') return 'Dashboard'
    
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length >= 2) {
      const section = segments[1]
      if (section === 'school-levels') return 'School Management'
      if (section === 'forms-grades') return 'Forms & Grades'
      if (section === 'terms') return 'Academic Terms'
      if (section === 'subjects') return 'Subjects'
      if (section === 'topics') return 'Topics'
      if (section === 'subtopics') return 'Subtopics'
      if (section === 'reports') return 'Reports & Analytics'
      if (section === 'settings') return 'System Settings'
    }
    
    return 'Admin'
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Mobile Menu */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>

        {/* Enhanced Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm">
          <Home className="w-4 h-4 text-gray-400" />
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">Admin</span>
          {pathname !== '/admin' && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-900">{getPageTitle()}</span>
            </>
          )}
        </div>

        {/* User Section */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-red-500">
              3
            </Badge>
          </Button>

          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-gray-900">Admin User</div>
              <div className="text-xs text-gray-500">System Administrator</div>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
              AU
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Always Visible Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-80 lg:flex-col lg:fixed lg:inset-y-0">
        <Sidebar />
      </div>

      {/* Main Content with Left Margin for Sidebar */}
      <div className="flex flex-1 flex-col lg:ml-80">
        <Header />
        <main className="flex-1 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}