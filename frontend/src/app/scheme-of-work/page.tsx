// /frontend/src/app/dashboard/scheme-of-work/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Circle, 
  Loader2, 
  School, 
  BookOpen, 
  Calendar,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { schoolLevelApi, schemeApi, type SchoolLevel, type FormGrade, type Term } from '@/lib/api';
import apiClient from '@/lib/apiClient';

interface FormData {
  schoolName: string;
  schoolLevel: string;
  form: string;
  term: string;
  subject: string;
}

const STEPS = [
  {
    id: 1,
    title: 'School Details',
    description: 'Basic information about your school and class',
    icon: School,
  },
  {
    id: 2,
    title: 'Confirmation',
    description: 'Review and save your scheme of work',
    icon: CheckCircle,
  },
];


export default function SchemeOfWorkPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
    const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
        schoolName: '',
        schoolLevel: '',
        form: '',
        term: '',
        subject: 'General'
    });
  
  const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([]);
  const [forms, setForms] = useState<FormGrade[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Load school levels on component mount
    useEffect(() => {
    if (status === 'authenticated') {
            fetchSchoolLevels();
        }
  }, [status]);

  // Update forms and terms when school level changes
  useEffect(() => {
    if (formData.schoolLevel) {
      const selectedLevel = schoolLevels.find(level => level.id === parseInt(formData.schoolLevel));
            if (selectedLevel) {
                setForms(selectedLevel.form_grades || []);
                setTerms(selectedLevel.terms || []);
                setFormData(prev => ({
                    ...prev,
                    form: '',
                    term: ''
                }));
            }
        }
  }, [formData.schoolLevel, schoolLevels]);

  const fetchSchoolLevels = async () => {
    try {
      setIsDataLoading(true);
      const data = await schoolLevelApi.getAll(true);
      setSchoolLevels(data);
    } catch (error) {
      console.error('Error fetching school levels:', error);
      setError('Failed to load school levels. Please refresh the page.');
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const validateStep1 = (): boolean => {
    if (!formData.schoolName.trim()) {
      setError('School name is required');
      return false;
    }
    if (!formData.schoolLevel) {
      setError('Please select a school level');
      return false;
    }
    if (!formData.form) {
      setError('Please select a form/grade');
                    return false;
                }
    if (!formData.term) {
      setError('Please select a term');
      return false;
    }
        return true;
    };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

    const handleSaveAndContinue = async () => {
        if (!session?.user?.id) {
                setError('Please sign in to continue');
                return;
            }

        if (!validateStep1()) {
                return;
            }

            setLoading(true);
            setError('');

            try {
                const userGoogleId = session.user.id;
                const schemeData = {
                    school_name: formData.schoolName.trim(),
                    subject_name: formData.subject,
                    school_level_id: parseInt(formData.schoolLevel),
                    form_grade_id: parseInt(formData.form),
                    term_id: parseInt(formData.term),
                    status: 'completed',
                    progress: 100,
                    content: {
                        form_data: formData,
                        step_completed: 'school_details'
                    },
                    scheme_metadata: {
                        created_from: 'scheme_of_work_wizard',
                        step: 1,
                        timestamp: new Date().toISOString()
                    }
                };

                const response = await schemeApi.create(schemeData, userGoogleId);
                
                if (response) {
                    console.log('Scheme saved successfully:', response);
                    router.push('/dashboard/timetable');
                }
            } catch (error: any) {
                    console.error('Error saving scheme:', error);
                    setError(error.message || 'Failed to save scheme. Please try again.');
            } finally {
                    setLoading(false);
            }
        };


  // Show loading while checking authentication
  if (status === 'loading') {
        return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin');
    return null;
  }

  const progress = (currentStep / STEPS.length) * 100;
  const currentStepData = STEPS.find(step => step.id === currentStep);

    return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Create Scheme of Work</h1>
          <p className="text-lg text-muted-foreground">
            Set up your curriculum planning in just a few steps
          </p>
        </div>

        {/* Progress indicator */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">
                  Step {currentStep} of {STEPS.length}
                </span>
                            </div>
              <Progress value={progress} className="h-2" />
              
              <div className="flex items-center justify-between">
                {STEPS.map((step) => {
                  const Icon = step.icon;
                  const isCompleted = currentStep > step.id;
                  const isCurrent = currentStep === step.id;
                  
                  return (
                    <div key={step.id} className="flex items-center space-x-2">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        isCompleted && "bg-green-500 text-white",
                        isCurrent && "bg-blue-500 text-white",
                        !isCompleted && !isCurrent && "bg-gray-200 text-gray-600"
                      )}>
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                            </div>
                      <div className="hidden sm:block">
                        <div className="text-sm font-medium">{step.title}</div>
                        <div className="text-xs text-muted-foreground">{step.description}</div>
                        </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
                    {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {currentStepData && <currentStepData.icon className="h-5 w-5" />}
              <span>{currentStepData?.title}</span>
            </CardTitle>
            <CardDescription>
              {currentStepData?.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
                    {currentStep === 1 && (
                        <div className="space-y-6">
                {/* School Name */}
                <div className="space-y-2">
                  <Label htmlFor="schoolName" className="flex items-center space-x-2">
                    <School className="h-4 w-4" />
                    <span>School Name *</span>
                  </Label>
                  <Input
                    id="schoolName"
                                    value={formData.schoolName}
                    onChange={(e) => handleInputChange('schoolName', e.target.value)}
                                    placeholder="Enter your school name"
                    disabled={loading}
                                />
                            </div>

                {/* School Level */}
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>School Level *</span>
                  </Label>
                  <Select
                                    value={formData.schoolLevel}
                    onValueChange={(value) => handleInputChange('schoolLevel', value)}
                    disabled={loading || isDataLoading}
                                >
                    <SelectTrigger>
                      <SelectValue placeholder="Select school level" />
                    </SelectTrigger>
                    <SelectContent>
                                    {schoolLevels.map((level) => (
                        <SelectItem key={level.id} value={level.id.toString()}>
                                            {level.name}
                        </SelectItem>
                                    ))}
                    </SelectContent>
                  </Select>
                            </div>

                {/* Form/Grade */}
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <BookOpen className="h-4 w-4" />
                    <span>Form/Grade *</span>
                  </Label>
                  <Select
                                    value={formData.form}
                    onValueChange={(value) => handleInputChange('form', value)}
                    disabled={!formData.schoolLevel || loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select form/grade" />
                    </SelectTrigger>
                    <SelectContent>
                                    {forms.map((form) => (
                        <SelectItem key={form.id} value={form.id.toString()}>
                                            {form.name}
                        </SelectItem>
                                    ))}
                    </SelectContent>
                  </Select>
                            </div>

                {/* Term */}
                <div className="space-y-2">
                  <Label className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Term *</span>
                  </Label>
                  <Select
                                    value={formData.term}
                    onValueChange={(value) => handleInputChange('term', value)}
                    disabled={!formData.schoolLevel || loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                                    {terms.map((term) => (
                        <SelectItem key={term.id} value={term.id.toString()}>
                                            {term.name}
                        </SelectItem>
                                    ))}
                    </SelectContent>
                  </Select>
                            </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    placeholder="Enter subject name"
                                    disabled={loading}
                  />
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                  <h3 className="text-xl font-semibold">Ready to Create!</h3>
                  <p className="text-muted-foreground">
                    Review your details below and click save to create your scheme of work.
                  </p>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">School Name</Label>
                    <div className="font-medium">{formData.schoolName}</div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">School Level</Label>
                    <div className="font-medium">
                      {schoolLevels.find(l => l.id === parseInt(formData.schoolLevel))?.name}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Form/Grade</Label>
                    <div className="font-medium">
                      {forms.find(f => f.id === parseInt(formData.form))?.name}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Term</Label>
                    <div className="font-medium">
                      {terms.find(t => t.id === parseInt(formData.term))?.name}
                            </div>
                        </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Subject</Label>
                    <div className="font-medium">{formData.subject}</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1 || loading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex space-x-2">
            {currentStep < STEPS.length ? (
              <Button
                onClick={handleNext}
                disabled={loading}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSaveAndContinue}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {loading ? 'Saving...' : 'Save & Continue'}
              </Button>
            )}
          </div>
                </div>
            </div>
        </div>
    );
}