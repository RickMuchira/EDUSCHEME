'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, BookOpen } from 'lucide-react'
import { safeRoutes } from '@/lib/safe-links'

export default function SubjectNavigationTestPage() {
  const testScenarios = [
    {
      title: 'Subjects for Term 1',
      url: safeRoutes.subjectsForTerm(1),
      description: 'Should load subjects page with term_id=1 parameter'
    },
    {
      title: 'Subjects for Term 2',
      url: safeRoutes.subjectsForTerm(2),
      description: 'Should load subjects page with term_id=2 parameter'
    },
    {
      title: 'New Subject for Term 1',
      url: safeRoutes.newSubjectForTerm(1),
      description: 'Should load new subject form for term_id=1'
    },
    {
      title: 'New Subject for Term 2',
      url: safeRoutes.newSubjectForTerm(2),
      description: 'Should load new subject form for term_id=2'
    },
    {
      title: 'General Subjects Page',
      url: '/admin/subjects',
      description: 'Should show term selector (no term_id parameter)'
    }
  ]

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Subject Navigation Testing
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test navigation to subjects pages with different term parameters
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-1 max-w-2xl">
        {testScenarios.map((scenario, index) => (
          <Card key={index} className="hover:border-blue-200 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                {scenario.title}
              </CardTitle>
              <CardDescription>{scenario.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm break-all">
                  {scenario.url}
                </code>
                <Link href={scenario.url}>
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Test This Navigation
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-8 max-w-2xl">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">🎯 Expected Behavior</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• <strong>Term-specific links:</strong> Should go directly to subjects for that term</li>
              <li>• <strong>General subjects link:</strong> Should show term selector dropdown</li>
              <li>• <strong>New subject links:</strong> Should pre-populate the term and show form</li>
              <li>• <strong>No manual term selection:</strong> When coming from terms page, should auto-load</li>
            </ul>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-4 max-w-2xl">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">🔧 Debugging Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-yellow-700">
              <li>• Check browser console for navigation logs and errors</li>
              <li>• Verify URL parameters are being passed correctly</li>
              <li>• Make sure the subjects page files exist in the correct locations</li>
              <li>• Check that the term_id is being validated and parsed properly</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}