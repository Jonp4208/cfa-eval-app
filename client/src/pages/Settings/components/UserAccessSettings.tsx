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
    <Card>
      <CardHeader>
        <CardTitle>User Access Settings</CardTitle>
        <CardDescription>Configure security and access control settings</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {/* Password Policy */}
          <AccordionItem value="password">
            <AccordionTrigger>Password Policy</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium">Minimum Password Length</label>
                    <p className="text-sm text-gray-500">Set minimum characters required</p>
                  </div>
                  <Select 
                    defaultValue={settings?.userAccess?.passwordPolicy?.minLength?.toString()}
                    onValueChange={(value) => 
                      onUpdate('passwordPolicy', { minLength: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="w-[180px]">
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
                    <label className="text-sm font-medium">Require Numbers</label>
                    <p className="text-sm text-gray-500">Must include at least one number</p>
                  </div>
                  <Switch 
                    checked={settings?.userAccess?.passwordPolicy?.requireNumbers}
                    onCheckedChange={(checked) => 
                      onUpdate('passwordPolicy', { requireNumbers: checked })
                    }
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium">Require Special Characters</label>
                    <p className="text-sm text-gray-500">Must include special characters</p>
                  </div>
                  <Switch 
                    checked={settings?.userAccess?.passwordPolicy?.requireSpecialChars}
                    onCheckedChange={(checked) => 
                      onUpdate('passwordPolicy', { requireSpecialChars: checked })
                    }
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Account Security */}
          <AccordionItem value="security">
            <AccordionTrigger>Account Security</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium">Session Timeout</label>
                    <p className="text-sm text-gray-500">Auto logout after inactivity</p>
                  </div>
                  <Select 
                    defaultValue={settings?.userAccess?.accountSecurity?.sessionTimeout?.toString()}
                    onValueChange={(value) => 
                      onUpdate('accountSecurity', { sessionTimeout: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="w-[180px]">
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
                    <label className="text-sm font-medium">Maximum Login Attempts</label>
                    <p className="text-sm text-gray-500">Before account lockout</p>
                  </div>
                  <Select 
                    defaultValue={settings?.userAccess?.accountSecurity?.maxLoginAttempts?.toString()}
                    onValueChange={(value) => 
                      onUpdate('accountSecurity', { maxLoginAttempts: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="w-[180px]">
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
          <AccordionItem value="roles">
            <AccordionTrigger>Role Management</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium">Custom Roles</label>
                    <p className="text-sm text-gray-500">Allow creation of custom roles</p>
                  </div>
                  <Switch 
                    checked={settings?.userAccess?.roleManagement?.allowCustomRoles}
                    onCheckedChange={(checked) => 
                      onUpdate('roleManagement', { allowCustomRoles: checked })
                    }
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium">Department-Specific Roles</label>
                    <p className="text-sm text-gray-500">Enable department-level role management</p>
                  </div>
                  <Switch 
                    checked={settings?.userAccess?.roleManagement?.departmentSpecificRoles}
                    onCheckedChange={(checked) => 
                      onUpdate('roleManagement', { departmentSpecificRoles: checked })
                    }
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* User Lifecycle */}
          <AccordionItem value="lifecycle">
            <AccordionTrigger>User Lifecycle</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium">Training Tracking</label>
                    <p className="text-sm text-gray-500">Enable required training tracking</p>
                  </div>
                  <Switch 
                    checked={settings?.userAccess?.userLifecycle?.requireTrainingTracking}
                    onCheckedChange={(checked) => 
                      onUpdate('userLifecycle', { requireTrainingTracking: checked })
                    }
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <label className="text-sm font-medium">Certification Alerts</label>
                    <p className="text-sm text-gray-500">Enable certification expiration alerts</p>
                  </div>
                  <Switch 
                    checked={settings?.userAccess?.userLifecycle?.certificationAlerts}
                    onCheckedChange={(checked) => 
                      onUpdate('userLifecycle', { certificationAlerts: checked })
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

export default UserAccessSettings;