import { useState, FormEvent, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
      console.log('Fetching employees...');
      const data = await userService.getAllUsers();
      console.log('API Response:', data);
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
      toast.error('Failed to load employees');
      setEmployees([]);
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
    <div className="min-h-screen bg-[#F4F4F4] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#E51636] to-[#DD0031] rounded-[20px] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">New Disciplinary Incident</h1>
                <p className="text-white/80 mt-2 text-lg">Document a new disciplinary record</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Information */}
            <Card className="bg-white rounded-[20px] shadow-md">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-[#27251F]">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#27251F]/60">Employee Name</label>
                    <Select
                      value={formData.employeeId}
                      onValueChange={(value) => setFormData({...formData, employeeId: value})}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-white border-gray-200 hover:border-gray-300">
                        <SelectValue placeholder="Select Employee" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border rounded-xl shadow-md">
                        {(employees || []).map((emp) => (
                          <SelectItem 
                            key={emp._id} 
                            value={emp._id}
                            className="text-sm py-3 px-4 focus:bg-gray-50 cursor-pointer"
                          >
                            {emp.name} - {emp.position} ({emp.department})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#27251F]/60">Incident Date</label>
                    <input
                      type="date"
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E51636] focus:border-transparent"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#27251F]/60">Incident Type</label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({...formData, type: value})}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-white border-gray-200 hover:border-gray-300">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border rounded-xl shadow-md">
                        {incidentTypes.map((type) => (
                          <SelectItem 
                            key={type} 
                            value={type}
                            className="text-sm py-3 px-4 focus:bg-gray-50 cursor-pointer"
                          >
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#27251F]/60">Severity</label>
                    <Select
                      value={formData.severity}
                      onValueChange={(value) => setFormData({...formData, severity: value})}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-white border-gray-200 hover:border-gray-300">
                        <SelectValue placeholder="Select Severity" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border rounded-xl shadow-md">
                        <SelectItem value="Minor" className="text-sm py-3 px-4 focus:bg-gray-50 cursor-pointer">Minor</SelectItem>
                        <SelectItem value="Moderate" className="text-sm py-3 px-4 focus:bg-gray-50 cursor-pointer">Moderate</SelectItem>
                        <SelectItem value="Major" className="text-sm py-3 px-4 focus:bg-gray-50 cursor-pointer">Major</SelectItem>
                        <SelectItem value="Critical" className="text-sm py-3 px-4 focus:bg-gray-50 cursor-pointer">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Incident Details */}
            <Card className="bg-white rounded-[20px] shadow-md">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-[#27251F]">Incident Details</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#27251F]/60">Description</label>
                    <textarea
                      className="min-h-[120px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E51636] focus:border-transparent"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Provide a detailed description of the incident..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#27251F]/60">Witnesses (if any)</label>
                    <input
                      type="text"
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E51636] focus:border-transparent"
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
                      className="rounded-sm border-gray-200 text-[#E51636] focus:ring-[#E51636]"
                    />
                    <label htmlFor="previousIncidents" className="text-sm text-[#27251F]/60">
                      Previous incidents on record
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action & Follow-up */}
            <Card className="bg-white rounded-[20px] shadow-md">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-[#27251F]">Action & Follow-up</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#27251F]/60">Action Taken</label>
                    <Select
                      value={formData.actionTaken}
                      onValueChange={(value) => setFormData({...formData, actionTaken: value})}
                    >
                      <SelectTrigger className="h-12 rounded-xl bg-white border-gray-200 hover:border-gray-300">
                        <SelectValue placeholder="Select Action" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border rounded-xl shadow-md">
                        <SelectItem value="Verbal Warning" className="text-sm py-3 px-4 focus:bg-gray-50 cursor-pointer">Verbal Warning</SelectItem>
                        <SelectItem value="Written Warning" className="text-sm py-3 px-4 focus:bg-gray-50 cursor-pointer">Written Warning</SelectItem>
                        <SelectItem value="Final Warning" className="text-sm py-3 px-4 focus:bg-gray-50 cursor-pointer">Final Warning</SelectItem>
                        <SelectItem value="Performance Plan" className="text-sm py-3 px-4 focus:bg-gray-50 cursor-pointer">Performance Improvement Plan</SelectItem>
                        <SelectItem value="Suspension" className="text-sm py-3 px-4 focus:bg-gray-50 cursor-pointer">Suspension</SelectItem>
                        <SelectItem value="Termination" className="text-sm py-3 px-4 focus:bg-gray-50 cursor-pointer">Termination</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#27251F]/60">
                      Follow-up Date <span className="text-[#27251F]/40">(Optional)</span>
                    </label>
                    <input
                      type="date"
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E51636] focus:border-transparent"
                      value={formData.followUpDate || ''}
                      onChange={(e) => setFormData({...formData, followUpDate: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#27251F]/60">
                      Follow-up Actions <span className="text-[#27251F]/40">(Optional)</span>
                    </label>
                    <textarea
                      className="min-h-[80px] w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E51636] focus:border-transparent"
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
                      className="rounded-sm border-gray-200 text-[#E51636] focus:ring-[#E51636]"
                    />
                    <label htmlFor="documentationAttached" className="text-sm text-[#27251F]/60">
                      Documentation attached
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/disciplinary')}
                className="h-12 px-6 rounded-2xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#E51636] hover:bg-[#E51636]/90 text-white h-12 px-6 rounded-2xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Create Incident
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}