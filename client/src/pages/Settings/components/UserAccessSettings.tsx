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
        <CardTitle className="text-lg text-[#27251F]">User Access Settings</CardTitle>
        <CardDescription className="text-[#27251F]/60">Configure security and access control settings</CardDescription>
      </CardHeader>
      <CardContent>
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
                <span className="font-medium">Role Management</span>
                <span className="text-sm font-normal text-[#27251F]/60">Configure role-based access control</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Custom Roles</label>
                    <p className="text-sm text-[#27251F]/60">Allow creation of custom roles</p>
                  </div>
                  <Switch 
                    checked={settings?.userAccess?.roleManagement?.allowCustomRoles}
                    onCheckedChange={(checked) => 
                      onUpdate('roleManagement', { allowCustomRoles: checked })
                    }
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Department-Specific Roles</label>
                    <p className="text-sm text-[#27251F]/60">Enable department-level role management</p>
                  </div>
                  <Switch 
                    checked={settings?.userAccess?.roleManagement?.departmentSpecificRoles}
                    onCheckedChange={(checked) => 
                      onUpdate('roleManagement', { departmentSpecificRoles: checked })
                    }
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* User Lifecycle */}
          <AccordionItem value="lifecycle" className="border-b-0">
            <AccordionTrigger className="hover:no-underline py-4 text-[#27251F]">
              <div className="flex flex-col items-start gap-1">
                <span className="font-medium">User Lifecycle</span>
                <span className="text-sm font-normal text-[#27251F]/60">Configure user lifecycle settings</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-6">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Training Tracking</label>
                    <p className="text-sm text-[#27251F]/60">Enable required training tracking</p>
                  </div>
                  <Switch 
                    checked={settings?.userAccess?.userLifecycle?.requireTrainingTracking}
                    onCheckedChange={(checked) => 
                      onUpdate('userLifecycle', { requireTrainingTracking: checked })
                    }
                    className="data-[state=checked]:bg-[#E51636]"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium text-[#27251F]">Certification Alerts</label>
                    <p className="text-sm text-[#27251F]/60">Enable certification expiration alerts</p>
                  </div>
                  <Switch 
                    checked={settings?.userAccess?.userLifecycle?.certificationAlerts}
                    onCheckedChange={(checked) => 
                      onUpdate('userLifecycle', { certificationAlerts: checked })
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