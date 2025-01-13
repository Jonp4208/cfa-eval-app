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
                      <SelectTrigger className="w-full h-[42px] rounded-lg bg-white border-gray-200 hover:bg-gray-50/50">
                        <SelectValue placeholder="Select Employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp._id} value={emp._id}>
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
                      className="w-full h-[42px] px-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
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
                      <SelectTrigger className="w-full h-[42px] rounded-lg bg-white border-gray-200 hover:bg-gray-50/50">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {incidentTypes.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
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
                      <SelectTrigger className="w-full h-[42px] rounded-lg bg-white border-gray-200 hover:bg-gray-50/50">
                        <SelectValue placeholder="Select Severity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Minor">Minor</SelectItem>
                        <SelectItem value="Moderate">Moderate</SelectItem>
                        <SelectItem value="Major">Major</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
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
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows={4}
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
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
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
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
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
                      <SelectTrigger className="w-full rounded-lg">
                        <SelectValue placeholder="Select Action" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Verbal Warning">Verbal Warning</SelectItem>
                        <SelectItem value="Written Warning">Written Warning</SelectItem>
                        <SelectItem value="Final Warning">Final Warning</SelectItem>
                        <SelectItem value="Performance Plan">Performance Improvement Plan</SelectItem>
                        <SelectItem value="Suspension">Suspension</SelectItem>
                        <SelectItem value="Termination">Termination</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Follow-up Date <span className="text-gray-500">(Optional)</span>
                    </label>
                    <input
                      type="date"
                      className="w-full h-[42px] px-3 border border-gray-200 rounded-lg bg-white hover:bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                      value={formData.followUpDate || ''}
                      onChange={(e) => setFormData({...formData, followUpDate: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Follow-up Actions <span className="text-gray-500">(Optional)</span>
                    </label>
                    <textarea
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows={3}
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
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
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
                className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
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