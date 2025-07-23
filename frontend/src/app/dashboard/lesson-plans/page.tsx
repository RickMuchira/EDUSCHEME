"use client"

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, FileText } from "lucide-react";
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
}

export default function LessonPlansPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchSchemes = async () => {
      if (!session?.user) return;
      setIsLoading(true);
      setError("");
      try {
        const userGoogleId = (session.user as any).id || (session.user as any).sub || session.user.email;
        const response = await apiClient.get("/api/schemes", { user_google_id: userGoogleId });
        if (response?.success && Array.isArray(response.data)) {
          setSchemes(response.data);
        } else if (Array.isArray(response)) {
          setSchemes(response);
        } else {
          setError("Failed to load lesson plans.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load lesson plans.");
      } finally {
        setIsLoading(false);
      }
    };
    if (sessionStatus === "authenticated") fetchSchemes();
  }, [session, sessionStatus]);

  const downloadPDF = async (scheme: Scheme) => {
    if (!session?.user) return;
    
    setDownloadingId(scheme.id);
    
    try {
      const userGoogleId = (session.user as any).id || (session.user as any).sub || session.user.email;
      const downloadUrl = `/api/schemes/${scheme.id}/pdf?user_google_id=${encodeURIComponent(userGoogleId)}`;
      const fullUrl = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${downloadUrl}`;
      
      // Use fetch to download the PDF as a blob
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PDF download failed: ${response.status} - ${errorText}`);
      }

      // Get the PDF blob
      const pdfBlob = await response.blob();
      
      // Create a blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `Scheme_of_Work_${scheme.subject_name}_${scheme.form_grade_name || 'Form'}_${scheme.term_name || 'Term'}_${scheme.academic_year}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(blobUrl);
      
    } catch (err: any) {
      console.error('PDF download error:', err);
      setError(`Failed to download PDF: ${err.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">My Lesson Plans</h1>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">{error}</div>
        )}
        {schemes.length === 0 ? (
          <div className="text-gray-600">No lesson plans found.</div>
        ) : (
          <div className="space-y-4">
            {schemes.map((scheme) => (
              <Card key={scheme.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {scheme.subject_name} - {scheme.form_grade_name} - {scheme.term_name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                    <div><span className="font-medium">School:</span> {scheme.school_name}</div>
                    <div><span className="font-medium">Academic Year:</span> {scheme.academic_year}</div>
                    <div><span className="font-medium">Status:</span> {scheme.status}</div>
                    <div><span className="font-medium">Created At:</span> {new Date(scheme.created_at).toLocaleString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => downloadPDF(scheme)}
                      disabled={downloadingId === scheme.id}
                      variant="outline"
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