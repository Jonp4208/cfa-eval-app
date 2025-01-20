import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle } from 'lucide-react';

interface Evaluation {
  _id: string;
  employee: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    position: string;
  };
  evaluator: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  template: {
    _id: string;
    name: string;
    description: string;
    sections: Array<{
      title: string;
      questions: Array<{
        id: string;
        text: string;
        type: 'rating' | 'text';
        required?: boolean;
      }>;
    }>;
  };
  status: 'pending_self_evaluation' | 'pending_manager_review' | 'in_review_session' | 'completed';
  scheduledDate: string;
  reviewSessionDate?: string;
  selfEvaluation?: Record<string, any>;
  managerEvaluation?: Record<string, any>;
  overallComments?: string;
  developmentPlan?: string;
  acknowledgement?: {
    acknowledged: boolean;
    date: string;
  };
}

interface Grade {
  value: number;
  label: string;
  description?: string;
  color: string;
}

interface GradingScale {
  _id: string;
  name: string;
  description?: string;
  grades: Grade[];
  isDefault: boolean;
}

interface Question {
  id: string;
  text: string;
  type: 'rating' | 'text';
  required?: boolean;
  gradingScale?: GradingScale;
}

interface Section {
  title: string;
  description?: string;
  order?: number;
  questions: Question[];
}

export default function ViewEvaluation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [overallComments, setOverallComments] = useState('');
  const [reviewSessionDate, setReviewSessionDate] = useState<string>('');
  const [showScheduleReview, setShowScheduleReview] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Initialize showScheduleReview based on URL parameter
  useEffect(() => {
    if (searchParams.get('showSchedule') === 'true') {
      setShowScheduleReview(true);
    }
  }, [searchParams]);

  const getRatingText = (rating: number | string, gradingScale?: GradingScale): string => {
    if (!gradingScale) return 'No rating provided';
    
    const ratingNum = Number(rating);
    const grade = gradingScale.grades.find(g => g.value === ratingNum);
    return grade ? grade.label : 'No rating provided';
  };

  const getRatingColor = (rating: number | string, gradingScale?: GradingScale): string => {
    if (!gradingScale) return '#000000';
    
    const ratingNum = Number(rating);
    const grade = gradingScale.grades.find(g => g.value === ratingNum);
    return grade ? grade.color : '#000000';
  };

  // Fetch evaluation data with grading scales
  const { data: evaluation, isLoading, refetch } = useQuery({
    queryKey: ['evaluation', id],
    queryFn: async () => {
      const response = await api.get(`/api/evaluations/${id}`);
      return response.data.evaluation;
    }
  });

  // Initialize answers when evaluation data is loaded
  useEffect(() => {
    if (evaluation) {
      // If user is the employee and self-evaluation exists, load it
      if (user?._id === evaluation.employee._id && evaluation.selfEvaluation) {
        setAnswers(evaluation.selfEvaluation);
      }
      // If user is the manager and manager evaluation exists, load it
      else if (user?._id === evaluation.evaluator._id && evaluation.managerEvaluation) {
        setAnswers(evaluation.managerEvaluation);
        setOverallComments(evaluation.overallComments || '');
      }
    }
  }, [evaluation, user]);

  // Submit self-evaluation mutation
  const submitSelfEvaluation = useMutation({
    mutationFn: async () => {
      await api.post(`/api/evaluations/${id}/self-evaluation`, {
        selfEvaluation: answers
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your self-evaluation has been submitted successfully.",
      });
      navigate('/dashboard');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit evaluation. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Schedule review session mutation
  const scheduleReviewSession = useMutation({
    mutationFn: async () => {
      return api.post(`/api/evaluations/${id}/schedule-review`, {
        reviewSessionDate
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Review session scheduled successfully',
      });
      setShowScheduleReview(false);
      navigate('/evaluations');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to schedule review session',
        variant: 'destructive',
      });
    }
  });

  // Complete manager evaluation mutation
  const completeManagerEvaluation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`/api/evaluations/${id}/complete`, {
        managerEvaluation: answers,
        overallComments
      });
      return response.data;
    },
    onSuccess: () => {
      // Create a custom notification element
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-xl shadow-lg z-50 flex items-center';
      notification.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>Review Completed Successfully</span>
      `;
      document.body.appendChild(notification);

      // Remove the notification after 3 seconds
      setTimeout(() => {
        notification.remove();
      }, 3000);

      // Navigate back to evaluations page after a short delay
      setTimeout(() => {
        navigate('/evaluations');
      }, 1000);
    },
    onError: (error: any) => {
      // Only show error notification if there's an actual error response
      if (error.response) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-4 rounded-xl shadow-lg z-50 flex items-center';
        notification.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>${error.response?.data?.message || 'Failed to complete evaluation'}</span>
        `;
        document.body.appendChild(notification);

        // Remove the notification after 3 seconds
        setTimeout(() => {
          notification.remove();
        }, 3000);
      }
    }
  });

  // Acknowledge evaluation mutation
  const acknowledgeEvaluation = useMutation({
    mutationFn: async () => {
      return api.post(`/api/evaluations/${id}/acknowledge`);
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Evaluation acknowledged successfully',
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to acknowledge evaluation',
        variant: 'destructive',
      });
    }
  });

  // Save draft mutation
  const saveDraft = useMutation({
    mutationFn: async () => {
      const payload = isEmployee 
        ? { selfEvaluation: answers }
        : { 
            managerEvaluation: answers,
            overallComments 
          };
      
      const response = await api.post(`/api/evaluations/${id}/save-draft`, payload);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Draft saved successfully',
      });
      navigate('/evaluations');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save draft',
        variant: 'destructive',
      });
    }
  });

  const handleAnswerChange = (sectionIndex: number, questionIndex: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [`${sectionIndex}-${questionIndex}`]: value
    }));
  };

  // Calculate progress
  const calculateProgress = () => {
    if (!evaluation) return 0;
    const totalQuestions = evaluation.template.sections.reduce(
      (total: number, section: Section) => total + section.questions.length,
      0
    );
    const answeredQuestions = Object.keys(answers).length;
    return Math.round((answeredQuestions / totalQuestions) * 100);
  };

  // Validate answers
  const validateAnswers = () => {
    const errors: string[] = [];
    evaluation?.template.sections.forEach((section: Section, sectionIndex: number) => {
      section.questions.forEach((question: { text: string; required?: boolean }, questionIndex: number) => {
        const answer = answers[`${sectionIndex}-${questionIndex}`];
        if (question.required && (!answer || answer.trim() === '')) {
          errors.push(`${section.title} - ${question.text}`);
        }
      });
    });
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Submit manager evaluation mutation
  const submitManagerEvaluation = useMutation({
    mutationFn: async () => {
      await api.post(`/api/evaluations/${id}/manager-evaluation`, {
        managerEvaluation: answers,
        overallComments
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your evaluation has been submitted successfully.",
      });
      navigate('/dashboard');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit evaluation. Please try again.",
        variant: "destructive",
      });
    }
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading evaluation...</div>;
  }

  if (!evaluation) {
    return <div className="text-center py-4">Evaluation not found</div>;
  }

  console.log('Evaluation data:', {
    employee: evaluation.employee,
    evaluator: evaluation.evaluator,
    status: evaluation.status
  });

  const isEmployee = user?._id === evaluation.employee._id;
  const isManager = user?._id === evaluation.evaluator._id;
  
  // Add debug logging
  console.log('Debug - Evaluation Display Conditions:', {
    isManager,
    status: evaluation.status,
    showScheduleReview,
    userId: user?._id,
    evaluatorId: evaluation.evaluator._id
  });

  const canEdit = (isEmployee && evaluation.status === 'pending_self_evaluation') ||
                 (isManager && evaluation.status === 'in_review_session');

  return (
    <div className="min-h-screen bg-[#F4F4F4] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#E51636] to-[#DD0031] rounded-[20px] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">
                  Evaluation for {evaluation?.employee?.email?.split('@')[0] || 'Loading...'}
                </h1>
                <p className="text-white/80 mt-2 text-lg">
                  Evaluator: {evaluation?.evaluator?.email?.split('@')[0] || 'Loading...'}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="h-12 px-6 bg-white/10 hover:bg-white/20 text-white rounded-2xl border-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                Back to Evaluations
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <Card className="bg-white rounded-[20px] shadow-md border-0">
          <CardContent className="p-8">
            {/* Status and Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-[#27251F]/60 mb-2">Employee</h3>
                  <p className="text-[#27251F] text-lg font-medium">
                    {evaluation?.employee?.email?.split('@')[0] || 'Loading...'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#27251F]/60 mb-2">Position</h3>
                  <p className="text-[#27251F] text-lg font-medium">
                    {evaluation?.employee?.position || 'Team Member'}
                  </p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-[#27251F]/60 mb-2">Status</h3>
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                    evaluation?.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : evaluation?.status === 'in_review_session'
                      ? 'bg-purple-100 text-purple-800'
                      : evaluation?.status === 'pending_manager_review'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {evaluation?.status?.replace(/_/g, ' ').replace(/\b\w/g, (letter: string) => letter.toUpperCase()) || 'Loading...'}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#27251F]/60 mb-2">Scheduled Date</h3>
                  <p className="text-[#27251F] text-lg font-medium">
                    {evaluation?.scheduledDate ? new Date(evaluation.scheduledDate).toLocaleDateString() : 'Loading...'}
                  </p>
                </div>
                {evaluation?.reviewSessionDate && (
                  <div>
                    <h3 className="text-sm font-medium text-[#27251F]/60 mb-2">Review Session Date</h3>
                    <p className="text-[#27251F] text-lg font-medium">
                      {new Date(evaluation.reviewSessionDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Grading Scale Legend */}
            <div className="mb-8 p-6 bg-[#27251F]/5 rounded-[20px]">
              <h3 className="text-lg font-medium text-[#27251F] mb-4">Grading Scale</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-xl">
                  <div className="text-lg font-medium text-[#27251F]">1 - Poor</div>
                  <div className="text-sm text-[#27251F]/60">Low Hands / Low Heart</div>
                </div>
                <div className="p-4 bg-white rounded-xl">
                  <div className="text-lg font-medium text-[#27251F]">2 - Fair</div>
                  <div className="text-sm text-[#27251F]/60">High Hands / Low Heart</div>
                </div>
                <div className="p-4 bg-white rounded-xl">
                  <div className="text-lg font-medium text-[#27251F]">3 - Good</div>
                  <div className="text-sm text-[#27251F]/60">Low Hands / High Heart</div>
                </div>
                <div className="p-4 bg-white rounded-xl">
                  <div className="text-lg font-medium text-[#27251F]">4 - Excellent</div>
                  <div className="text-sm text-[#27251F]/60">High Hands / High Heart</div>
                </div>
              </div>
            </div>

            {/* Schedule Review Session Modal */}
            {showScheduleReview && (
              <Card className="mb-8 border border-[#E51636]/20 rounded-[20px]">
                <CardHeader className="p-6 pb-0">
                  <CardTitle className="text-xl text-[#27251F]">Schedule Review Session</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[#27251F]/60 mb-2">
                        Select Date and Time for Review Session
                      </label>
                      <input
                        type="datetime-local"
                        value={reviewSessionDate}
                        onChange={(e) => setReviewSessionDate(e.target.value)}
                        className="w-full h-12 px-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E51636] focus:border-transparent"
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                    <div className="flex justify-end gap-4">
                      <Button
                        variant="outline"
                        onClick={() => setShowScheduleReview(false)}
                        className="h-12 px-6 rounded-2xl"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => scheduleReviewSession.mutate()}
                        disabled={!reviewSessionDate || scheduleReviewSession.isPending}
                        className="bg-[#E51636] text-white hover:bg-[#E51636]/90 h-12 px-6 rounded-2xl"
                      >
                        {scheduleReviewSession.isPending ? 'Scheduling...' : 'Schedule Session'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Show self-evaluation if viewing as manager */}
            {isManager && evaluation.selfEvaluation && (
              <Card className="mb-8 border border-[#E51636]/20 rounded-[20px]">
                <CardHeader className="p-6 pb-0">
                  <CardTitle className="text-xl text-[#27251F]">Employee Self-Evaluation</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {evaluation.template.sections.map((section: Section, sectionIndex: number) => (
                    <div key={sectionIndex} className="mb-8 last:mb-0">
                      <h3 className="text-lg font-medium text-[#27251F] mb-4">{section.title}</h3>
                      {section.questions.map((question: Question, questionIndex: number) => (
                        <div key={questionIndex} className="mb-6 last:mb-0">
                          <p className="text-sm font-medium text-[#27251F]/60 mb-2">{question.text}</p>
                          <div className="bg-[#27251F]/5 p-4 rounded-2xl text-[#27251F]">
                            {question.type === 'rating' ? (
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ 
                                    backgroundColor: getRatingColor(
                                      evaluation.selfEvaluation[`${sectionIndex}-${questionIndex}`],
                                      question.gradingScale
                                    )
                                  }}
                                />
                                <span>
                                  {evaluation.selfEvaluation[`${sectionIndex}-${questionIndex}`]
                                    ? `${evaluation.selfEvaluation[`${sectionIndex}-${questionIndex}`]} - ${
                                        getRatingText(
                                          evaluation.selfEvaluation[`${sectionIndex}-${questionIndex}`],
                                          question.gradingScale
                                        )
                                      }`
                                    : 'No rating provided'
                                  }
                                </span>
                              </div>
                            ) : (
                              evaluation.selfEvaluation[`${sectionIndex}-${questionIndex}`] || 'No response provided'
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Manager Review Session Notice */}
            {isManager && evaluation.status === 'pending_manager_review' && !showScheduleReview && (
              <Card className="mb-8 bg-yellow-50 border-yellow-200 rounded-[20px]">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center justify-center gap-2 text-yellow-800">
                      <AlertCircle className="w-5 h-5" />
                      <p className="text-center font-medium">
                        Action Required: Schedule Review Session
                      </p>
                    </div>
                    <p className="text-center text-yellow-700">
                      Please schedule a review session with the employee to complete the evaluation together.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowScheduleReview(true)}
                      className="inline-flex items-center justify-center px-6 py-3 bg-[#E51636] text-white font-medium rounded-xl hover:bg-[#E51636]/90 transition-colors"
                    >
                      Start Scheduling Review
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current evaluation form */}
            {canEdit && (
              <>
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium text-[#27251F]">Completion Progress</h3>
                    <span className="text-sm text-[#27251F]/60">{calculateProgress()}%</span>
                  </div>
                  <Progress 
                    value={calculateProgress()} 
                    className="h-2 bg-[#27251F]/10 rounded-full [&>div]:bg-[#E51636] [&>div]:rounded-full"
                  />
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (validateAnswers()) {
                    setShowConfirmSubmit(true);
                  }
                }}>
                  {validationErrors.length > 0 && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <h4 className="text-red-800 font-medium mb-2">Please complete the following questions:</h4>
                      <ul className="list-disc list-inside text-sm text-red-600">
                        {validationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {evaluation.template.sections.map((section: Section, sectionIndex: number) => (
                    <div key={sectionIndex} className="mb-8">
                      <h3 className="font-medium text-[#27251F] mb-4">{section.title}</h3>
                      {section.questions.map((question: Question, questionIndex: number) => (
                        <div key={questionIndex} className="mb-6">
                          <label className="block text-sm text-[#27251F]/60 mb-2">
                            {question.text}
                          </label>
                          {question.type === 'rating' ? (
                            <select
                              value={answers[`${sectionIndex}-${questionIndex}`] || ''}
                              onChange={(e) => handleAnswerChange(sectionIndex, questionIndex, e.target.value)}
                              className="max-w-[300px] h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E51636] focus:border-transparent bg-white"
                            >
                              <option value="">Select a rating</option>
                              {question.gradingScale?.grades.map(grade => (
                                <option key={grade.value} value={grade.value}>
                                  {grade.value} - {grade.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <textarea
                              value={answers[`${sectionIndex}-${questionIndex}`] || ''}
                              onChange={(e) => handleAnswerChange(sectionIndex, questionIndex, e.target.value)}
                              className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E51636] focus:border-transparent"
                              rows={3}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ))}

                  {/* Manager-only fields */}
                  {isManager && evaluation.status === 'in_review_session' && (
                    <div className="space-y-6 mb-8">
                      <div>
                        <label className="block text-sm font-medium text-[#27251F]/60 mb-2">
                          Overall Comments
                        </label>
                        <textarea
                          value={overallComments}
                          onChange={(e) => setOverallComments(e.target.value)}
                          className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E51636] focus:border-transparent"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between pt-4 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => saveDraft.mutate()}
                      disabled={saveDraft.isPending}
                      className="h-12 px-6 rounded-2xl"
                    >
                      {saveDraft.isPending ? 'Saving...' : 'Save Draft'}
                    </Button>
                    <Button
                      type="submit"
                      className="bg-[#E51636] text-white hover:bg-[#E51636]/90 h-12 px-6 rounded-2xl"
                      disabled={
                        submitSelfEvaluation.isPending ||
                        completeManagerEvaluation.isPending
                      }
                    >
                      {submitSelfEvaluation.isPending || completeManagerEvaluation.isPending
                        ? 'Submitting...'
                        : isManager
                        ? 'Complete Review'
                        : 'Submit Self-Evaluation'}
                    </Button>
                  </div>
                </form>

                <AlertDialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
                  <AlertDialogContent className="bg-white rounded-[20px] p-6">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-lg font-medium text-[#27251F]">Confirm Submission</AlertDialogTitle>
                      <AlertDialogDescription className="text-[#27251F]/60">
                        Are you sure you want to submit this evaluation? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="h-12 px-6 rounded-2xl">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          if (isEmployee) {
                            submitSelfEvaluation.mutate();
                          } else if (isManager) {
                            completeManagerEvaluation.mutate();
                          }
                          setShowConfirmSubmit(false);
                        }}
                        className="bg-[#E51636] text-white hover:bg-[#E51636]/90 h-12 px-6 rounded-2xl"
                      >
                        Submit
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}

            {/* Completed evaluation view */}
            {evaluation.status === 'completed' && (
              <div className="space-y-8">
                {/* Side by side comparison */}
                {evaluation.template.sections.map((section: Section, sectionIndex: number) => (
                  <Card key={sectionIndex} className="bg-white rounded-[20px] shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg text-[#27251F]">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {section.questions.map((question: Question, questionIndex: number) => {
                          const answerKey = `${sectionIndex}-${questionIndex}`;
                          // Access the raw evaluation data directly
                          const selfAnswer = evaluation.selfEvaluation[answerKey];
                          const managerAnswer = evaluation.managerEvaluation[answerKey];
                          
                          console.log('Debug - Question:', question.text);
                          console.log('Debug - Answer Key:', answerKey);
                          console.log('Debug - Self Answer:', selfAnswer);
                          console.log('Debug - Manager Answer:', managerAnswer);
                          console.log('Debug - Raw Self Evaluation:', evaluation.selfEvaluation);
                          console.log('Debug - Raw Manager Evaluation:', evaluation.managerEvaluation);
                          
                          const getRatingText = (rating: any) => {
                            const ratingNum = Number(rating);
                            console.log('Debug - Rating Number:', ratingNum, typeof ratingNum);
                            switch(ratingNum) {
                              case 1: return 'Poor';
                              case 2: return 'Fair';
                              case 3: return 'Good';
                              case 4: return 'Very Good';
                              case 5: return 'Excellent';
                              default: return 'No rating provided';
                            }
                          };

                          return (
                            <div key={questionIndex} className="space-y-4">
                              <h4 className="font-medium text-[#27251F]">{question.text}</h4>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-[#27251F]/60 mb-2">
                                    Employee Response
                                  </label>
                                  <div className="bg-[#27251F]/5 p-4 rounded-xl text-[#27251F]">
                                    {question.type === 'rating' ? (
                                      selfAnswer ? `${selfAnswer} - ${getRatingText(selfAnswer)}` : 'No rating provided'
                                    ) : (
                                      selfAnswer || 'No response provided'
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-[#27251F]/60 mb-2">
                                    Manager Response
                                  </label>
                                  <div className="bg-[#E51636]/5 p-4 rounded-xl text-[#27251F]">
                                    {question.type === 'rating' ? (
                                      managerAnswer ? `${managerAnswer} - ${getRatingText(managerAnswer)}` : 'No rating provided'
                                    ) : (
                                      managerAnswer || 'No response provided'
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Overall Comments and Development Plan */}
                <Card className="bg-white rounded-[20px] shadow-md">
                  <CardHeader>
                    <CardTitle className="text-lg text-[#27251F]">Final Review</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {evaluation.overallComments && (
                      <div>
                        <h3 className="font-medium text-[#27251F] mb-3">Overall Comments</h3>
                        <div className="bg-[#E51636]/5 p-4 rounded-xl text-[#27251F]">
                          {evaluation.overallComments}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Acknowledgement section */}
                {isEmployee && !evaluation.acknowledgement?.acknowledged && (
                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => acknowledgeEvaluation.mutate()}
                      disabled={acknowledgeEvaluation.isPending}
                      className="bg-[#E51636] text-white hover:bg-[#E51636]/90 h-12 px-6 rounded-2xl"
                    >
                      {acknowledgeEvaluation.isPending ? 'Acknowledging...' : 'Acknowledge Evaluation'}
                    </Button>
                  </div>
                )}

                {/* Show acknowledgement status */}
                {evaluation.acknowledgement?.acknowledged && (
                  <div className="text-sm text-[#27251F]/60 pt-4 border-t border-gray-200">
                    Acknowledged by {evaluation.employee.name} on{' '}
                    {new Date(evaluation.acknowledgement.date).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 