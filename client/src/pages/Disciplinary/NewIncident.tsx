import { useState, FormEvent, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  AlertTriangle,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import disciplinaryService, { CreateIncidentData } from '@/services/disciplinaryService';
import userService, { User } from '@/services/userService';
import { toast } from 'sonner';

export default function NewIncidentForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<User[]>([]);
  const [formData, setFormData] = useState<CreateIncidentData>({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    type: '',
    severity: '',
    description: '',
    witnesses: '',
    actionTaken: '',
    followUpDate: '',
    followUpActions: '',
    previousIncidents: false,
    documentationAttached: false
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await userService.getAllUsers();
      setEmployees(data);
    } catch (error) {
      toast.error('Failed to load employees');
      console.error('Error loading employees:', error);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      await disciplinaryService.createIncident(formData);
      toast.success('Incident created successfully');
      navigate('/disciplinary');
    } catch (error) {
      toast.error('Failed to create incident');
      console.error('Error creating incident:', error);
    } finally {
      setLoading(false);
    }
  };

  const incidentTypes = [
    'Attendance',
    'Policy Violation',
    'Performance',
    'Conduct',
    'Safety',
    'Customer Service'
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg mb-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h1 className="text-2xl font-bold">New Disciplinary Incident</h1>
          </div>
          <p className="text-gray-500">Document a new disciplinary incident and follow-up actions</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Employee Name</label>
                    <Select
                      value={formData.employeeId}
                      onValueChange={(value) => setFormData({...formData, employeeId: value})}
                    >
                      <SelectTrigger className="flex items-center justify-between border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 w-full h-[42px] rounded-md bg-white border-gray-200 hover:bg-gray-50/50">
                        <SelectValue placeholder="Select Employee" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border rounded-md shadow-md">
                        {employees.map((emp) => (
                          <SelectItem 
                            key={emp._id} 
                            value={emp._id}
                            className="text-sm py-2.5 px-3 focus:bg-gray-50 cursor-pointer"
                          >
                            {emp.name} - {emp.position} ({emp.department})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Incident Date</label>
                    <input
                      type="date"
                      className="flex items-center justify-between border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 w-full h-[42px] rounded-md bg-white border-gray-200 hover:bg-gray-50/50"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Incident Type</label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({...formData, type: value})}
                    >
                      <SelectTrigger className="flex items-center justify-between border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 w-full h-[42px] rounded-md bg-white border-gray-200 hover:bg-gray-50/50">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border rounded-md shadow-md">
                        {incidentTypes.map((type) => (
                          <SelectItem 
                            key={type} 
                            value={type}
                            className="text-sm py-2.5 px-3 focus:bg-gray-50 cursor-pointer"
                          >
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Severity</label>
                    <Select
                      value={formData.severity}
                      onValueChange={(value) => setFormData({...formData, severity: value})}
                    >
                      <SelectTrigger className="flex items-center justify-between border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 w-full h-[42px] rounded-md bg-white border-gray-200 hover:bg-gray-50/50">
                        <SelectValue placeholder="Select Severity" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border rounded-md shadow-md">
                        <SelectItem value="Minor" className="text-sm py-2.5 px-3 focus:bg-gray-50 cursor-pointer">Minor</SelectItem>
                        <SelectItem value="Moderate" className="text-sm py-2.5 px-3 focus:bg-gray-50 cursor-pointer">Moderate</SelectItem>
                        <SelectItem value="Major" className="text-sm py-2.5 px-3 focus:bg-gray-50 cursor-pointer">Major</SelectItem>
                        <SelectItem value="Critical" className="text-sm py-2.5 px-3 focus:bg-gray-50 cursor-pointer">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Incident Details */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Incident Details</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      className="min-h-[120px] flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50/50"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Provide a detailed description of the incident..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Witnesses (if any)</label>
                    <input
                      type="text"
                      className="flex h-[42px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50/50"
                      value={formData.witnesses}
                      onChange={(e) => setFormData({...formData, witnesses: e.target.value})}
                      placeholder="List any witnesses to the incident"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="previousIncidents"
                      checked={formData.previousIncidents}
                      onChange={(e) => setFormData({...formData, previousIncidents: e.target.checked})}
                      className="rounded-sm border-gray-200 text-red-600 focus:ring-red-500"
                    />
                    <label htmlFor="previousIncidents" className="text-sm">
                      Previous incidents on record
                    </label>
                  </div>
                </div>
              </div>
            </Card>

            {/* Action & Follow-up */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Action & Follow-up</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Action Taken</label>
                    <Select
                      value={formData.actionTaken}
                      onValueChange={(value) => setFormData({...formData, actionTaken: value})}
                    >
                      <SelectTrigger className="flex items-center justify-between border px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 w-full h-[42px] rounded-md bg-white border-gray-200 hover:bg-gray-50/50">
                        <SelectValue placeholder="Select Action" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border rounded-md shadow-md">
                        <SelectItem value="Verbal Warning" className="text-sm py-2.5 px-3 focus:bg-gray-50 cursor-pointer">Verbal Warning</SelectItem>
                        <SelectItem value="Written Warning" className="text-sm py-2.5 px-3 focus:bg-gray-50 cursor-pointer">Written Warning</SelectItem>
                        <SelectItem value="Final Warning" className="text-sm py-2.5 px-3 focus:bg-gray-50 cursor-pointer">Final Warning</SelectItem>
                        <SelectItem value="Performance Plan" className="text-sm py-2.5 px-3 focus:bg-gray-50 cursor-pointer">Performance Improvement Plan</SelectItem>
                        <SelectItem value="Suspension" className="text-sm py-2.5 px-3 focus:bg-gray-50 cursor-pointer">Suspension</SelectItem>
                        <SelectItem value="Termination" className="text-sm py-2.5 px-3 focus:bg-gray-50 cursor-pointer">Termination</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Follow-up Date <span className="text-gray-500">(Optional)</span>
                    </label>
                    <input
                      type="date"
                      className="flex h-[42px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50/50"
                      value={formData.followUpDate || ''}
                      onChange={(e) => setFormData({...formData, followUpDate: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Follow-up Actions <span className="text-gray-500">(Optional)</span>
                    </label>
                    <textarea
                      className="min-h-[90px] flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50/50"
                      value={formData.followUpActions || ''}
                      onChange={(e) => setFormData({...formData, followUpActions: e.target.value})}
                      placeholder="Describe any follow-up actions needed..."
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="documentationAttached"
                      checked={formData.documentationAttached}
                      onChange={(e) => setFormData({...formData, documentationAttached: e.target.checked})}
                      className="rounded-sm border-gray-200 text-red-600 focus:ring-red-500"
                    />
                    <label htmlFor="documentationAttached" className="text-sm">
                      Documentation attached
                    </label>
                  </div>
                </div>
              </div>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => navigate('/disciplinary')}
                disabled={loading}
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                type="submit"
                variant="red"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Save Incident
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}