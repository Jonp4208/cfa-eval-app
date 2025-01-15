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
        text: string;
        type: 'rating' | 'text';
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

  // Fetch evaluation data
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
      (total, section) => total + section.questions.length,
      0
    );
    const answeredQuestions = Object.keys(answers).length;
    return Math.round((answeredQuestions / totalQuestions) * 100);
  };

  // Validate answers
  const validateAnswers = () => {
    const errors: string[] = [];
    evaluation?.template.sections.forEach((section, sectionIndex) => {
      section.questions.forEach((question, questionIndex) => {
        const answer = answers[`${sectionIndex}-${questionIndex}`];
        if (!answer || answer.trim() === '') {
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
        {/* Back button and title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="h-10 px-0 text-[#27251F]/60 hover:text-[#27251F] hover:bg-transparent -ml-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              Back to Evaluations
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[#27251F]">{evaluation.template.name}</h1>
              <p className="text-[#27251F]/60 text-base">Evaluation for {evaluation.employee.name}</p>
            </div>
          </div>
          {isManager && evaluation.status === 'pending_manager_review' && (
            <Button 
              onClick={() => setShowScheduleReview(true)}
              className="bg-[#E51636] text-white hover:bg-[#E51636]/90 h-12 px-6 rounded-2xl flex items-center gap-2 text-base font-medium w-full sm:w-auto justify-center"
            >
              Schedule Review Session
            </Button>
          )}
        </div>

        {/* Main Content */}
        <Card className="bg-white rounded-[20px] shadow-md">
          <CardContent className="p-6">
            {/* Status and Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-[#27251F]/60 mb-1">Employee</h3>
                  <p className="text-[#27251F]">{evaluation.employee.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#27251F]/60 mb-1">Position</h3>
                  <p className="text-[#27251F]">{evaluation.employee.position}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-[#27251F]/60 mb-1">Status</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    evaluation.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : evaluation.status === 'in_review_session'
                      ? 'bg-purple-100 text-purple-800'
                      : evaluation.status === 'pending_manager_review'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {evaluation.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[#27251F]/60 mb-1">Scheduled Date</h3>
                  <p className="text-[#27251F]">{new Date(evaluation.scheduledDate).toLocaleDateString()}</p>
                </div>
                {evaluation.reviewSessionDate && (
                  <div>
                    <h3 className="text-sm font-medium text-[#27251F]/60 mb-1">Review Session Date</h3>
                    <p className="text-[#27251F]">{new Date(evaluation.reviewSessionDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Schedule Review Session Modal */}
            {showScheduleReview && (
              <Card className="mb-6 border border-[#E51636]/20">
                <CardHeader>
                  <CardTitle className="text-lg text-[#27251F]">Schedule Review Session</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[#27251F]/60 mb-1">
                        Select Date and Time for Review Session
                      </label>
                      <input
                        type="datetime-local"
                        value={reviewSessionDate}
                        onChange={(e) => setReviewSessionDate(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E51636] focus:border-transparent"
                        min={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                    <div className="flex justify-end gap-3">
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
              <Card className="mb-6 border border-[#E51636]/20">
                <CardHeader>
                  <CardTitle className="text-lg text-[#27251F]">Employee Self-Evaluation</CardTitle>
                </CardHeader>
                <CardContent>
                  {evaluation.template.sections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="mb-6">
                      <h3 className="font-medium text-[#27251F] mb-3">{section.title}</h3>
                      {section.questions.map((question, questionIndex) => (
                        <div key={questionIndex} className="mb-4">
                          <p className="text-sm text-[#27251F]/60 mb-2">{question.text}</p>
                          <p className="bg-[#27251F]/5 p-4 rounded-xl text-[#27251F]">
                            {evaluation.selfEvaluation[`${sectionIndex}-${questionIndex}`]}
                          </p>
                        </div>
                      ))}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Manager Review Session Notice */}
            {isManager && evaluation.status === 'pending_manager_review' && !showScheduleReview && (
              <Card className="mb-6 bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <p className="text-center text-yellow-800">
                    Please schedule a review session with the employee to complete the evaluation together.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Current evaluation form */}
            {canEdit && (
              <>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-[#27251F]">Completion Progress</h3>
                    <span className="text-sm text-[#27251F]/60">{calculateProgress()}%</span>
                  </div>
                  <Progress value={calculateProgress()} className="h-2 bg-[#27251F]/10" indicatorClassName="bg-[#E51636]" />
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

                  {evaluation.template.sections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="mb-8">
                      <h3 className="font-medium text-[#27251F] mb-4">{section.title}</h3>
                      {section.questions.map((question, questionIndex) => (
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-medium text-[#27251F] mb-4">Self-Evaluation</h3>
                    <ScrollArea className="h-[600px] rounded-xl border border-gray-200 p-6">
                      {evaluation.template.sections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="mb-8">
                          <h4 className="font-medium text-[#27251F] mb-4">{section.title}</h4>
                          {section.questions.map((question, questionIndex) => (
                            <div key={questionIndex} className="mb-6">
                              <p className="text-sm text-[#27251F]/60 mb-2">{question.text}</p>
                              <p className="bg-[#27251F]/5 p-4 rounded-xl text-[#27251F]">
                                {evaluation.selfEvaluation[`${sectionIndex}-${questionIndex}`]}
                              </p>
                            </div>
                          ))}
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#27251F] mb-4">Manager's Evaluation</h3>
                    <ScrollArea className="h-[600px] rounded-xl border border-gray-200 p-6">
                      {evaluation.template.sections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="mb-8">
                          <h4 className="font-medium text-[#27251F] mb-4">{section.title}</h4>
                          {section.questions.map((question, questionIndex) => (
                            <div key={questionIndex} className="mb-6">
                              <p className="text-sm text-[#27251F]/60 mb-2">{question.text}</p>
                              <p className="bg-[#27251F]/5 p-4 rounded-xl text-[#27251F]">
                                {evaluation.managerEvaluation[`${sectionIndex}-${questionIndex}`]}
                              </p>
                            </div>
                          ))}
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </div>

                {evaluation.overallComments && (
                  <div>
                    <h3 className="font-medium text-[#27251F] mb-3">Overall Comments</h3>
                    <p className="bg-[#27251F]/5 p-4 rounded-xl text-[#27251F]">{evaluation.overallComments}</p>
                  </div>
                )}

                {evaluation.developmentPlan && (
                  <div>
                    <h3 className="font-medium text-[#27251F] mb-3">Development Plan</h3>
                    <p className="bg-[#27251F]/5 p-4 rounded-xl text-[#27251F]">{evaluation.developmentPlan}</p>
                  </div>
                )}

                {/* Acknowledgement button for employee */}
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