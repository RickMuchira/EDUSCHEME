// /frontend/src/pages/SchemeOfWorkWizard.jsx
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { apiClient, SchoolLevel, FormGrade, Term } from '@/lib/api';

const SchemeOfWorkWizard: React.FC = () => {
    const { data: session, status } = useSession();
    const isAuthenticated = status === 'authenticated';
    const userEmail = session?.user?.email || '';
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [formData, setFormData] = useState<{
        schoolName: string;
        schoolLevel: string;
        form: string;
        term: string;
        subject: string;
    }>({
        schoolName: '',
        schoolLevel: '',
        form: '',
        term: '',
        subject: 'General',
    });
    const [schoolLevels, setSchoolLevels] = useState<SchoolLevel[]>([]);
    const [forms, setForms] = useState<FormGrade[]>([]);
    const [terms, setTerms] = useState<Term[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (isAuthenticated) {
            fetchSchoolLevels();
        }
    }, [isAuthenticated]);

    const fetchSchoolLevels = async () => {
        try {
            // Try to use a public method for fetching school levels
            // If not available, fallback to request
            if (typeof (apiClient as any).getAllSchoolLevels === 'function') {
                const response = await (apiClient as any).getAllSchoolLevels();
                if (response.data) setSchoolLevels(response.data);
            } else if (typeof (apiClient as any).schoolLevelApi?.getAll === 'function') {
                const response = await (apiClient as any).schoolLevelApi.getAll();
                if (response.data) setSchoolLevels(response.data);
            } else {
                // fallback: use GET request to /api/school-levels
                const response = await fetch('http://localhost:8000/api/school-levels');
                if (response.ok) {
                    const data = await response.json();
                    setSchoolLevels(data.data || []);
                } else {
                    throw new Error('Failed to fetch school levels');
                }
            }
        } catch (error: any) {
            console.error('Error fetching school levels:', error);
            setError('Failed to load school levels');
        }
    };

    const handleFormChange = (field: keyof typeof formData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        if (field === 'schoolLevel') {
            const selectedLevel = schoolLevels.find(level => level.id === parseInt(value));
            if (selectedLevel) {
                setForms(selectedLevel.forms_grades || []);
                // Flatten all terms from all forms_grades for this level
                const allTerms: Term[] = [];
                (selectedLevel.forms_grades || []).forEach(fg => {
                    if (fg.terms) allTerms.push(...fg.terms);
                });
                setTerms(allTerms);
                setFormData(prev => ({
                    ...prev,
                    form: '',
                    term: ''
                }));
            } else {
                setForms([]);
                setTerms([]);
            }
        }
        if (field === 'form') {
            const selectedForm = forms.find(f => f.id === parseInt(value));
            setTerms(selectedForm?.terms || []);
            setFormData(prev => ({ ...prev, term: '' }));
        }
    };

    const validateCurrentStep = () => {
        switch (currentStep) {
            case 1:
                if (!formData.schoolName || !formData.schoolLevel || !formData.form || !formData.term) {
                    setError('Please fill in all required fields');
                    return false;
                }
                break;
            default:
                break;
        }
        setError('');
        return true;
    };

    const handleSaveAndContinue = async () => {
        if (!isAuthenticated || !userEmail) {
            setError('Please sign in to continue');
            return;
        }

        if (!validateCurrentStep()) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const schemeData = {
                school_name: formData.schoolName,
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
                    step: 1
                }
            };

            const response = await apiClient.createScheme(schemeData, userEmail);
            if (response.data) {
                setCurrentStep(2);
                alert('School details saved successfully! You can now continue creating your timetable.');
            }
        } catch (error: any) {
            console.error('Error saving scheme:', error);
            setError(error.message || 'Failed to save scheme. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (validateCurrentStep()) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        setCurrentStep(prev => prev - 1);
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
                    <p>You need to sign in with your Google account to create a scheme of work.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-3xl font-bold text-center mb-8">Create Scheme of Work</h1>
                    {/* Progress Indicator */}
                    <div className="mb-8">
                        <div className="flex items-center justify-center space-x-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>1</div>
                            <div className="w-16 h-1 bg-gray-300"></div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>2</div>
                        </div>
                        <div className="flex justify-center mt-2">
                            <div className="text-sm text-gray-600">
                                {currentStep === 1 ? 'School Details' : 'Timetable Creation'}
                            </div>
                        </div>
                    </div>
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                            <div className="text-red-800">{error}</div>
                        </div>
                    )}
                    {/* Step 1: School Details */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">School Name *</label>
                                <input
                                    type="text"
                                    value={formData.schoolName}
                                    onChange={e => handleFormChange('schoolName', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Enter your school name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">School Level *</label>
                                <select
                                    value={formData.schoolLevel}
                                    onChange={e => handleFormChange('schoolLevel', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Select school level</option>
                                    {schoolLevels.map(level => (
                                        <option key={level.id} value={level.id}>{level.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Form/Grade *</label>
                                <select
                                    value={formData.form}
                                    onChange={e => handleFormChange('form', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    disabled={!formData.schoolLevel}
                                >
                                    <option value="">Select form/grade</option>
                                    {forms.map(form => (
                                        <option key={form.id} value={form.id}>{form.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Term *</label>
                                <select
                                    value={formData.term}
                                    onChange={e => handleFormChange('term', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    disabled={!formData.form}
                                >
                                    <option value="">Select term</option>
                                    {terms.map(term => (
                                        <option key={term.id} value={term.id}>{term.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-between pt-6">
                                <div></div>
                                <button
                                    onClick={handleSaveAndContinue}
                                    disabled={loading}
                                    className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save and Continue'}
                                </button>
                            </div>
                        </div>
                    )}
                    {/* Step 2: Timetable Creation */}
                    {currentStep === 2 && (
                        <div className="text-center">
                            <h2 className="text-2xl font-bold mb-4">Timetable Creation</h2>
                            <p className="text-gray-600 mb-6">
                                Great! Your school details have been saved. 
                                Now you can proceed to create your timetable.
                            </p>
                            <div className="flex justify-between pt-6">
                                <button
                                    onClick={handlePrevious}
                                    className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
                                >
                                    Previous
                                </button>
                                <button className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600">
                                    Create Timetable
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SchemeOfWorkWizard;