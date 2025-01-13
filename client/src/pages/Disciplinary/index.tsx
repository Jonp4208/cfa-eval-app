import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
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
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import disciplinaryService, { DisciplinaryIncident } from '@/services/disciplinaryService';
import { toast } from 'sonner';

export default function DisciplinaryPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [incidents, setIncidents] = useState<DisciplinaryIncident[]>([]);
  const [loading, setLoading] = useState(true);
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
      setIncidents(data);
      
      // Calculate stats
      const stats = {
        open: data.filter(i => i.status === 'Open').length,
        followUps: data.filter(i => new Date(i.followUpDate) >= new Date()).length,
        resolved: data.filter(i => i.status === 'Resolved').length,
        repeat: data.filter(i => i.previousIncidents).length
      };
      setStats(stats);
    } catch (error) {
      toast.error('Failed to load incidents');
      console.error('Error loading incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredIncidents = () => {
    switch (filter) {
      case 'open':
        return incidents.filter(i => i.status === 'Open');
      case 'followup':
        return incidents.filter(i => new Date(i.followUpDate) >= new Date());
      case 'resolved':
        return incidents.filter(i => i.status === 'Resolved');
      default:
        return incidents;
    }
  };

  const handleNewIncident = () => {
    navigate('/disciplinary/new');
  };

  const handleViewDetails = (id: string) => {
    navigate(`/disciplinary/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white p-6 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Disciplinary Management</h1>
              <p className="text-gray-500">Track and manage disciplinary actions</p>
            </div>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleNewIncident}
            >
              New Incident
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-gray-500 text-sm">Open Incidents</p>
                <p className="text-2xl font-bold">{stats.open}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-gray-500 text-sm">Follow-ups Due</p>
                <p className="text-2xl font-bold">{stats.followUps}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-gray-500 text-sm">Resolved This Month</p>
                <p className="text-2xl font-bold">{stats.resolved}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg">
            <div className="flex items-center gap-3">
              <UserX className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-gray-500 text-sm">Repeat Incidents</p>
                <p className="text-2xl font-bold">{stats.repeat}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg mb-6 overflow-hidden">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className={`flex-shrink-0 ${filter === 'all' ? 'bg-red-600 hover:bg-red-700 text-white' : 'hover:bg-gray-100'}`}
            >
              All
            </Button>
            <Button
              variant={filter === 'open' ? 'default' : 'outline'}
              onClick={() => setFilter('open')}
              className={`flex-shrink-0 ${filter === 'open' ? 'bg-red-600 hover:bg-red-700 text-white' : 'hover:bg-gray-100'}`}
            >
              Open
            </Button>
            <Button
              variant={filter === 'followup' ? 'default' : 'outline'}
              onClick={() => setFilter('followup')}
              className={`flex-shrink-0 ${filter === 'followup' ? 'bg-red-600 hover:bg-red-700 text-white' : 'hover:bg-gray-100'}`}
            >
              Needs Follow-up
            </Button>
            <Button
              variant={filter === 'resolved' ? 'default' : 'outline'}
              onClick={() => setFilter('resolved')}
              className={`flex-shrink-0 ${filter === 'resolved' ? 'bg-red-600 hover:bg-red-700 text-white' : 'hover:bg-gray-100'}`}
            >
              Resolved
            </Button>
          </div>
        </div>

        {/* Incidents List */}
        <div className="space-y-4">
          {getFilteredIncidents().map((incident) => (
            <Card key={incident._id}>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {incident.employee.firstName} {incident.employee.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(incident.date).toLocaleDateString()} • {incident.type}
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
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-gray-600">{incident.description}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Action Taken</h4>
                    <p className="text-gray-600">{incident.actionTaken}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500">
                    <span>Manager: {incident.supervisor.firstName} {incident.supervisor.lastName}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>Follow-up: {new Date(incident.followUpDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-2 flex-1 sm:flex-initial justify-center"
                      onClick={() => handleViewDetails(incident._id)}
                    >
                      <FileText className="w-4 h-4" />
                      View Details
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-2 flex-1 sm:flex-initial justify-center"
                    >
                      <ClipboardList className="w-4 h-4" />
                      Add Follow-up
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {getFilteredIncidents().length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No incidents found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}