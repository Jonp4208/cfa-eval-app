// File: src/pages/Settings/components/EvaluationSettings.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface EvaluationSettingsProps {
  settings: any;
  onUpdate: (section: string, settings: any) => void;
  isUpdating: boolean;
}

const EvaluationSettings = ({ settings, onUpdate, isUpdating }: EvaluationSettingsProps) => {
  return (
    <Card className="bg-white rounded-[20px] shadow-md">
      <CardHeader>
        <CardTitle className="text-lg text-[#27251F]">Evaluation Settings</CardTitle>
        <CardDescription className="text-[#27251F]/60">Configure evaluation process and requirements</CardDescription>
      </CardHeader>
      <CardContent>
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
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Automatic Scheduling</label>
                    <p className="text-sm text-[#27251F]/60">Enable automatic evaluation scheduling</p>
                  </div>
                  <Switch 
                    checked={settings?.evaluations?.scheduling?.autoSchedule}
                    onCheckedChange={(checked) => 
                      onUpdate('scheduling', { autoSchedule: checked })
                    }
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>

                {settings?.evaluations?.scheduling?.autoSchedule && (
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-sm font-medium text-[#27251F]">Transition Handling</label>
                      <p className="text-sm text-[#27251F]/60">How to handle existing evaluation cycles</p>
                    </div>
                    <Select 
                      defaultValue={settings?.evaluations?.scheduling?.transitionMode}
                      onValueChange={(value) => 
                        onUpdate('scheduling', { transitionMode: value })
                      }
                    >
                      <SelectTrigger className="w-[180px] h-12 rounded-xl border-gray-200">
                        <SelectValue placeholder="Select handling" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Start Next Period</SelectItem>
                        <SelectItem value="complete_cycle">Complete Current Cycle</SelectItem>
                        <SelectItem value="align_next">Align to Next Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Evaluation Frequency</label>
                    <p className="text-sm text-[#27251F]/60">Set default evaluation frequency</p>
                  </div>
                  <Select 
                    defaultValue={settings?.evaluations?.scheduling?.frequency?.toString()}
                    onValueChange={(value) => 
                      onUpdate('scheduling', { frequency: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="w-[180px] h-12 rounded-xl border-gray-200">
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

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Cycle Start Date</label>
                    <p className="text-sm text-[#27251F]/60">When to start the evaluation cycle</p>
                  </div>
                  <Select 
                    defaultValue={settings?.evaluations?.scheduling?.cycleStart}
                    onValueChange={(value) => 
                      onUpdate('scheduling', { cycleStart: value })
                    }
                  >
                    <SelectTrigger className="w-[180px] h-12 rounded-xl border-gray-200">
                      <SelectValue placeholder="Select start date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hire_date">Employee Start Date</SelectItem>
                      <SelectItem value="last_evaluation">Last Evaluation Date</SelectItem>
                      <SelectItem value="calendar_year">Calendar Year (Jan 1)</SelectItem>
                      <SelectItem value="fiscal_year">Fiscal Year (Oct 1)</SelectItem>
                      <SelectItem value="custom">Custom Date</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {settings?.evaluations?.scheduling?.cycleStart === 'custom' && (
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-sm font-medium text-[#27251F]">Custom Start Date</label>
                      <p className="text-sm text-[#27251F]/60">Set specific date to start cycle</p>
                    </div>
                    <Input 
                      type="date"
                      value={settings?.evaluations?.scheduling?.customStartDate}
                      onChange={(e) => 
                        onUpdate('scheduling', { customStartDate: e.target.value })
                      }
                      className="w-[180px] h-12 rounded-xl border-gray-200"
                    />
                  </div>
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