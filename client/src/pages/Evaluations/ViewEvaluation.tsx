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
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{evaluation.template.name} - {evaluation.employee.name}</span>
            {isManager && evaluation.status === 'pending_manager_review' && (
              <Button 
                onClick={() => setShowScheduleReview(true)}
                variant="default"
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Schedule Review Session
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
            <p><strong>Employee:</strong> {evaluation.employee.name}</p>
            <p><strong>Position:</strong> {evaluation.employee.position}</p>
            <p><strong>Status:</strong> {evaluation.status.replace(/_/g, ' ').toUpperCase()}</p>
            <p><strong>Scheduled Date:</strong> {new Date(evaluation.scheduledDate).toLocaleDateString()}</p>
            {evaluation.reviewSessionDate && (
              <p><strong>Review Session Date:</strong> {new Date(evaluation.reviewSessionDate).toLocaleDateString()}</p>
            )}
          </div>

          {/* Schedule Review Session Modal */}
          {showScheduleReview && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Schedule Review Session</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Date and Time for Review Session
                    </label>
                    <input
                      type="datetime-local"
                      value={reviewSessionDate}
                      onChange={(e) => setReviewSessionDate(e.target.value)}
                      className="w-full p-2 border rounded-md"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowScheduleReview(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => scheduleReviewSession.mutate()}
                      disabled={!reviewSessionDate || scheduleReviewSession.isPending}
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
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Employee Self-Evaluation</CardTitle>
              </CardHeader>
              <CardContent>
                {evaluation.template.sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="mb-6">
                    <h3 className="font-medium mb-2">{section.title}</h3>
                    {section.questions.map((question, questionIndex) => (
                      <div key={questionIndex} className="mb-4">
                        <p className="text-sm text-gray-600 mb-1">{question.text}</p>
                        <p className="bg-gray-50 p-2 rounded">
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
            <Card className="mb-6 bg-yellow-50">
              <CardContent className="py-4">
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
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Completion Progress</h3>
                  <span className="text-sm text-gray-500">{calculateProgress()}%</span>
                </div>
                <Progress value={calculateProgress()} className="h-2" />
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                if (validateAnswers()) {
                  setShowConfirmSubmit(true);
                }
              }}>
                {validationErrors.length > 0 && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                    <h4 className="text-red-800 font-medium mb-2">Please complete the following questions:</h4>
                    <ul className="list-disc list-inside text-sm text-red-600">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {evaluation.template.sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="mb-6">
                    <h3 className="font-medium mb-2">{section.title}</h3>
                    {section.questions.map((question, questionIndex) => (
                      <div key={questionIndex} className="mb-4">
                        <label className="block text-sm text-gray-600 mb-1">
                          {question.text}
                        </label>
                        {question.type === 'rating' ? (
                          <select
                            value={answers[`${sectionIndex}-${questionIndex}`] || ''}
                            onChange={(e) => handleAnswerChange(sectionIndex, questionIndex, e.target.value)}
                            className="w-full p-2 border rounded-md"
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
                            className="w-full p-2 border rounded-md"
                            rows={3}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ))}

                {/* Manager-only fields */}
                {isManager && evaluation.status === 'in_review_session' && (
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Overall Comments
                      </label>
                      <textarea
                        value={overallComments}
                        onChange={(e) => setOverallComments(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Development Plan
                      </label>
                      <textarea
                        value={developmentPlan}
                        onChange={(e) => setDevelopmentPlan(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => saveDraft.mutate()}
                    disabled={saveDraft.isPending}
                  >
                    {saveDraft.isPending ? 'Saving...' : 'Save Draft'}
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    className="bg-red-600 text-white hover:bg-red-700"
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
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Submission</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to submit this evaluation? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        if (isEmployee) {
                          submitSelfEvaluation.mutate();
                        } else if (isManager) {
                          completeManagerEvaluation.mutate();
                        }
                        setShowConfirmSubmit(false);
                      }}
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
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-4">Self-Evaluation</h3>
                  <ScrollArea className="h-[600px] rounded-md border p-4">
                    {evaluation.template.sections.map((section, sectionIndex) => (
                      <div key={sectionIndex} className="mb-6">
                        <h4 className="text-sm font-medium mb-2">{section.title}</h4>
                        {section.questions.map((question, questionIndex) => (
                          <div key={questionIndex} className="mb-4">
                            <p className="text-sm text-gray-600 mb-1">{question.text}</p>
                            <p className="bg-gray-50 p-2 rounded">
                              {evaluation.selfEvaluation[`${sectionIndex}-${questionIndex}`]}
                            </p>
                          </div>
                        ))}
                      </div>
                    ))}
                  </ScrollArea>
                </div>
                <div>
                  <h3 className="font-medium mb-4">Manager's Evaluation</h3>
                  <ScrollArea className="h-[600px] rounded-md border p-4">
                    {evaluation.template.sections.map((section, sectionIndex) => (
                      <div key={sectionIndex} className="mb-6">
                        <h4 className="text-sm font-medium mb-2">{section.title}</h4>
                        {section.questions.map((question, questionIndex) => (
                          <div key={questionIndex} className="mb-4">
                            <p className="text-sm text-gray-600 mb-1">{question.text}</p>
                            <p className="bg-gray-50 p-2 rounded">
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
                  <h3 className="font-medium mb-2">Overall Comments</h3>
                  <p className="bg-gray-50 p-2 rounded">{evaluation.overallComments}</p>
                </div>
              )}

              {evaluation.developmentPlan && (
                <div>
                  <h3 className="font-medium mb-2">Development Plan</h3>
                  <p className="bg-gray-50 p-2 rounded">{evaluation.developmentPlan}</p>
                </div>
              )}

              {/* Acknowledgement button for employee */}
              {isEmployee && !evaluation.acknowledgement?.acknowledged && (
                <div className="flex justify-end">
                  <Button
                    onClick={() => acknowledgeEvaluation.mutate()}
                    disabled={acknowledgeEvaluation.isPending}
                  >
                    {acknowledgeEvaluation.isPending ? 'Acknowledging...' : 'Acknowledge Evaluation'}
                  </Button>
                </div>
              )}

              {/* Show acknowledgement status */}
              {evaluation.acknowledgement?.acknowledged && (
                <div className="text-sm text-gray-500">
                  Acknowledged by {evaluation.employee.name} on{' '}
                  {new Date(evaluation.acknowledgement.date).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 