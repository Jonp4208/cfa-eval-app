import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { kitchenService } from '@/services/kitchenService';
import { FoodSafetyChecklist, ChecklistItem, CompletionStatus } from '@/types/kitchen';

const CompleteChecklist: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checklist, setChecklist] = useState<FoodSafetyChecklist | null>(null);
  const [completions, setCompletions] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadChecklist();
  }, [id]);

  const loadChecklist = async () => {
    try {
      if (!id) return;
      const data = await kitchenService.getChecklist(id);
      setChecklist(data);
      
      // Initialize completions object with correct defaults based on type
      const initialCompletions: Record<string, any> = {};
      data.items.forEach(item => {
        initialCompletions[item._id!] = {
          value: item.type === 'yes_no' ? '' : item.type === 'temperature' ? '' : '',
          notes: ''
        };
      });
      setCompletions(initialCompletions);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading checklist:', error);
      enqueueSnackbar('Failed to load checklist', { variant: 'error' });
      navigate('/kitchen/food-safety');
    }
  };

  const handleValueChange = (itemId: string, value: string | number) => {
    // For temperature inputs, allow empty string or valid numbers only
    if (checklist?.items.find(item => item._id === itemId)?.type === 'temperature') {
      if (value === '') {
        setCompletions(prev => ({
          ...prev,
          [itemId]: {
            ...prev[itemId],
            value: ''
          }
        }));
        return;
      }
      
      const numValue = parseFloat(value.toString());
      if (!isNaN(numValue)) {
        setCompletions(prev => ({
          ...prev,
          [itemId]: {
            ...prev[itemId],
            value: numValue
          }
        }));
      }
      return;
    }

    // For other types, handle normally
    setCompletions(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        value
      }
    }));
  };

  const handleNotesChange = (itemId: string, notes: string) => {
    setCompletions(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        notes
      }
    }));
  };

  const validateTemperature = (item: ChecklistItem, value: number): boolean => {
    if (!item.validation) return true;
    const { minTemp, maxTemp } = item.validation;
    
    if (minTemp !== undefined && maxTemp !== undefined) {
      return value >= minTemp && value <= maxTemp;
    }
    return true;
  };

  const calculateItemStatus = (item: ChecklistItem, value: any): CompletionStatus => {
    if (!value) return 'not_applicable';

    if (item.type === 'yes_no') {
      if (item.validation?.requiredValue) {
        return value === item.validation.requiredValue ? 'pass' : 'fail';
      }
      return 'pass';
    }

    if (item.type === 'temperature') {
      if (!item.validation?.minTemp || !item.validation?.maxTemp) return 'pass';
      
      const temp = parseFloat(value);
      if (isNaN(temp)) return 'fail';

      const { minTemp, maxTemp, warningThreshold = 0 } = item.validation;
      
      // Check if temperature is within critical range
      if (temp < minTemp || temp > maxTemp) {
        return 'fail';
      }
      
      // Check if temperature is within warning range
      if (warningThreshold && (
        temp <= minTemp + warningThreshold ||
        temp >= maxTemp - warningThreshold
      )) {
        return 'warning';
      }
      
      return 'pass';
    }

    if (item.type === 'text') {
      if (item.validation?.requiredPattern) {
        const pattern = new RegExp(item.validation.requiredPattern);
        return pattern.test(value) ? 'pass' : 'fail';
      }
      return value.trim() ? 'pass' : 'fail';
    }

    return 'pass';
  };

  const handleSubmit = async () => {
    try {
      if (!checklist) return;

      // Validate required fields and calculate status for each item
      const itemStatuses = checklist.items.map(item => {
        const completion = completions[item._id!];
        const status = calculateItemStatus(item, completion?.value);
        return { item, status };
      });

      // Check if any required items are missing or failed
      const failedItems = itemStatuses.filter(({ item, status }) => {
        if (!completions[item._id!]?.value) return true;
        if (item.isCritical && status === 'fail') return true;
        return false;
      });

      if (failedItems.length > 0) {
        const criticalFails = failedItems.filter(({ item }) => item.isCritical);
        if (criticalFails.length > 0) {
          enqueueSnackbar('Critical items have failed. Please check and try again.', { 
            variant: 'error',
            autoHideDuration: 5000
          });
        } else {
          enqueueSnackbar('Please complete all required items', { 
            variant: 'error',
            autoHideDuration: 5000
          });
        }
        return;
      }

      setSaving(true);
      
      // Calculate overall score
      const totalItems = itemStatuses.length;
      const passedItems = itemStatuses.filter(({ status }) => status === 'pass').length;
      const score = Math.round((passedItems / totalItems) * 100);

      // Prepare items with status
      const items = itemStatuses.map(({ item, status }) => ({
        item: item._id!,
        value: completions[item._id!].value,
        notes: completions[item._id!].notes,
        status
      }));

      // Submit completion
      await kitchenService.completeChecklist(checklist._id!, {
        items,
        notes,
        score,
        overallStatus: score >= (checklist.passingScore || 70) ? 'pass' : 'fail'
      });

      enqueueSnackbar('Checklist completed successfully', { 
        variant: 'success',
        autoHideDuration: 3000
      });
      navigate('/kitchen/food-safety');
    } catch (error) {
      console.error('Error submitting checklist:', error);
      enqueueSnackbar('Failed to submit checklist', { 
        variant: 'error',
        autoHideDuration: 5000
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  if (!checklist) return null;

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/kitchen/food-safety')}
          className="hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-[#27251F]">{checklist.name}</h1>
          <p className="text-sm sm:text-base text-[#27251F]/60 mt-1">{checklist.description}</p>
        </div>
      </div>

      <Card className="bg-white rounded-[20px]">
        <CardContent className="p-4 sm:p-8">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs sm:text-sm">
              {checklist.frequency.charAt(0).toUpperCase() + checklist.frequency.slice(1)}
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs sm:text-sm">
              Passing Score: {checklist.passingScore}%
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3 sm:space-y-4">
        {checklist.items.map((item) => (
          <Card key={item._id} className="bg-white rounded-[20px] hover:shadow-sm transition-shadow">
            <CardContent className="p-4 sm:p-8">
              <div className="flex items-start justify-between mb-4 sm:mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base sm:text-lg font-semibold text-[#27251F]">{item.name}</h3>
                    {item.isCritical && (
                      <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-200 text-xs sm:text-sm">
                        Critical
                      </Badge>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs sm:text-sm text-[#27251F]/60">{item.description}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {item.type === 'yes_no' && (
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-xs sm:text-sm font-medium text-[#27251F]">Response Required</Label>
                    <RadioGroup
                      value={completions[item._id!]?.value}
                      onValueChange={(value: string) => handleValueChange(item._id!, value)}
                      className="flex gap-4 sm:gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id={`${item._id}-yes`} className="border-[#27251F]/20" />
                        <Label htmlFor={`${item._id}-yes`} className="text-sm text-[#27251F]">Yes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="no" id={`${item._id}-no`} className="border-[#27251F]/20" />
                        <Label htmlFor={`${item._id}-no`} className="text-sm text-[#27251F]">No</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {item.type === 'temperature' && (
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-xs sm:text-sm font-medium text-[#27251F]">Temperature Reading</Label>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Input
                        type="number"
                        value={completions[item._id!]?.value}
                        onChange={(e) => handleValueChange(item._id!, e.target.value)}
                        className="w-24 sm:w-32 border-[#27251F]/20 text-sm"
                        placeholder="Enter temp"
                        min={item.validation?.minTemp}
                        max={item.validation?.maxTemp}
                      />
                      <span className="text-sm text-[#27251F]">°F</span>
                    </div>
                    {item.validation?.minTemp !== undefined && item.validation?.maxTemp !== undefined && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-[#27251F]/60">
                        <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Required range: {item.validation.minTemp}°F - {item.validation.maxTemp}°F</span>
                      </div>
                    )}
                  </div>
                )}

                {item.type === 'text' && (
                  <div className="space-y-2 sm:space-y-3">
                    <Label className="text-xs sm:text-sm font-medium text-[#27251F]">Response Required</Label>
                    <Textarea
                      value={completions[item._id!]?.value}
                      onChange={(e) => handleValueChange(item._id!, e.target.value)}
                      className="border-[#27251F]/20 text-sm"
                      placeholder="Enter your response"
                      rows={2}
                    />
                  </div>
                )}

                <div className="space-y-2 sm:space-y-3 pt-3 sm:pt-4 border-t border-[#27251F]/10">
                  <Label className="text-xs sm:text-sm font-medium text-[#27251F]">Notes (Optional)</Label>
                  <Textarea
                    value={completions[item._id!]?.notes}
                    onChange={(e) => handleNotesChange(item._id!, e.target.value)}
                    className="border-[#27251F]/20 text-sm"
                    placeholder="Add any additional notes"
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white rounded-[20px]">
        <CardContent className="p-4 sm:p-8 space-y-2 sm:space-y-3">
          <Label className="text-xs sm:text-sm font-medium text-[#27251F]">Overall Notes (Optional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="border-[#27251F]/20 text-sm"
            placeholder="Add any overall notes about the checklist completion"
            rows={3}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 sm:gap-4 pt-4">
        <Button
          variant="outline"
          onClick={() => navigate('/kitchen/food-safety')}
          className="border-[#27251F]/20 hover:bg-gray-50 text-sm h-10 px-4 sm:h-11 sm:px-6"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="bg-[#E51636] text-white hover:bg-[#DD0031] min-w-[90px] sm:min-w-[100px] text-sm h-10 px-4 sm:h-11 sm:px-6"
        >
          <Save className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
          {saving ? 'Saving...' : 'Submit'}
        </Button>
      </div>
    </div>
  );
};

export default CompleteChecklist; 