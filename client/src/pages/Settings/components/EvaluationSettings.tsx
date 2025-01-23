// File: src/pages/Settings/components/EvaluationSettings.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";

interface EvaluationSettingsProps {
  settings: any;
  onUpdate: (section: string, values: any) => void;
  updateSettings: (settings: any) => Promise<any>;
}

const EvaluationSettings = ({ settings, onUpdate, updateSettings }: EvaluationSettingsProps) => {
  const navigate = useNavigate();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // Clear validation errors when settings change
  useEffect(() => {
    if (settings?.evaluations?.scheduling?.autoSchedule === false) {
      setValidationErrors([]);
    }
  }, [settings?.evaluations?.scheduling?.autoSchedule]);

  const handleAutoScheduleChange = async (checked: boolean) => {
    setIsUpdating(true);
    setValidationErrors([]); // Clear previous validation errors
    try {
      // When enabling, include all required fields with existing values
      const schedulingSettings = checked ? {
        autoSchedule: true,
        frequency: settings?.evaluations?.scheduling?.frequency || 90,
        cycleStart: settings?.evaluations?.scheduling?.cycleStart || 'hire_date',
        transitionMode: settings?.evaluations?.scheduling?.transitionMode || 'complete_cycle'
      } : {
        autoSchedule: false
      };

      const updateData = {
        evaluations: {
          scheduling: schedulingSettings
        }
      };
      
      const response = await updateSettings(updateData);
      
      // Clear any existing validation errors on success
      setValidationErrors([]);
      
      // Update settings with response data including scheduling results
      onUpdate('evaluations', {
        ...response.evaluations,
        schedulingResults: response.schedulingResults,
        configurationIssues: response.evaluations.configurationIssues
      });
      
      // Show appropriate success message
      if (response.schedulingResults) {
        toast({
          title: 'Auto-scheduling enabled',
          description: `Successfully scheduled ${response.schedulingResults.scheduled} evaluations${
            response.schedulingResults.skipped ? ` (${response.schedulingResults.skipped} skipped)` : ''
          }.`,
          variant: 'default',
        });
      } else if (!checked) {
        toast({
          title: 'Auto-scheduling disabled',
          description: 'Automatic evaluation scheduling has been disabled.',
          variant: 'default',
        });
      }
    } catch (error: any) {
      console.error('Error updating auto-schedule setting:', error);
      
      // Handle validation errors
      if (error.response?.status === 400) {
        const issues = error.response.data.issues || [];
        setValidationErrors(issues);
        
        // Update settings with configuration issues from error response
        if (error.response.data.currentSettings) {
          onUpdate('evaluations', {
            ...error.response.data.currentSettings.evaluations,
            configurationIssues: error.response.data.configurationIssues
          });
        }
        
        // Show error toast with main message
        toast({
          title: 'Configuration Error',
          description: error.response.data.error || 'Failed to update auto-schedule setting',
          variant: 'destructive',
        });
        
        // Reset the toggle state since enabling failed
        onUpdate('scheduling', { 
          ...settings?.evaluations?.scheduling,
          autoSchedule: false 
        });
      } else {
        toast({
          title: 'Error',
          description: 'An unexpected error occurred while updating settings.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="bg-white rounded-[20px] shadow-md">
      <CardHeader>
        <CardTitle className="text-lg text-[#27251F]">Evaluation Settings</CardTitle>
        <CardDescription className="text-[#27251F]/60">Configure evaluation process and requirements</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Configuration Issues Alert */}
        {settings?.evaluations?.configurationIssues && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-[20px] overflow-hidden">
            <div className="px-6 py-4 bg-amber-100/50 border-b border-amber-200">
              <h3 className="text-amber-800 font-medium">Configuration Required</h3>
              <p className="text-sm text-amber-700 mt-1">
                The following issues need to be resolved before enabling auto-scheduling:
              </p>
            </div>
            <div className="px-6 py-4">
              {settings.evaluations.configurationIssues.unassignedEvaluators > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-800 font-medium">Employees Missing Evaluators</p>
                      <p className="text-sm text-amber-700 mt-1">
                        {settings.evaluations.configurationIssues.unassignedEvaluators} employees need evaluators assigned
                      </p>
                    </div>
                    <Button
                      onClick={() => navigate('/employees?filter=no_evaluator')}
                      className="bg-amber-100 hover:bg-amber-200 text-amber-900 border-0"
                    >
                      Assign Evaluators
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {validationErrors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800 mb-2">Please address the following issues:</p>
            <ul className="list-disc list-inside text-sm text-red-700">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        <Accordion type="single" collapsible className="w-full space-y-4">
          {/* Scheduling */}
          <AccordionItem value="scheduling" className="border-b-0">
            <AccordionTrigger className="hover:no-underline py-4 text-[#27251F]">
              <div className="flex flex-col items-start gap-1">
                <span className="font-medium">Scheduling</span>
                <span className="text-sm font-normal text-[#27251F]/60">Configure evaluation scheduling settings</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable automatic evaluation scheduling</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically schedule evaluations based on settings
                    </p>
                  </div>
                  <Switch
                    checked={settings?.evaluations?.scheduling?.autoSchedule}
                    onCheckedChange={handleAutoScheduleChange}
                    disabled={isUpdating}
                  />
                </div>

                {settings?.evaluations?.scheduling?.autoSchedule && (
                  <>
                    <div className="space-y-4">
                      <div>
                        <Label>Evaluation Frequency</Label>
                        <p className="text-sm text-muted-foreground">
                          Set default evaluation frequency
                        </p>
                        <Select
                          value={settings?.evaluations?.scheduling?.frequency?.toString()}
                          onValueChange={(value) =>
                            onUpdate('evaluations.scheduling.frequency', parseInt(value))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">Monthly</SelectItem>
                            <SelectItem value="90">Quarterly</SelectItem>
                            <SelectItem value="180">Semi-Annually</SelectItem>
                            <SelectItem value="365">Annually</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Cycle Start Date</Label>
                        <p className="text-sm text-muted-foreground">
                          When to start the evaluation cycle
                        </p>
                        <Select
                          value={settings?.evaluations?.scheduling?.cycleStart}
                          onValueChange={(value) =>
                            onUpdate('evaluations.scheduling.cycleStart', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select cycle start" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hire_date">Employee Start Date</SelectItem>
                            <SelectItem value="last_evaluation">Last Evaluation</SelectItem>
                            <SelectItem value="calendar_year">Calendar Year</SelectItem>
                            <SelectItem value="fiscal_year">Fiscal Year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Transition Handling</Label>
                        <p className="text-sm text-muted-foreground">
                          How to handle existing evaluation cycles
                        </p>
                        <Select
                          value={settings?.evaluations?.scheduling?.transitionMode}
                          onValueChange={(value) =>
                            onUpdate('evaluations.scheduling.transitionMode', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select transition mode" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="complete_cycle">Complete Current Cycle</SelectItem>
                            <SelectItem value="immediate">Start New Cycle Immediately</SelectItem>
                            <SelectItem value="next_period">Start Next Period</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Add Scheduling Summary */}
                      <div className="mt-6 p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Scheduling Summary</h4>
                        {settings?.evaluations?.scheduling?.autoSchedule && (
                          <div className="space-y-2">
                            <p className="text-sm">
                              Total Employees: {settings?.evaluations?.configurationIssues?.totalEmployees || 0}
                            </p>
                            <p className="text-sm">
                              Ready for Scheduling: {(settings?.evaluations?.configurationIssues?.totalEmployees || 0) - 
                                (settings?.evaluations?.configurationIssues?.unassignedEvaluators || 0)}
                            </p>
                            {settings?.evaluations?.configurationIssues?.unassignedEvaluators > 0 && (
                              <p className="text-sm text-yellow-600">
                                Skipped (No Evaluator): {settings.evaluations.configurationIssues.unassignedEvaluators}
                              </p>
                            )}
                            {settings?.evaluations?.schedulingResults ? (
                              <>
                                <p className="text-sm text-green-600">
                                  Successfully Scheduled: {settings.evaluations.schedulingResults.scheduled || 0}
                                </p>
                                {settings.evaluations.schedulingResults.errors > 0 && (
                                  <p className="text-sm text-red-600">
                                    Failed to Schedule: {settings.evaluations.schedulingResults.errors}
                                  </p>
                                )}
                              </>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                No evaluations currently scheduled
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Review Process */}
          <AccordionItem value="review" className="border-b-0">
            <AccordionTrigger className="hover:no-underline py-4 text-[#27251F]">
              <div className="flex flex-col items-start gap-1">
                <span className="font-medium">Review Process</span>
                <span className="text-sm font-normal text-[#27251F]/60">Configure review process settings</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Self-Evaluation Required</label>
                    <p className="text-sm text-[#27251F]/60">Require employee self-evaluation</p>
                  </div>
                  <Switch 
                    checked={settings?.evaluations?.review?.requireSelfEvaluation}
                    onCheckedChange={(checked) => 
                      onUpdate('review', { requireSelfEvaluation: checked })
                    }
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Review Session Required</label>
                    <p className="text-sm text-[#27251F]/60">Require in-person review session</p>
                  </div>
                  <Switch 
                    checked={settings?.evaluations?.review?.requireReviewSession}
                    onCheckedChange={(checked) => 
                      onUpdate('review', { requireReviewSession: checked })
                    }
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Performance Metrics */}
          <AccordionItem value="metrics" className="border-b-0">
            <AccordionTrigger className="hover:no-underline py-4 text-[#27251F]">
              <div className="flex flex-col items-start gap-1">
                <span className="font-medium">Performance Metrics</span>
                <span className="text-sm font-normal text-[#27251F]/60">Configure performance measurement settings</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Role-Specific Criteria</label>
                    <p className="text-sm text-[#27251F]/60">Enable position-based evaluation criteria</p>
                  </div>
                  <Switch 
                    checked={settings?.evaluations?.metrics?.roleSpecificCriteria}
                    onCheckedChange={(checked) => 
                      onUpdate('metrics', { roleSpecificCriteria: checked })
                    }
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Department Benchmarks</label>
                    <p className="text-sm text-[#27251F]/60">Enable department-specific performance benchmarks</p>
                  </div>
                  <Switch 
                    checked={settings?.evaluations?.metrics?.departmentBenchmarks}
                    onCheckedChange={(checked) => 
                      onUpdate('metrics', { departmentBenchmarks: checked })
                    }
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Development Planning */}
          <AccordionItem value="development" className="border-b-0">
            <AccordionTrigger className="hover:no-underline py-4 text-[#27251F]">
              <div className="flex flex-col items-start gap-1">
                <span className="font-medium">Development Planning</span>
                <span className="text-sm font-normal text-[#27251F]/60">Configure development and training settings</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Required Goal Setting</label>
                    <p className="text-sm text-[#27251F]/60">Mandate development goals in evaluations</p>
                  </div>
                  <Switch 
                    checked={settings?.evaluations?.development?.requireGoals}
                    onCheckedChange={(checked) => 
                      onUpdate('development', { requireGoals: checked })
                    }
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Training Recommendations</label>
                    <p className="text-sm text-[#27251F]/60">Enable automatic training suggestions</p>
                  </div>
                  <Switch 
                    checked={settings?.evaluations?.development?.trainingRecommendations}
                    onCheckedChange={(checked) => 
                      onUpdate('development', { trainingRecommendations: checked })
                    }
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Skill Gap Analysis</label>
                    <p className="text-sm text-[#27251F]/60">Enable skill gap identification</p>
                  </div>
                  <Switch 
                    checked={settings?.evaluations?.development?.skillGapAnalysis}
                    onCheckedChange={(checked) => 
                      onUpdate('development', { skillGapAnalysis: checked })
                    }
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default EvaluationSettings;