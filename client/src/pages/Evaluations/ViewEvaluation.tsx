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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState({ section: 0, question: 0 });
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [showSummary, setShowSummary] = useState(false);

  // Initialize showScheduleReview based on URL parameter
  useEffect(() => {
    if (searchParams.get('showSchedule') === 'true') {
      setShowScheduleReview(true);
    }
  }, [searchParams]);

  const getRatingText = (rating: string | number | undefined, gradingScale?: GradingScale): string => {
    if (!rating && typeof rating !== 'number') {
      return 'Performer'; // Default to Performer if no rating
    }

    // If the rating is a string starting with "- ", return the rest of the string
    if (typeof rating === 'string' && rating.startsWith('- ')) {
      return rating.substring(2); // Remove the "- " prefix
    }

    // For numeric ratings, use the grading scale
    if (gradingScale) {
      const ratingNum = Number(rating);
      const grade = gradingScale.grades.find(g => g.value === ratingNum);
      return grade ? grade.label : 'Performer';
    }

    return 'Performer';
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

  // Calculate total questions when evaluation loads
  useEffect(() => {
    if (evaluation) {
      const total = evaluation.template.sections.reduce(
        (total: number, section: Section) => total + section.questions.length,
        0
      );
      setTotalQuestions(total);
    }
  }, [evaluation]);

  // Helper function to get next question indices
  const getNextQuestionIndices = (currentSection: number, currentQuestion: number) => {
    if (!evaluation) return null;
    
    const section = evaluation.template.sections[currentSection];
    if (currentQuestion + 1 < section.questions.length) {
      return { section: currentSection, question: currentQuestion + 1 };
    }
    
    if (currentSection + 1 < evaluation.template.sections.length) {
      return { section: currentSection + 1, question: 0 };
    }
    
    return null;
  };

  // Helper function to get previous question indices
  const getPreviousQuestionIndices = (currentSection: number, currentQuestion: number) => {
    if (!evaluation) return null;
    
    if (currentQuestion > 0) {
      return { section: currentSection, question: currentQuestion - 1 };
    }
    
    if (currentSection > 0) {
      const previousSection = evaluation.template.sections[currentSection - 1];
      return { 
        section: currentSection - 1, 
        question: previousSection.questions.length - 1 
      };
    }
    
    return null;
  };

  // Calculate current question number (1-based)
  const getCurrentQuestionNumber = () => {
    if (!evaluation) return 1;
    
    let questionNumber = 1;
    for (let s = 0; s < currentQuestionIndex.section; s++) {
      questionNumber += evaluation.template.sections[s].questions.length;
    }
    return questionNumber + currentQuestionIndex.question;
  };

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

  // Send unacknowledged notification mutation
  const sendUnacknowledgedNotification = useMutation({
    mutationFn: async () => {
      return api.post(`/api/evaluations/${id}/notify-unacknowledged`);
    },
    onSuccess: () => {
      // Create and show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-4 rounded-xl shadow-lg z-[9999] flex items-center transform transition-all duration-300 translate-y-0';
      notification.style.cssText = 'position: fixed; top: 1rem; right: 1rem; z-index: 9999;';
      notification.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span>Acknowledgement reminder sent successfully</span>
      `;
      document.body.appendChild(notification);

      // Add entrance animation
      requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
      });

      // Remove the notification after 3 seconds
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    },
    onError: (error: any) => {
      // Create and show error notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-4 rounded-xl shadow-lg z-[9999] flex items-center transform transition-all duration-300 translate-y-0';
      notification.style.cssText = 'position: fixed; top: 1rem; right: 1rem; z-index: 9999;';
      notification.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span>${error.response?.data?.message || 'Failed to send notification'}</span>
      `;
      document.body.appendChild(notification);

      // Add entrance animation
      requestAnimationFrame(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
      });

      // Remove the notification after 3 seconds
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
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
      section.questions.forEach((question: Question, questionIndex: number) => {
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

  // Add helper function to calculate rating value
  const getRatingValue = (rating: string | number | undefined, gradingScale?: GradingScale): number => {
    if (!rating || !gradingScale) return 0;
    if (typeof rating === 'number') return rating;
    
    // If we have a grading scale, find the grade by label
    const grade = gradingScale.grades.find(g => 
      rating.includes(g.label) || rating.includes(`- ${g.label}`)
    );
    
    // Find the index of the grade in the sorted grades array (1-based)
    if (grade) {
      const sortedGrades = [...gradingScale.grades].sort((a, b) => a.value - b.value);
      return sortedGrades.findIndex(g => g.label === grade.label) + 1;
    }
    
    return 0;
  };

  // Add helper function to calculate total score
  const calculateTotalScore = (ratings: Record<string, any> | undefined | null): { score: number; total: number } => {
    if (!evaluation || !ratings) return { score: 0, total: 0 };

    let totalScore = 0;
    let totalPossible = 0;

    evaluation.template.sections.forEach((section: Section, sectionIndex: number) => {
      section.questions.forEach((question: Question, questionIndex: number) => {
        if (question.type === 'rating' && question.gradingScale) {
          const rating = ratings[`${sectionIndex}-${questionIndex}`];
          if (rating !== undefined && rating !== null) {
            // Get the total number of grades as the maximum possible value
            const maxValue = question.gradingScale.grades.length;
            totalScore += getRatingValue(rating, question.gradingScale);
            totalPossible += maxValue;
          }
        }
      });
    });

    return { score: totalScore, total: totalPossible };
  };

  // Add helper function to compare ratings
  const getComparisonStyle = (employeeRating: string | number | undefined, managerRating: string | number | undefined, gradingScale?: GradingScale): string => {
    if (!employeeRating || !managerRating || !gradingScale) return '';
    
    const employeeValue = getRatingValue(employeeRating, gradingScale);
    const managerValue = getRatingValue(managerRating, gradingScale);

    if (managerValue > employeeValue) return 'bg-green-50 border-green-200';
    if (managerValue < employeeValue) return 'bg-red-50 border-red-200';
    return 'bg-[#27251F]/5'; // Default background for matching ratings
  };

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
                <div className="p-4 bg-red-50 text-red-800 rounded-xl">
                  <div className="text-lg font-medium">1 - Improvement Needed</div>
                  <div className="text-sm opacity-80">Low Hands / Low Heart</div>
                </div>
                <div className="p-4 bg-yellow-50 text-yellow-800 rounded-xl">
                  <div className="text-lg font-medium">2 - Performer</div>
                  <div className="text-sm opacity-80">High Hands / Low Heart</div>
                </div>
                <div className="p-4 bg-blue-50 text-blue-800 rounded-xl">
                  <div className="text-lg font-medium">3 - Valued</div>
                  <div className="text-sm opacity-80">Low Hands / High Heart</div>
                </div>
                <div className="p-4 bg-green-50 text-green-800 rounded-xl">
                  <div className="text-lg font-medium">4 - Star</div>
                  <div className="text-sm opacity-80">High Hands / High Heart</div>
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

            {/* Self Evaluation Form */}
            {isEmployee && evaluation.status === 'pending_self_evaluation' && (
              <>
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium text-[#27251F]">Question {getCurrentQuestionNumber()} of {totalQuestions}</h3>
                    <span className="text-sm text-[#27251F]/60">{Math.round((getCurrentQuestionNumber() / totalQuestions) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(getCurrentQuestionNumber() / totalQuestions) * 100} 
                    className="h-2 bg-[#27251F]/10 rounded-full [&>div]:bg-[#E51636] [&>div]:rounded-full"
                  />
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (validateAnswers()) {
                    submitSelfEvaluation.mutate();
                  }
                }}>
                  {validationErrors.length > 0 && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <h4 className="text-red-800 font-medium mb-2">Please complete all required questions before submitting</h4>
                      <ul className="list-disc list-inside text-sm text-red-600">
                        {validationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Current Question Display */}
                  <div className="space-y-6 mb-8">
                    <div className="bg-white rounded-xl p-6 border border-gray-200">
                      {/* Question */}
                      <div className="mb-6">
                        <h3 className="text-lg font-medium text-[#27251F] mb-4">
                          {evaluation.template.sections[currentQuestionIndex.section]
                            .questions[currentQuestionIndex.question].text}
                        </h3>
                      </div>

                      {/* Rating Input */}
                      <div>
                        <select
                          value={answers[`${currentQuestionIndex.section}-${currentQuestionIndex.question}`] || ''}
                          onChange={(e) => handleAnswerChange(currentQuestionIndex.section, currentQuestionIndex.question, e.target.value)}
                          className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E51636] focus:border-transparent bg-white"
                        >
                          <option value="">Select a rating</option>
                          {evaluation.template.sections[currentQuestionIndex.section]
                            .questions[currentQuestionIndex.question].gradingScale?.grades.map((grade: Grade) => (
                            <option key={grade.value} value={grade.value}>
                              {grade.value} - {grade.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const prev = getPreviousQuestionIndices(currentQuestionIndex.section, currentQuestionIndex.question);
                          if (prev) setCurrentQuestionIndex(prev);
                        }}
                        disabled={currentQuestionIndex.section === 0 && currentQuestionIndex.question === 0}
                        className="h-12 px-6 rounded-2xl"
                      >
                        Previous Question
                      </Button>
                      
                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => saveDraft.mutate()}
                          disabled={saveDraft.isPending}
                          className="h-12 px-6 rounded-2xl"
                        >
                          {saveDraft.isPending ? 'Saving...' : 'Save Draft'}
                        </Button>
                        
                        {getNextQuestionIndices(currentQuestionIndex.section, currentQuestionIndex.question) ? (
                          <Button
                            type="button"
                            onClick={() => {
                              const next = getNextQuestionIndices(currentQuestionIndex.section, currentQuestionIndex.question);
                              if (next) setCurrentQuestionIndex(next);
                            }}
                            className="bg-[#E51636] text-white hover:bg-[#E51636]/90 h-12 px-6 rounded-2xl"
                          >
                            Next Question
                          </Button>
                        ) : (
                          <Button
                            type="submit"
                            className="bg-[#E51636] text-white hover:bg-[#E51636]/90 h-12 px-6 rounded-2xl"
                          >
                            Submit Evaluation
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </form>
              </>
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
            {canEdit && isManager && evaluation.status === 'in_review_session' && (
              <>
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-medium text-[#27251F]">Question {getCurrentQuestionNumber()} of {totalQuestions}</h3>
                    <span className="text-sm text-[#27251F]/60">{Math.round((getCurrentQuestionNumber() / totalQuestions) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(getCurrentQuestionNumber() / totalQuestions) * 100} 
                    className="h-2 bg-[#27251F]/10 rounded-full [&>div]:bg-[#E51636] [&>div]:rounded-full"
                  />
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (validateAnswers()) {
                    setShowSummary(true);
                  }
                }}>
                  {validationErrors.length > 0 && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <h4 className="text-red-800 font-medium mb-2">Please complete all required questions before submitting</h4>
                      <ul className="list-disc list-inside text-sm text-red-600">
                        {validationErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Current Question Display - Hide when showing summary */}
                  {!showSummary && (
                    <div className="space-y-6 mb-8">
                      <div className="bg-white rounded-xl p-6 border border-gray-200">
                        {/* Question */}
                        <div className="mb-6">
                          <h3 className="text-lg font-medium text-[#27251F] mb-4">
                            {evaluation.template.sections[currentQuestionIndex.section]
                              .questions[currentQuestionIndex.question].text}
                          </h3>
                        </div>

                        {/* Employee's Rating */}
                        <div className="mb-6">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ 
                                backgroundColor: getRatingColor(
                                  evaluation.selfEvaluation?.[`${currentQuestionIndex.section}-${currentQuestionIndex.question}`],
                                  evaluation.template.sections[currentQuestionIndex.section]
                                    .questions[currentQuestionIndex.question].gradingScale
                                )
                              }}
                            />
                            <span className="text-[#27251F] font-medium">
                              {getRatingText(
                                evaluation.selfEvaluation?.[`${currentQuestionIndex.section}-${currentQuestionIndex.question}`],
                                evaluation.template.sections[currentQuestionIndex.section]
                                  .questions[currentQuestionIndex.question].gradingScale
                              )}
                            </span>
                          </div>
                        </div>
                        
                        {/* Manager's Input */}
                        <div>
                          <select
                            value={answers[`${currentQuestionIndex.section}-${currentQuestionIndex.question}`] || ''}
                            onChange={(e) => handleAnswerChange(currentQuestionIndex.section, currentQuestionIndex.question, e.target.value)}
                            className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E51636] focus:border-transparent bg-white"
                          >
                            <option value="">Select a rating</option>
                            {evaluation.template.sections[currentQuestionIndex.section]
                              .questions[currentQuestionIndex.question].gradingScale?.grades.map((grade: Grade) => (
                              <option key={grade.value} value={grade.value}>
                                {grade.value} - {grade.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Navigation and Finalize Buttons */}
                      <div className="flex justify-between items-center">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const prev = getPreviousQuestionIndices(currentQuestionIndex.section, currentQuestionIndex.question);
                            if (prev) setCurrentQuestionIndex(prev);
                          }}
                          disabled={currentQuestionIndex.section === 0 && currentQuestionIndex.question === 0}
                          className="h-12 px-6 rounded-2xl"
                        >
                          Previous Question
                        </Button>
                        
                        <div className="flex gap-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => saveDraft.mutate()}
                            disabled={saveDraft.isPending}
                            className="h-12 px-6 rounded-2xl"
                          >
                            {saveDraft.isPending ? 'Saving...' : 'Save Draft'}
                          </Button>
                          
                          {getNextQuestionIndices(currentQuestionIndex.section, currentQuestionIndex.question) ? (
                            <Button
                              type="button"
                              onClick={() => {
                                const next = getNextQuestionIndices(currentQuestionIndex.section, currentQuestionIndex.question);
                                if (next) setCurrentQuestionIndex(next);
                              }}
                              className="bg-[#E51636] text-white hover:bg-[#E51636]/90 h-12 px-6 rounded-2xl"
                            >
                              Next Question
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              onClick={() => setShowSummary(true)}
                              className="bg-[#E51636] text-white hover:bg-[#E51636]/90 h-12 px-6 rounded-2xl"
                            >
                              Finalize Review
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary View */}
                  {showSummary && (
                    <>
                      <div className="mt-8 space-y-6">
                        {/* Overall Scores Card */}
                        <Card className="bg-white rounded-xl border border-gray-200">
                          <CardHeader>
                            <CardTitle className="text-xl text-[#27251F]">Overall Ratings</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              {/* Employee's Overall Score */}
                              <div>
                                <h4 className="text-sm font-medium text-[#27251F]/60 mb-2">Employee's Overall Rating</h4>
                                {(() => {
                                  const { score, total } = calculateTotalScore(evaluation.selfEvaluation);
                                  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
                                  return (
                                    <div className="space-y-2">
                                      <div className="text-2xl font-bold text-[#27251F]">
                                        {score}/{total} <span className="text-lg font-normal text-[#27251F]/60">points</span>
                                      </div>
                                      <div className="w-full bg-[#27251F]/10 rounded-full h-2">
                                        <div
                                          className="bg-[#E51636] h-2 rounded-full"
                                          style={{ width: `${percentage}%` }}
                                        />
                                      </div>
                                      <div className="text-sm text-[#27251F]/60">{percentage}% Overall Rating</div>
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Manager's Overall Score */}
                              <div>
                                <h4 className="text-sm font-medium text-[#27251F]/60 mb-2">Manager's Overall Rating</h4>
                                {(() => {
                                  const { score, total } = calculateTotalScore(answers);
                                  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
                                  return (
                                    <div className="space-y-2">
                                      <div className="text-2xl font-bold text-[#27251F]">
                                        {score}/{total} <span className="text-lg font-normal text-[#27251F]/60">points</span>
                                      </div>
                                      <div className="w-full bg-[#27251F]/10 rounded-full h-2">
                                        <div
                                          className="bg-[#E51636] h-2 rounded-full"
                                          style={{ width: `${percentage}%` }}
                                        />
                                      </div>
                                      <div className="text-sm text-[#27251F]/60">{percentage}% Overall Rating</div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-white rounded-xl border border-gray-200">
                          <CardHeader>
                            <CardTitle className="text-xl text-[#27251F]">Review Summary</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-8">
                            {evaluation.template.sections.map((section: Section, sectionIndex: number) => (
                              <div key={sectionIndex} className="space-y-4">
                                <h3 className="font-medium text-lg text-[#27251F]">{section.title}</h3>
                                {section.questions.map((question: Question, questionIndex: number) => {
                                  const employeeRating = evaluation.selfEvaluation?.[`${sectionIndex}-${questionIndex}`];
                                  const managerRating = evaluation.managerEvaluation?.[`${sectionIndex}-${questionIndex}`];
                                  const employeeColor = getRatingColor(employeeRating, question.gradingScale);
                                  const managerColor = getRatingColor(managerRating, question.gradingScale);
                                  const employeeValue = getRatingValue(employeeRating, question.gradingScale);
                                  const managerValue = getRatingValue(managerRating, question.gradingScale);
                                  
                                  let comparisonStyle = '';
                                  if (managerValue > employeeValue) {
                                    comparisonStyle = 'bg-green-50 border-green-200';
                                  } else if (managerValue < employeeValue) {
                                    comparisonStyle = 'bg-red-50 border-red-200';
                                  } else {
                                    comparisonStyle = 'bg-[#27251F]/5';
                                  }

                                  return (
                                    <div key={questionIndex} className={`p-4 rounded-xl border ${comparisonStyle}`}>
                                      <p className="font-medium text-[#27251F] mb-3">{question.text}</p>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Employee's Rating */}
                                        <div>
                                          <p className="text-sm font-medium text-[#27251F]/60 mb-2">Employee's Rating:</p>
                                          <div className="flex items-center gap-2">
                                            <div
                                              className="w-3 h-3 rounded-full"
                                              style={{ backgroundColor: employeeColor }}
                                            />
                                            <span style={{ color: employeeColor }}>
                                              {getRatingText(employeeRating, question.gradingScale)}
                                            </span>
                                          </div>
                                        </div>
                                        {/* Manager's Rating */}
                                        <div>
                                          <p className="text-sm font-medium text-[#27251F]/60 mb-2">Manager's Rating:</p>
                                          <div className="flex items-center gap-2">
                                            <div
                                              className="w-3 h-3 rounded-full"
                                              style={{ backgroundColor: managerColor }}
                                            />
                                            <span style={{ color: managerColor }}>
                                              {getRatingText(managerRating, question.gradingScale)}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </CardContent>
                        </Card>

                        {/* Overall Comments */}
                        <div>
                          <label className="block text-sm font-medium text-[#27251F]/60 mb-2">
                            Overall Comments
                          </label>
                          <textarea
                            value={overallComments}
                            onChange={(e) => setOverallComments(e.target.value)}
                            className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E51636] focus:border-transparent"
                            rows={3}
                            placeholder="Enter any overall comments about the evaluation..."
                          />
                        </div>

                        {/* Complete Review Button */}
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            onClick={() => {
                              if (validateAnswers()) {
                                setShowConfirmSubmit(true);
                              }
                            }}
                            className="bg-[#E51636] text-white hover:bg-[#E51636]/90 h-12 px-6 rounded-2xl"
                          >
                            Complete Review
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
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
                          completeManagerEvaluation.mutate();
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
                {/* Overall Ratings Card */}
                <Card className="bg-white rounded-[20px] shadow-md">
                  <CardHeader>
                    <CardTitle className="text-xl text-[#27251F]">Overall Ratings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Employee's Overall Score */}
                      <div>
                        <h4 className="text-sm font-medium text-[#27251F]/60 mb-2">Employee's Overall Rating</h4>
                        {(() => {
                          const { score, total } = calculateTotalScore(evaluation.selfEvaluation);
                          const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
                          return (
                            <div className="space-y-2">
                              <div className="text-2xl font-bold text-[#27251F]">
                                {score}/{total} <span className="text-lg font-normal text-[#27251F]/60">points</span>
                              </div>
                              <div className="w-full bg-[#27251F]/10 rounded-full h-2">
                                <div
                                  className="bg-[#E51636] h-2 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <div className="text-sm text-[#27251F]/60">{percentage}% Overall Rating</div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Manager's Overall Score */}
                      <div>
                        <h4 className="text-sm font-medium text-[#27251F]/60 mb-2">Manager's Overall Rating</h4>
                        {(() => {
                          const { score, total } = calculateTotalScore(evaluation.managerEvaluation);
                          const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
                          return (
                            <div className="space-y-2">
                              <div className="text-2xl font-bold text-[#27251F]">
                                {score}/{total} <span className="text-lg font-normal text-[#27251F]/60">points</span>
                              </div>
                              <div className="w-full bg-[#27251F]/10 rounded-full h-2">
                                <div
                                  className="bg-[#E51636] h-2 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <div className="text-sm text-[#27251F]/60">{percentage}% Overall Rating</div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Side by side comparison */}
                {evaluation.template.sections.map((section: Section, sectionIndex: number) => (
                  <Card key={sectionIndex} className="bg-white rounded-[20px] shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg text-[#27251F]">{section.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {section.questions.map((question: Question, questionIndex: number) => {
                          const employeeRating = evaluation.selfEvaluation?.[`${sectionIndex}-${questionIndex}`];
                          const managerRating = evaluation.managerEvaluation?.[`${sectionIndex}-${questionIndex}`];
                          const employeeColor = getRatingColor(employeeRating, question.gradingScale);
                          const managerColor = getRatingColor(managerRating, question.gradingScale);
                          const employeeValue = getRatingValue(employeeRating, question.gradingScale);
                          const managerValue = getRatingValue(managerRating, question.gradingScale);
                          
                          let comparisonStyle = '';
                          if (managerValue > employeeValue) {
                            comparisonStyle = 'bg-green-50 border-green-200';
                          } else if (managerValue < employeeValue) {
                            comparisonStyle = 'bg-red-50 border-red-200';
                          } else {
                            comparisonStyle = 'bg-[#27251F]/5';
                          }

                          return (
                            <div key={questionIndex} className={`p-4 rounded-xl border ${comparisonStyle}`}>
                              <p className="font-medium text-[#27251F] mb-3">{question.text}</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Employee's Rating */}
                                <div>
                                  <p className="text-sm font-medium text-[#27251F]/60 mb-2">Employee's Rating:</p>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: employeeColor }}
                                    />
                                    <span style={{ color: employeeColor }}>
                                      {getRatingText(employeeRating, question.gradingScale)}
                                    </span>
                                  </div>
                                </div>
                                {/* Manager's Rating */}
                                <div>
                                  <p className="text-sm font-medium text-[#27251F]/60 mb-2">Manager's Rating:</p>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{ backgroundColor: managerColor }}
                                    />
                                    <span style={{ color: managerColor }}>
                                      {getRatingText(managerRating, question.gradingScale)}
                                    </span>
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

                {/* Add this inside the completed evaluation view, after the acknowledgement status display */}
                {evaluation.status === 'completed' && !evaluation.acknowledgement?.acknowledged && isManager && (
                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => sendUnacknowledgedNotification.mutate()}
                      disabled={sendUnacknowledgedNotification.isPending}
                      className="bg-[#E51636] text-white hover:bg-[#E51636]/90 h-12 px-6 rounded-2xl"
                    >
                      {sendUnacknowledgedNotification.isPending ? 'Sending...' : 'Send Acknowledgement Reminder'}
                    </Button>
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