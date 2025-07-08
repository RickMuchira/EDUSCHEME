'use client'

import { useSearchParams, usePathname } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle } from 'lucide-react'

export function UrlDebug() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }
  
  const params = Array.from(searchParams.entries())
  
  // Check for problematic values
  const hasNaN = params.some(([key, value]) => value === 'NaN')
  const hasUndefined = params.some(([key, value]) => value === 'undefined')
  const hasNull = params.some(([key, value]) => value === 'null')
  const hasProblems = hasNaN || hasUndefined || hasNull
  
  return (
    <Card className={`mb-4 ${hasProblems ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
      <CardHeader className="pb-3">
        <CardTitle className={`text-sm flex items-center ${hasProblems ? 'text-red-800' : 'text-yellow-800'}`}>
          {hasProblems ? (
            <>
              <AlertTriangle className="h-4 w-4 mr-2" />
              🚨 URL Issues Detected
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              🔍 URL Debug Info
            </>
          )}
        </CardTitle>
        <CardDescription className={`text-xs ${hasProblems ? 'text-red-600' : 'text-yellow-600'}`}>
          {hasProblems 
            ? 'Problematic URL parameters detected - these will cause API errors!'
            : 'This component only appears in development mode'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-xs">
          <div>
            <strong>Pathname:</strong> <code className="bg-gray-100 px-1 rounded">{pathname}</code>
          </div>
          <div>
            <strong>Search Params:</strong>
            {params.length === 0 ? (
              <span className="text-gray-500 ml-2">None</span>
            ) : (
              <div className="mt-1 space-y-1">
                {params.map(([key, value]) => {
                  const isProblematic = value === 'NaN' || value === 'undefined' || value === 'null'
                  const parsedNum = isNaN(parseInt(value)) ? 'NaN' : parseInt(value)
                  
                  return (
                    <div key={key} className="flex items-center space-x-2">
                      <Badge 
                        variant={isProblematic ? "destructive" : "secondary"} 
                        className="text-xs"
                      >
                        {key}
                      </Badge>
                      <span>=</span>
                      <code className={`px-1 rounded text-xs ${
                        isProblematic 
                          ? 'bg-red-100 text-red-800 font-bold' 
                          : 'bg-gray-100'
                      }`}>
                        {value || '<empty>'}
                      </code>
                      <span className="text-gray-500 text-xs">
                        (parsed: {parsedNum})
                      </span>
                      {isProblematic && (
                        <Badge variant="destructive" className="text-xs">
                          ⚠️ PROBLEM
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <div>
            <strong>Full URL:</strong> 
            <code className="bg-gray-100 px-1 rounded text-xs break-all">
              {typeof window !== 'undefined' ? window.location.href : 'SSR'}
            </code>
          </div>
          
          {hasProblems && (
            <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded">
              <strong className="text-red-800 text-xs">🚨 Issues Found:</strong>
              <ul className="text-red-700 text-xs mt-1 space-y-1">
                {hasNaN && <li>• Contains "NaN" values - will cause 422 API errors</li>}
                {hasUndefined && <li>• Contains "undefined" values - indicates missing data</li>}
                {hasNull && <li>• Contains "null" values - may cause validation errors</li>}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}