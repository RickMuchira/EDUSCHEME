'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { 
  LayoutDashboard,
  FileText,
  BookOpen,
  Calendar,
  BarChart3,
  Settings,
  Menu,
  Bell,
  ChevronRight,
  Home,
  Plus,
  User,
  LogOut,
  Zap
} from 'lucide-react'
import SignOutButton from '@/components/auth/SignOutButton'

interface DashboardLayoutProps {
  children: React.ReactNode
}

const navigation = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview & quick actions',
    color: 'bg-blue-500'
  },
  {
    id: 'scheme-of-work',
    name: 'Create Scheme of Work',
    href: '/dashboard/scheme-of-work',
    icon: FileText,
    description: 'Design curriculum schemes',
    color: 'bg-emerald-500'
  },
  {
    id: 'my-schemes',
    name: 'My Schemes',
    href: '/dashboard/my-schemes',
    icon: BookOpen,
    description: 'View created schemes',
    color: 'bg-purple-500'
  },
  {
    id: 'lesson-plans',
    name: 'Lesson Plans',
    href: '/dashboard/lesson-plans',
    icon: Calendar,
    description: 'Plan your lessons',
    color: 'bg-orange-500'
  },
  {
    id: 'analytics',
    name: 'Progress Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    description: 'Track your progress',
    color: 'bg-pink-500'
  },
  {
    id: 'schemegen',
    name: 'AI Scheme Generator',
    href: '/dashboard/schemegen',
    icon: Zap,
    description: 'Generate schemes with AI',
    color: 'bg-purple-500'
  },
  {
    id: 'settings',
    name: 'Profile Settings',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'Manage preferences',
    color: 'bg-gray-500'
  }
]

function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  
  return (
    <div className="flex h-full flex-col bg-white border-r border-gray-200">
      {/* Logo & Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-blue-600 rounded-xl flex items-center justify-center">
            <FileText className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">EduScheme</h1>
            <p className="text-sm text-gray-500">Teacher Portal</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "group flex items-center px-4 py-4 text-sm font-medium rounded-xl transition-all duration-200",
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

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <div className="relative">
            {session?.user?.image ? (
              <img 
                src={session.user.image} 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {session?.user?.name || 'Teacher'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {session?.user?.email}
            </p>
          </div>
        </div>
        
        <div className="mt-3">
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}

function Header() {
  const pathname = usePathname()
  const { data: session } = useSession()
  
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard'
    if (pathname.includes('scheme-of-work')) return 'Create Scheme of Work'
    if (pathname.includes('my-schemes')) return 'My Schemes'
    if (pathname.includes('lesson-plans')) return 'Lesson Plans'
    if (pathname.includes('analytics')) return 'Progress Analytics'
    if (pathname.includes('settings')) return 'Profile Settings'
    return 'Dashboard'
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

        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm">
          <Home className="w-4 h-4 text-gray-400" />
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">Teacher</span>
          {pathname !== '/dashboard' && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-900">{getPageTitle()}</span>
            </>
          )}
        </div>

        {/* User Section */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-emerald-500">
              2
            </Badge>
          </Button>

          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-gray-900">
                {session?.user?.name || 'Teacher'}
              </div>
              <div className="text-xs text-gray-500">Education Professional</div>
            </div>
            {session?.user?.image ? (
              <img 
                src={session.user.image} 
                alt="Profile" 
                className="h-9 w-9 rounded-full object-cover border-2 border-emerald-200"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-600 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                {session?.user?.name?.charAt(0) || 'T'}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-80 lg:flex-col lg:fixed lg:inset-y-0">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col lg:ml-80">
        <Header />
        <main className="flex-1 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}