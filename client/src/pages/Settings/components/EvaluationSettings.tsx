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
    <Card>
      <CardHeader>
        <CardTitle>Evaluation Settings</CardTitle>
        <CardDescription>Configure evaluation schedules and requirements</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {/* Schedule Configuration */}
          <AccordionItem value="schedule">
            <AccordionTrigger>Schedule Configuration</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium">Leadership Evaluation Frequency</label>
                    <p className="text-sm text-gray-500">For team lead positions and above</p>
                  </div>
                  <Select 
                    defaultValue={settings?.evaluations?.schedule?.leadershipFrequency?.toString()}
                    onValueChange={(value) => 
                      onUpdate('schedule', { leadershipFrequency: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium">Team Member Evaluation Frequency</label>
                    <p className="text-sm text-gray-500">For regular team members</p>
                  </div>
                  <Select 
                    defaultValue={settings?.evaluations?.schedule?.teamMemberFrequency?.toString()}
                    onValueChange={(value) => 
                      onUpdate('schedule', { teamMemberFrequency: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="120">120 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium">Probation Period Reviews</label>
                    <p className="text-sm text-gray-500">More frequent reviews for new team members</p>
                  </div>
                  <Select 
                    defaultValue={settings?.evaluations?.schedule?.probationFrequency?.toString()}
                    onValueChange={(value) => 
                      onUpdate('schedule', { probationFrequency: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="45">45 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Performance Metrics */}
          <AccordionItem value="metrics">
            <AccordionTrigger>Performance Metrics</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium">Rating Scale</label>
                    <p className="text-sm text-gray-500">Choose evaluation rating scale</p>
                  </div>
                  <Select 
                    defaultValue={settings?.evaluations?.metrics?.ratingScale?.toString()}
                    onValueChange={(value) => 
                      onUpdate('metrics', { ratingScale: value })
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select scale" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-3">1-3 Scale</SelectItem>
                      <SelectItem value="1-5">1-5 Scale</SelectItem>
                      <SelectItem value="1-10">1-10 Scale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium">Role-Specific Criteria</label>
                    <p className="text-sm text-gray-500">Enable position-based evaluation criteria</p>
                  </div>
                  <Switch 
                    checked={settings?.evaluations?.metrics?.roleSpecificCriteria}
                    onCheckedChange={(checked) => 
                      onUpdate('metrics', { roleSpecificCriteria: checked })
                    }
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium">Department Benchmarks</label>
                    <p className="text-sm text-gray-500">Enable department-specific performance benchmarks</p>
                  </div>
                  <Switch 
                    checked={settings?.evaluations?.metrics?.departmentBenchmarks}
                    onCheckedChange={(checked) => 
                      onUpdate('metrics', { departmentBenchmarks: checked })
                    }
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Development Planning */}
          <AccordionItem value="development">
            <AccordionTrigger>Development Planning</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium">Required Goal Setting</label>
                    <p className="text-sm text-gray-500">Mandate development goals in evaluations</p>
                  </div>
                  <Switch 
                    checked={settings?.evaluations?.development?.requireGoals}
                    onCheckedChange={(checked) => 
                      onUpdate('development', { requireGoals: checked })
                    }
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium">Training Recommendations</label>
                    <p className="text-sm text-gray-500">Enable automatic training suggestions</p>
                  </div>
                  <Switch 
                    checked={settings?.evaluations?.development?.trainingRecommendations}
                    onCheckedChange={(checked) => 
                      onUpdate('development', { trainingRecommendations: checked })
                    }
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium">Skill Gap Analysis</label>
                    <p className="text-sm text-gray-500">Enable skill gap identification</p>
                  </div>
                  <Switch 
                    checked={settings?.evaluations?.development?.skillGapAnalysis}
                    onCheckedChange={(checked) => 
                      onUpdate('development', { skillGapAnalysis: checked })
                    }
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Approval Process */}
          <AccordionItem value="approval">
            <AccordionTrigger>Approval Process</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium">Required Approvers</label>
                    <p className="text-sm text-gray-500">Number of required approval levels</p>
                  </div>
                  <Select 
                    defaultValue={settings?.evaluations?.approval?.requiredApprovers?.toString()}
                    onValueChange={(value) => 
                      onUpdate('approval', { requiredApprovers: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select approvers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Level</SelectItem>
                      <SelectItem value="2">2 Levels</SelectItem>
                      <SelectItem value="3">3 Levels</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium">Allow Appeals</label>
                    <p className="text-sm text-gray-500">Enable evaluation appeals process</p>
                  </div>
                  <Switch 
                    checked={settings?.evaluations?.approval?.allowAppeals}
                    onCheckedChange={(checked) => 
                      onUpdate('approval', { allowAppeals: checked })
                    }
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