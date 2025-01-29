import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { kitchenService } from '@/services/kitchenService';
import { FoodSafetyChecklist, FoodSafetyChecklistCompletion } from '@/types/kitchen';

const ViewCompletion: React.FC = () => {
  const { id, completionId } = useParams<{ id: string; completionId: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState<FoodSafetyChecklist | null>(null);
  const [completion, setCompletion] = useState<FoodSafetyChecklistCompletion | null>(null);

  useEffect(() => {
    loadData();
  }, [id, completionId]);

  const loadData = async () => {
    try {
      if (!id) return;
      const [checklistData, completionsData] = await Promise.all([
        kitchenService.getChecklist(id),
        kitchenService.getChecklistCompletions(id)
      ]);
      setChecklist(checklistData);
      const foundCompletion = completionsData.find(c => c._id === completionId);
      if (!foundCompletion) {
        throw new Error('Completion not found');
      }
      setCompletion(foundCompletion);
      setLoading(false);
    } catch (error) {
      console.error('Error loading completion:', error);
      enqueueSnackbar('Failed to load completion', { variant: 'error' });
      navigate('/kitchen/food-safety');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pass':
        return 'bg-green-100 text-green-700';
      case 'fail':
        return 'bg-red-100 text-red-700';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-green-700" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-700" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-700" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  if (!checklist || !completion) return null;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/kitchen/food-safety')}
          className="hover:bg-gray-100"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#27251F]">{checklist.name}</h1>
          <p className="text-[#27251F]/60 mt-1">Completed Checklist</p>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-white rounded-[20px]">
        <CardContent className="p-6 sm:p-8">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {checklist.frequency.charAt(0).toUpperCase() + checklist.frequency.slice(1)}
                </Badge>
                <Badge variant="secondary" className={getStatusColor(completion.overallStatus)}>
                  {completion.overallStatus.toUpperCase()}
                </Badge>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-sm text-[#27251F]/60">
                  Completed on {new Date(completion.completedAt).toLocaleString()}
                </p>
                <p className="text-sm text-[#27251F]/60">
                  By: {typeof completion.completedBy === 'string' ? completion.completedBy : completion.completedBy.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {getStatusIcon(completion.overallStatus)}
                <span className="text-xl font-semibold text-[#27251F]">{completion.score}%</span>
              </div>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    completion.overallStatus.toLowerCase() === 'pass' 
                      ? 'bg-green-500' 
                      : completion.overallStatus.toLowerCase() === 'fail'
                      ? 'bg-red-500'
                      : 'bg-yellow-500'
                  }`}
                  style={{ width: `${completion.score}%` }} 
                />
              </div>
              <span className="text-sm text-[#27251F]/60">
                Passing: {checklist.passingScore || 70}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {completion.items.map((completedItem) => {
          const item = checklist.items.find(i => i._id === completedItem.item);
          if (!item) return null;

          return (
            <Card key={completedItem.item} className="bg-white rounded-[20px]">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-[#27251F]">{item.name}</h3>
                      {item.isCritical && (
                        <Badge variant="destructive" className="bg-red-100 text-red-700">
                          Critical
                        </Badge>
                      )}
                      <Badge variant="secondary" className={getStatusColor(completedItem.status)}>
                        {completedItem.status.toUpperCase()}
                      </Badge>
                    </div>
                    {item.description && (
                      <p className="text-[#27251F]/60 text-sm mb-4">{item.description}</p>
                    )}
                  </div>
                  <div className="shrink-0 ml-4">
                    {getStatusIcon(completedItem.status)}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-[#27251F] mb-1">Response</div>
                    <div className="text-[#27251F] flex items-center gap-2">
                      {item.type === 'temperature' ? (
                        <>
                          <span className="text-lg font-semibold">{completedItem.value}°F</span>
                          {item.validation && (
                            <span className="text-sm text-[#27251F]/60">
                              (Required: {item.validation.minTemp}°F - {item.validation.maxTemp}°F
                              {item.validation.warningThreshold && ` | Warning: ±${item.validation.warningThreshold}°F`})
                            </span>
                          )}
                        </>
                      ) : item.type === 'yes_no' ? (
                        <>
                          <span className="text-lg font-semibold">{completedItem.value}</span>
                          {item.validation?.requiredValue && (
                            <span className="text-sm text-[#27251F]/60">
                              (Required: {item.validation.requiredValue})
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="text-lg">{completedItem.value}</span>
                          {item.validation?.requiredPattern && (
                            <span className="text-sm text-[#27251F]/60">
                              (Pattern: {item.validation.requiredPattern})
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {completedItem.notes && (
                    <div>
                      <div className="text-sm font-medium text-[#27251F] mb-1">Notes</div>
                      <div className="text-[#27251F]/80 bg-gray-50 p-3 rounded-lg">
                        {completedItem.notes}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {completion.notes && (
        <Card className="bg-white rounded-[20px]">
          <CardContent className="p-6 sm:p-8">
            <div className="text-sm font-medium text-[#27251F] mb-2">Overall Notes</div>
            <div className="text-[#27251F]/80 bg-gray-50 p-4 rounded-lg">
              {completion.notes}
            </div>
          </CardContent>
        </Card>
      )}

      {completion.reviewedBy && (
        <Card className="bg-white rounded-[20px] border-t-4 border-blue-500">
          <CardContent className="p-6 sm:p-8">
            <div className="text-sm font-medium text-[#27251F] mb-2">Review Notes</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-[#27251F]/60">
                <p>Reviewed by: {typeof completion.reviewedBy === 'string' ? completion.reviewedBy : completion.reviewedBy.name}</p>
                <p>on {new Date(completion.reviewedAt!).toLocaleString()}</p>
              </div>
              {completion.reviewNotes && (
                <div className="text-[#27251F]/80 bg-gray-50 p-4 rounded-lg mt-4">
                  {completion.reviewNotes}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ViewCompletion; 