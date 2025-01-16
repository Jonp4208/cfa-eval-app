// File: src/pages/Settings/components/UserAccessSettings.tsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface UserAccessSettingsProps {
  settings: any;
  onUpdate: (section: string, settings: any) => void;
  isUpdating: boolean;
}

const UserAccessSettings = ({ settings, onUpdate, isUpdating }: UserAccessSettingsProps) => {
  return (
    <Card className="bg-white rounded-[20px] shadow-md">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg text-[#27251F]">User Access Settings</CardTitle>
            <CardDescription className="text-[#27251F]/60">Customize security and access control settings for your store</CardDescription>
          </div>
          <Button 
            variant="outline" 
            className="h-9 px-4 border-[#E51636] text-[#E51636] hover:bg-[#E51636] hover:text-white"
            onClick={() => onUpdate('resetToDefault', true)}
            disabled={isUpdating}
          >
            Reset to Default
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-4 bg-[#FEF3F2] rounded-lg border border-[#FEE4E2]">
          <p className="text-sm text-[#B42318]">
            Note: These settings override the default access levels. Changes will affect how team members can interact with evaluations and disciplinary actions.
          </p>
        </div>
        <Accordion type="single" collapsible className="w-full space-y-4">
          {/* Password Policy */}
          <AccordionItem value="password" className="border-b-0">
            <AccordionTrigger className="hover:no-underline py-4 text-[#27251F]">
              <div className="flex flex-col items-start gap-1">
                <span className="font-medium">Password Policy</span>
                <span className="text-sm font-normal text-[#27251F]/60">Configure password requirements</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Minimum Password Length</label>
                    <p className="text-sm text-[#27251F]/60">Set minimum characters required</p>
                  </div>
                  <Select 
                    defaultValue={settings?.userAccess?.passwordPolicy?.minLength?.toString()}
                    onValueChange={(value) => 
                      onUpdate('passwordPolicy', { minLength: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="w-[180px] h-12 rounded-xl border-gray-200">
                      <SelectValue placeholder="Select length" />
                    </SelectTrigger>
                    <SelectContent>
                      {[8, 10, 12, 14, 16].map((length) => (
                        <SelectItem key={length} value={length.toString()}>
                          {length} characters
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Require Numbers</label>
                    <p className="text-sm text-[#27251F]/60">Must include at least one number</p>
                  </div>
                  <Switch 
                    checked={settings?.userAccess?.passwordPolicy?.requireNumbers}
                    onCheckedChange={(checked) => 
                      onUpdate('passwordPolicy', { requireNumbers: checked })
                    }
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Require Special Characters</label>
                    <p className="text-sm text-[#27251F]/60">Must include special characters</p>
                  </div>
                  <Switch 
                    checked={settings?.userAccess?.passwordPolicy?.requireSpecialChars}
                    onCheckedChange={(checked) => 
                      onUpdate('passwordPolicy', { requireSpecialChars: checked })
                    }
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Account Security */}
          <AccordionItem value="security" className="border-b-0">
            <AccordionTrigger className="hover:no-underline py-4 text-[#27251F]">
              <div className="flex flex-col items-start gap-1">
                <span className="font-medium">Account Security</span>
                <span className="text-sm font-normal text-[#27251F]/60">Configure account security settings</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Session Timeout</label>
                    <p className="text-sm text-[#27251F]/60">Auto logout after inactivity</p>
                  </div>
                  <Select 
                    defaultValue={settings?.userAccess?.accountSecurity?.sessionTimeout?.toString()}
                    onValueChange={(value) => 
                      onUpdate('accountSecurity', { sessionTimeout: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="w-[180px] h-12 rounded-xl border-gray-200">
                      <SelectValue placeholder="Select timeout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Maximum Login Attempts</label>
                    <p className="text-sm text-[#27251F]/60">Before account lockout</p>
                  </div>
                  <Select 
                    defaultValue={settings?.userAccess?.accountSecurity?.maxLoginAttempts?.toString()}
                    onValueChange={(value) => 
                      onUpdate('accountSecurity', { maxLoginAttempts: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="w-[180px] h-12 rounded-xl border-gray-200">
                      <SelectValue placeholder="Select attempts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 attempts</SelectItem>
                      <SelectItem value="5">5 attempts</SelectItem>
                      <SelectItem value="10">10 attempts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Role Management */}
          <AccordionItem value="roles" className="border-b-0">
            <AccordionTrigger className="hover:no-underline py-4 text-[#27251F]">
              <div className="flex flex-col items-start gap-1">
                <span className="font-medium">Access Levels</span>
                <span className="text-sm font-normal text-[#27251F]/60">Configure role-based permissions</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Store Director Access</label>
                    <p className="text-sm text-[#27251F]/60">Full access to all features and settings</p>
                  </div>
                  <Switch 
                    checked={settings?.userAccess?.roleManagement?.storeDirectorAccess}
                    onCheckedChange={(checked) => 
                      onUpdate('roleManagement', { storeDirectorAccess: checked })
                    }
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Kitchen Director Access</label>
                    <p className="text-sm text-[#27251F]/60">Can manage all BOH operations and evaluations</p>
                  </div>
                  <Switch 
                    checked={settings?.userAccess?.roleManagement?.kitchenDirectorAccess}
                    onCheckedChange={(checked) => 
                      onUpdate('roleManagement', { kitchenDirectorAccess: checked })
                    }
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Service Director Access</label>
                    <p className="text-sm text-[#27251F]/60">Can manage all FOH operations and evaluations</p>
                  </div>
                  <Switch 
                    checked={settings?.userAccess?.roleManagement?.serviceDirectorAccess}
                    onCheckedChange={(checked) => 
                      onUpdate('roleManagement', { serviceDirectorAccess: checked })
                    }
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Store Leader Access</label>
                    <p className="text-sm text-[#27251F]/60">Can manage evaluations and disciplinary actions</p>
                  </div>
                  <Switch 
                    checked={settings?.userAccess?.roleManagement?.storeLeaderAccess}
                    onCheckedChange={(checked) => 
                      onUpdate('roleManagement', { storeLeaderAccess: checked })
                    }
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Training Leader Access</label>
                    <p className="text-sm text-[#27251F]/60">Can manage training evaluations and certifications</p>
                  </div>
                  <Switch 
                    checked={settings?.userAccess?.roleManagement?.trainingLeaderAccess}
                    onCheckedChange={(checked) => 
                      onUpdate('roleManagement', { trainingLeaderAccess: checked })
                    }
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Shift Leader Access</label>
                    <p className="text-sm text-[#27251F]/60">Can create evaluations during their shifts</p>
                  </div>
                  <Switch 
                    checked={settings?.userAccess?.roleManagement?.shiftLeaderAccess}
                    onCheckedChange={(checked) => 
                      onUpdate('roleManagement', { shiftLeaderAccess: checked })
                    }
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Front of House Team Leader</label>
                    <p className="text-sm text-[#27251F]/60">Can manage FOH team evaluations</p>
                  </div>
                  <Switch 
                    checked={settings?.userAccess?.roleManagement?.fohLeaderAccess}
                    onCheckedChange={(checked) => 
                      onUpdate('roleManagement', { fohLeaderAccess: checked })
                    }
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Back of House Team Leader</label>
                    <p className="text-sm text-[#27251F]/60">Can manage BOH team evaluations</p>
                  </div>
                  <Switch 
                    checked={settings?.userAccess?.roleManagement?.bohLeaderAccess}
                    onCheckedChange={(checked) => 
                      onUpdate('roleManagement', { bohLeaderAccess: checked })
                    }
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Drive-Thru Team Leader</label>
                    <p className="text-sm text-[#27251F]/60">Can manage DT team evaluations</p>
                  </div>
                  <Switch 
                    checked={settings?.userAccess?.roleManagement?.dtLeaderAccess}
                    onCheckedChange={(checked) => 
                      onUpdate('roleManagement', { dtLeaderAccess: checked })
                    }
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Evaluation Access */}
          <AccordionItem value="evaluation" className="border-b-0">
            <AccordionTrigger className="hover:no-underline py-4 text-[#27251F]">
              <div className="flex flex-col items-start gap-1">
                <span className="font-medium">Evaluation Access</span>
                <span className="text-sm font-normal text-[#27251F]/60">Configure evaluation and disciplinary action permissions</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Team Leader Evaluation Access</label>
                    <p className="text-sm text-[#27251F]/60">Team leaders can only evaluate their department</p>
                  </div>
                  <Switch 
                    checked={settings?.userAccess?.evaluation?.departmentRestriction}
                    onCheckedChange={(checked) => 
                      onUpdate('evaluation', { departmentRestriction: checked })
                    }
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Store Leader Review</label>
                    <p className="text-sm text-[#27251F]/60">Require Store Leader review of evaluations</p>
                  </div>
                  <Switch 
                    checked={settings?.userAccess?.evaluation?.requireStoreLeaderReview}
                    onCheckedChange={(checked) => 
                      onUpdate('evaluation', { requireStoreLeaderReview: checked })
                    }
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Director Approval</label>
                    <p className="text-sm text-[#27251F]/60">Require Store Director approval for disciplinary actions</p>
                  </div>
                  <Switch 
                    checked={settings?.userAccess?.evaluation?.requireDirectorApproval}
                    onCheckedChange={(checked) => 
                      onUpdate('evaluation', { requireDirectorApproval: checked })
                    }
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Evaluation Workflow</label>
                    <p className="text-sm text-[#27251F]/60">Select evaluation approval process</p>
                  </div>
                  <Select 
                    defaultValue={settings?.userAccess?.evaluation?.workflowType}
                    onValueChange={(value) => 
                      onUpdate('evaluation', { workflowType: value })
                    }
                  >
                    <SelectTrigger className="w-[180px] h-12 rounded-xl border-gray-200">
                      <SelectValue placeholder="Select workflow" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simple">Team Leader → Store Leader</SelectItem>
                      <SelectItem value="standard">Team Leader → Store Leader → Director</SelectItem>
                      <SelectItem value="strict">Team Leader → Department Review → Store Leader → Director</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Training Evaluation Access</label>
                    <p className="text-sm text-[#27251F]/60">Allow Training Leaders to manage certifications</p>
                  </div>
                  <Switch 
                    checked={settings?.userAccess?.evaluation?.trainingAccess}
                    onCheckedChange={(checked) => 
                      onUpdate('evaluation', { trainingAccess: checked })
                    }
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Core Role Certification</label>
                    <p className="text-sm text-[#27251F]/60">Allow Training Leaders to approve core role certifications</p>
                  </div>
                  <Switch 
                    checked={settings?.userAccess?.evaluation?.certificationApproval}
                    onCheckedChange={(checked) => 
                      onUpdate('evaluation', { certificationApproval: checked })
                    }
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Performance Metrics Access</label>
                    <p className="text-sm text-[#27251F]/60">Allow leaders to view Hearts & Hands scores</p>
                  </div>
                  <Switch 
                    checked={settings?.userAccess?.evaluation?.metricsAccess}
                    onCheckedChange={(checked) => 
                      onUpdate('evaluation', { metricsAccess: checked })
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

export default UserAccessSettings;