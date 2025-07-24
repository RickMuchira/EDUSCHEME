"use client"

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Download, FileText, AlertCircle, RefreshCw } from "lucide-react";
import apiClient from "@/lib/apiClient";

interface Scheme {
  id: number;
  school_name: string;
  subject_name: string;
  form_grade_name: string;
  term_name: string;
  academic_year: string;
  status: string;
  created_at: string;
  user_id: number;
  user_google_id?: string;
}

export default function LessonPlansPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchSchemes();
    }
  }, [session, sessionStatus]);

  const fetchSchemes = async () => {
    if (!session?.user) {
      setError("No user session found");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      // Get user identifier
      const userGoogleId = (session.user as any).id || 
                          (session.user as any).sub || 
                          session.user.email;
      
      if (!userGoogleId) {
        throw new Error("Unable to identify user");
      }

      console.log('📚 Fetching schemes for user:', userGoogleId);
      
      // Use the correct API endpoint with user_google_id parameter
      const response = await apiClient.get("/api/schemes/", { 
        user_google_id: userGoogleId 
      });
      
      console.log('📚 Schemes API response:', response);
      
      if (response?.success && Array.isArray(response.data)) {
        console.log(`✅ Loaded ${response.data.length} schemes`);
        setSchemes(response.data);
      } else if (Array.isArray(response)) {
        // Handle case where response is directly an array
        console.log(`✅ Loaded ${response.length} schemes (direct array)`);
        setSchemes(response);
      } else {
        throw new Error(response?.message || "Invalid response format");
      }
    } catch (err: any) {
      console.error('❌ Error fetching schemes:', err);
      setError(err.message || "Failed to load lesson plans. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPDF = async (scheme: Scheme) => {
    if (!session?.user) {
      setError("No user session found");
      return;
    }
    
    setDownloadingId(scheme.id);
    setError(""); // Clear any previous errors
    
    try {
      const userGoogleId = (session.user as any).id || 
                          (session.user as any).sub || 
                          session.user.email;
      
      if (!userGoogleId) {
        throw new Error("Unable to identify user");
      }

      console.log(`📄 Downloading PDF for scheme ${scheme.id}`);
      
      // Construct the download URL with proper trailing slash
      const downloadUrl = `/api/schemes/${scheme.id}/pdf/?user_google_id=${encodeURIComponent(userGoogleId)}`;
      const fullUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${downloadUrl}`;
      
      console.log('📄 PDF download URL:', fullUrl);
      
      // Use fetch to download the PDF as a blob
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
          'Content-Type': 'application/json',
        },
      });

      console.log('📄 PDF response status:', response.status);

      if (!response.ok) {
        let errorMessage = `PDF download failed: ${response.status}`;
        try {
          const errorText = await response.text();
          console.error('📄 PDF error response:', errorText);
          
          // Try to parse JSON error response
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorMessage;
          } catch {
            // Not JSON, use the text as is
            errorMessage = errorText || errorMessage;
          }
        } catch {
          // Couldn't read response text
        }
        throw new Error(errorMessage);
      }

      // Check if the response is actually a PDF
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/pdf')) {
        // If it's not a PDF, it might be an error response
        const responseText = await response.text();
        console.error('📄 Unexpected content type:', contentType, responseText);
        throw new Error('Server returned unexpected content type (not PDF)');
      }

      // Get the PDF blob
      const pdfBlob = await response.blob();
      
      if (pdfBlob.size === 0) {
        throw new Error('Received empty PDF file');
      }
      
      console.log(`✅ PDF downloaded successfully, size: ${pdfBlob.size} bytes`);
      
      // Create a blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = blobUrl;
      
      // Generate a descriptive filename
      const fileName = `Scheme_of_Work_${scheme.subject_name}_${scheme.form_grade_name || 'Form'}_${scheme.term_name || 'Term'}_${scheme.academic_year || 'Year'}.pdf`
        .replace(/[^a-zA-Z0-9._-]/g, '_'); // Replace special characters
      
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);
      
      console.log('✅ PDF download completed');
      
    } catch (err: any) {
      console.error('❌ PDF download error:', err);
      setError(`Failed to download PDF: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const retryFetch = () => {
    fetchSchemes();
  };

  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
              <p className="text-gray-600">Please log in to view your lesson plans.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your lesson plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Lesson Plans</h1>
            <p className="text-gray-600 mt-1">Download and manage your scheme of work documents</p>
          </div>
          <Button 
            onClick={retryFetch} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {schemes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Lesson Plans Found</h3>
                <p className="text-gray-600 mb-4">
                  You haven't created any schemes of work yet. 
                  Start by creating your first scheme!
                </p>
                <Button 
                  onClick={() => window.location.href = '/dashboard/scheme-of-work'}
                  className="mt-4"
                >
                  Create Your First Scheme
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Found {schemes.length} lesson plan{schemes.length !== 1 ? 's' : ''}
            </p>
            
            {schemes.map((scheme) => (
              <Card key={scheme.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    {scheme.subject_name} - {scheme.form_grade_name} - {scheme.term_name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="font-medium text-gray-700">School:</span> 
                      <span className="ml-2 text-gray-900">{scheme.school_name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Academic Year:</span> 
                      <span className="ml-2 text-gray-900">{scheme.academic_year}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        scheme.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {scheme.status}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Created:</span> 
                      <span className="ml-2 text-gray-900">
                        {new Date(scheme.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => downloadPDF(scheme)}
                      disabled={downloadingId === scheme.id}
                      variant="default"
                      size="sm"
                    >
                      {downloadingId === scheme.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Preparing PDF...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => window.location.href = `/dashboard/scheme-of-work?edit=${scheme.id}`}
                      variant="outline"
                      size="sm"
                    >
                      Edit Scheme
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 