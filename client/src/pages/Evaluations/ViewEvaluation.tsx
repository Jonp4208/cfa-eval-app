import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/axios';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Evaluation {
  _id: string;
  employee: {
    _id: string;
    name: string;
    position: string;
  };
  evaluator: {
    _id: string;
    name: string;
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

interface Section {
  title: string;
  description?: string;
  order?: number;
  questions: Array<{
    id: string;
    text: string;
    type: 'rating' | 'text';
    required?: boolean;
  }>;
}

export default function ViewEvaluation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [overallComments, setOverallComments] = useState('');
  const [developmentPlan, setDevelopmentPlan] = useState('');
  const [reviewSessionDate, setReviewSessionDate] = useState<string>('');
  const [showScheduleReview, setShowScheduleReview] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const getRatingText = (rating: number | string): string => {
    const ratingNum = Number(rating);
    switch(ratingNum) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'No rating provided';
    }
  };

  // Fetch evaluation data
  const { data: evaluation, isLoading, refetch } = useQuery({
    queryKey: ['evaluation', id],
    queryFn: async () => {
      console.log('Fetching evaluation data...');
      const response = await api.get(`/api/evaluations/${id}`);
      console.log('Full API Response:', response);
      
      const rawEvaluation = response.data.evaluation;
      console.log('Raw Evaluation:', rawEvaluation);
      
      if (!rawEvaluation || !rawEvaluation.template || !rawEvaluation.template._doc) {
        console.error('Invalid evaluation structure:', rawEvaluation);
        throw new Error('Invalid evaluation data');
      }
      
      // Create a clean version of the evaluation object that preserves the raw data
      const transformedEvaluation = {
        ...rawEvaluation,
        template: {
          ...rawEvaluation.template._doc,
          sections: rawEvaluation.template._doc.sections.map((section: any) => ({
            title: section.title,
            description: section.description,
            order: section.order,
            questions: section.criteria.map((criterion: any) => ({
              id: criterion._id,
              text: criterion.name,
              description: criterion.description,
              type: 'rating',
              required: criterion.required
            }))
          }))
        },
        // Convert Map data to plain objects if they exist
        selfEvaluation: rawEvaluation.selfEvaluation instanceof Map 
          ? Object.fromEntries(rawEvaluation.selfEvaluation)
          : typeof rawEvaluation.selfEvaluation === 'object' 
            ? rawEvaluation.selfEvaluation 
            : {},
        managerEvaluation: rawEvaluation.managerEvaluation instanceof Map
          ? Object.fromEntries(rawEvaluation.managerEvaluation)
          : typeof rawEvaluation.managerEvaluation === 'object'
            ? rawEvaluation.managerEvaluation
            : {}
      };
      
      console.log('Transformed Evaluation:', transformedEvaluation);
      return transformedEvaluation;
    },
    retry: false // Disable retries to better see errors
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
        setDevelopmentPlan(evaluation.developmentPlan || '');
      }
    }
  }, [evaluation, user]);

  // Submit self-evaluation mutation
  const submitSelfEvaluation = useMutation({
    mutationFn: async () => {
      return api.post(`/api/evaluations/${id}/self-evaluation`, {
        selfEvaluation: answers
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Self-evaluation submitted successfully',
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to submit self-evaluation',
        variant: 'destructive',
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
      refetch();
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
      return api.post(`/api/evaluations/${id}/complete`, {
        managerEvaluation: answers,
        overallComments,
        developmentPlan
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Evaluation completed successfully',
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to complete evaluation',
        variant: 'destructive',
      });
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
      return api.post(`/api/evaluations/${id}/save-draft`, {
        [isEmployee ? 'selfEvaluation' : 'managerEvaluation']: answers
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Draft saved successfully',
      });
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

  if (isLoading) {
    return <div className="text-center py-4">Loading evaluation...</div>;
  }

  if (!evaluation) {
    return <div className="text-center py-4">Evaluation not found</div>;
  }

  const isEmployee = user?._id === evaluation.employee._id;
  const isManager = user?._id === evaluation.evaluator._id;
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
                <h1 className="text-3xl md:text-4xl font-bold">{evaluation.template.name}</h1>
                <div className="text-white/80 mt-2 space-y-1">
                  <p className="text-lg">Evaluation for {evaluation.employee.name}</p>
                  <p className="text-base">Evaluator: {evaluation.evaluator.name}</p>
                </div>
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
                  <p className="text-[#27251F] text-lg font-medium">{evaluation.employee.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#27251F]/60 mb-2">Position</h3>
                  <p className="text-[#27251F] text-lg font-medium">{evaluation.employee.position}</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-[#27251F]/60 mb-2">Status</h3>
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                    evaluation.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : evaluation.status === 'in_review_session'
                      ? 'bg-purple-100 text-purple-800'
                      : evaluation.status === 'pending_manager_review'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {evaluation.status.replace(/_/g, ' ').replace(/\b\w/g, (letter: string) => letter.toUpperCase())}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#27251F]/60 mb-2">Scheduled Date</h3>
                  <p className="text-[#27251F] text-lg font-medium">{new Date(evaluation.scheduledDate).toLocaleDateString()}</p>
                </div>
                {evaluation.reviewSessionDate && (
                  <div>
                    <h3 className="text-sm font-medium text-[#27251F]/60 mb-2">Review Session Date</h3>
                    <p className="text-[#27251F] text-lg font-medium">{new Date(evaluation.reviewSessionDate).toLocaleDateString()}</p>
                  </div>
                )}
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
                      {section.questions.map((question: { text: string; type: 'rating' | 'text' }, questionIndex: number) => (
                        <div key={questionIndex} className="mb-6 last:mb-0">
                          <p className="text-sm font-medium text-[#27251F]/60 mb-2">{question.text}</p>
                          <div className="bg-[#27251F]/5 p-4 rounded-2xl text-[#27251F]">
                            {question.type === 'rating' ? (
                              evaluation.selfEvaluation[`${sectionIndex}-${questionIndex}`] 
                                ? `${evaluation.selfEvaluation[`${sectionIndex}-${questionIndex}`]} - ${getRatingText(evaluation.selfEvaluation[`${sectionIndex}-${questionIndex}`])}` 
                                : 'No rating provided'
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
                  <p className="text-center text-yellow-800 font-medium">
                    Please schedule a review session with the employee to complete the evaluation together.
                  </p>
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
                    className="h-2 bg-[#27251F]/10 rounded-full"
                    indicatorClassName="bg-[#E51636] rounded-full"
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
                      {section.questions.map((question: { text: string; type: 'rating' | 'text' }, questionIndex: number) => (
                        <div key={questionIndex} className="mb-6">
                          <label className="block text-sm text-[#27251F]/60 mb-2">
                            {question.text}
                          </label>
                          {question.type === 'rating' ? (
                            <select
                              value={answers[`${sectionIndex}-${questionIndex}`] || ''}
                              onChange={(e) => handleAnswerChange(sectionIndex, questionIndex, e.target.value)}
                              className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E51636] focus:border-transparent"
                            >
                              <option value="">Select a rating</option>
                              {[1, 2, 3, 4, 5].map(rating => (
                                <option key={rating} value={rating}>
                                  {rating} - {rating === 1 ? 'Poor' : rating === 2 ? 'Fair' : rating === 3 ? 'Good' : rating === 4 ? 'Very Good' : 'Excellent'}
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
                      <div>
                        <label className="block text-sm font-medium text-[#27251F]/60 mb-2">
                          Development Plan
                        </label>
                        <textarea
                          value={developmentPlan}
                          onChange={(e) => setDevelopmentPlan(e.target.value)}
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
                        {section.questions.map((question: { text: string; type: 'rating' | 'text' }, questionIndex: number) => {
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

                    {evaluation.developmentPlan && (
                      <div>
                        <h3 className="font-medium text-[#27251F] mb-3">Development Plan</h3>
                        <div className="bg-[#E51636]/5 p-4 rounded-xl text-[#27251F]">
                          {evaluation.developmentPlan}
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