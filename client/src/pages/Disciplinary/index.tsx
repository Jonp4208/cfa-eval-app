import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  UserX,
  ClipboardList,
  Filter,
  Search,
  Loader2,
  Mail
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import disciplinaryService, { DisciplinaryIncident } from '@/services/disciplinaryService';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';

export default function DisciplinaryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [incidents, setIncidents] = useState<DisciplinaryIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    open: 0,
    followUps: 0,
    resolved: 0,
    repeat: 0
  });

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      const data = await disciplinaryService.getAllIncidents();
      console.log('Raw data from server:', data);
      setIncidents(data);
      
      // Debug logging
      console.log('All incidents:', data.map(i => ({ 
        id: i._id, 
        status: i.status,
        type: i.type,
        severity: i.severity,
        description: i.description
      })));
      
      // Calculate stats
      const openIncidents = data.filter(i => i.status === 'Open' || i.status === 'Pending Acknowledgment' || i.status === 'In Progress' || i.status === 'Pending Follow-up');
      console.log('Open incidents:', openIncidents.map(i => ({ 
        id: i._id, 
        status: i.status,
        type: i.type,
        severity: i.severity,
        description: i.description
      })));
      
      const stats = {
        open: openIncidents.length,
        followUps: data.filter(i => new Date(i.followUpDate) >= new Date()).length,
        resolved: data.filter(i => i.status === 'Resolved').length,
        repeat: data.filter(i => i.previousIncidents).length
      };
      console.log('Calculated stats:', stats);
      setStats(stats);
    } catch (error) {
      toast.error('Failed to load incidents');
      console.error('Error loading incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredIncidents = () => {
    let filtered = incidents;
    console.log('Initial incidents for filtering:', filtered.map(i => ({ 
      id: i._id, 
      status: i.status,
      type: i.type,
      severity: i.severity,
      description: i.description
    })));

    // Status filter
    switch (filter) {
      case 'all':
        // Don't filter, show all incidents
        break;
      case 'open':
        filtered = filtered.filter(i => i.status === 'Open' || i.status === 'Pending Acknowledgment' || i.status === 'In Progress' || i.status === 'Pending Follow-up');
        break;
      case 'followup':
        filtered = filtered.filter(i => new Date(i.followUpDate) >= new Date());
        break;
      case 'resolved':
        filtered = filtered.filter(i => i.status === 'Resolved');
        break;
    }

    console.log('After status filtering:', filtered.map(i => ({ 
      id: i._id, 
      status: i.status,
      type: i.type,
      severity: i.severity,
      description: i.description
    })));

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(i => 
        i.employee.name.toLowerCase().includes(query) ||
        i.employee.position.toLowerCase().includes(query) ||
        i.employee.department.toLowerCase().includes(query) ||
        i.type.toLowerCase().includes(query) ||
        i.description.toLowerCase().includes(query)
      );
      console.log('After search filtering:', filtered.map(i => ({ 
        id: i._id, 
        status: i.status,
        type: i.type,
        severity: i.severity,
        description: i.description
      })));
    }

    return filtered;
  };

  const handleNewIncident = () => {
    navigate('/disciplinary/new');
  };

  const handleViewDetails = (id: string) => {
    navigate(`/disciplinary/${id}`);
  };

  const handleAcknowledge = async (incidentId: string) => {
    navigate(`/disciplinary/${incidentId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#E51636] to-[#DD0031] rounded-[20px] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">Disciplinary Management</h1>
                <p className="text-white/80 mt-2 text-lg">Track and manage disciplinary actions</p>
              </div>
              <div>
                <Button 
                  className="bg-white text-[#E51636] hover:bg-white/90 h-12 px-6"
                  onClick={handleNewIncident}
                >
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  New Incident
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white rounded-[20px] shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-[#E51636]" />
                <div>
                  <p className="text-[#27251F]/60 text-sm">Open Incidents</p>
                  <p className="text-2xl font-bold text-[#27251F]">{stats.open}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white rounded-[20px] shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#E51636]" />
                <div>
                  <p className="text-[#27251F]/60 text-sm">Follow-ups Due</p>
                  <p className="text-2xl font-bold text-[#27251F]">{stats.followUps}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white rounded-[20px] shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-[#E51636]" />
                <div>
                  <p className="text-[#27251F]/60 text-sm">Resolved This Month</p>
                  <p className="text-2xl font-bold text-[#27251F]">{stats.resolved}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white rounded-[20px] shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <UserX className="w-5 h-5 text-[#E51636]" />
                <div>
                  <p className="text-[#27251F]/60 text-sm">Repeat Incidents</p>
                  <p className="text-2xl font-bold text-[#27251F]">{stats.repeat}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters Card */}
        <Card className="bg-white">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="flex-1 relative w-full">
                <Input
                  type="text"
                  placeholder="Search by employee, position, department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pl-10 pr-4 w-full bg-white border-gray-200"
                />
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilter('all')}
                  className={`h-12 px-6 ${
                    filter === 'all' 
                      ? 'bg-[#E51636] hover:bg-[#E51636]/90 text-white' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  All
                </Button>
                <Button
                  variant={filter === 'open' ? 'default' : 'outline'}
                  onClick={() => setFilter('open')}
                  className={`h-12 px-6 ${
                    filter === 'open' 
                      ? 'bg-[#E51636] hover:bg-[#E51636]/90 text-white' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  Open
                </Button>
                <Button
                  variant={filter === 'followup' ? 'default' : 'outline'}
                  onClick={() => setFilter('followup')}
                  className={`h-12 px-6 ${
                    filter === 'followup' 
                      ? 'bg-[#E51636] hover:bg-[#E51636]/90 text-white' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  Needs Follow-up
                </Button>
                <Button
                  variant={filter === 'resolved' ? 'default' : 'outline'}
                  onClick={() => setFilter('resolved')}
                  className={`h-12 px-6 ${
                    filter === 'resolved' 
                      ? 'bg-[#E51636] hover:bg-[#E51636]/90 text-white' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  Resolved
                </Button>
              </div>

              <Button 
                className="bg-[#E51636] hover:bg-[#E51636]/90 text-white h-12 px-6"
                onClick={handleNewIncident}
              >
                New Incident
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Incidents List */}
        <div className="space-y-4">
          {getFilteredIncidents().map((incident) => (
            <Card key={incident._id} className="bg-white rounded-[20px] shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-[#27251F]">
                      {incident.employee.name}
                    </h3>
                    <p className="text-sm text-[#27251F]/60">
                      {incident.employee.position} • {incident.employee.department}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      incident.status === 'Open' ? 'bg-yellow-100 text-yellow-800' :
                      incident.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {incident.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      incident.severity === 'Minor' ? 'bg-gray-100 text-gray-800' :
                      incident.severity === 'Moderate' ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {incident.severity}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-[#27251F] mb-2">Description</h4>
                    <p className="text-[#27251F]/60">{incident.description}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-[#27251F] mb-2">Action Taken</h4>
                    <p className="text-[#27251F]/60">{incident.actionTaken}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-[#27251F]/60">
                    <span>Issued by: {incident.createdBy.name}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>Manager: {incident.supervisor.name}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>Date: {new Date(incident.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {user?._id === incident.employee._id && 
                     incident.status === 'Pending Acknowledgment' && (
                      <Button 
                        variant="default"
                        size="sm" 
                        className="flex items-center gap-2 flex-1 sm:flex-initial justify-center h-10 px-4 rounded-xl bg-[#E51636] hover:bg-[#E51636]/90 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAcknowledge(incident._id);
                        }}
                      >
                        <CheckCircle className="w-4 h-4" />
                        Acknowledge
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-2 flex-1 sm:flex-initial justify-center h-10 px-4 rounded-xl border-gray-200 hover:bg-gray-100"
                      onClick={() => handleViewDetails(incident._id)}
                    >
                      <FileText className="w-4 h-4" />
                      View Details
                    </Button>
                    {incident.status === 'Resolved' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-2 flex-1 sm:flex-initial justify-center h-10 px-4"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await disciplinaryService.sendEmail(incident._id);
                            toast.success('Email sent successfully');
                          } catch (error: any) {
                            toast.error(error.response?.data?.message || 'Failed to send email');
                          }
                        }}
                        title="Send incident details to store email"
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {getFilteredIncidents().length === 0 && (
            <Card className="bg-white rounded-[20px] shadow-md">
              <CardContent className="p-12 text-center">
                <p className="text-[#27251F]/60">No incidents found</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}