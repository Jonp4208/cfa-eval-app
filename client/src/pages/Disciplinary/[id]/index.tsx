import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  Clock,
  FileText,
  User,
  MessageCircle,
  Calendar,
  CheckCircle,
  ChevronLeft,
  Edit,
  Printer,
  History,
  Eye,
  Loader2,
  Star
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import disciplinaryService, { DisciplinaryIncident } from '@/services/disciplinaryService';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import AcknowledgmentDialog from '../components/AcknowledgmentDialog';
import FollowUpDialog from '../components/FollowUpDialog';

export default function IncidentDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('details');
  const [incident, setIncident] = useState<DisciplinaryIncident | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAcknowledgmentDialog, setShowAcknowledgmentDialog] = useState(false);
  const [showFollowUpDialog, setShowFollowUpDialog] = useState(false);
  const [selectedFollowUpId, setSelectedFollowUpId] = useState<string>();

  useEffect(() => {
    if (id) {
      loadIncident();
    }
  }, [id]);

  const loadIncident = async () => {
    try {
      const data = await disciplinaryService.getIncidentById(id as string);
      console.log('Loaded incident data:', {
        id: data._id,
        status: data.status,
        employee: data.employee,
        supervisor: data.supervisor
      });
      setIncident(data);
    } catch (error) {
      toast.error('Failed to load incident');
      console.error('Error loading incident:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    navigate(`/disciplinary/${id}/edit`);
  };

  const handleAcknowledge = () => {
    setShowAcknowledgmentDialog(true);
  };

  const handleScheduleFollowUp = () => {
    setShowFollowUpDialog(true);
  };

  const handleCompleteFollowUp = (followUpId: string) => {
    setSelectedFollowUpId(followUpId);
    setShowFollowUpDialog(true);
  };

  const isEmployee = user?._id === incident?.employee?._id;
  const isManager = user?._id === incident?.supervisor?._id || user?.role === 'admin';

  const renderActionButton = () => {
    if (!incident) return null;

    console.log('Debug visibility conditions:', {
      user: user?._id,
      employee: incident?.employee?._id,
      isEmployee,
      status: incident?.status,
      shouldShowButton: isEmployee && incident.status === 'Pending Acknowledgment',
      userRole: user?.role
    });

    if (isEmployee) {
      if (incident.status === 'Pending Acknowledgment') {
        return (
          <Button
            className="bg-[#E51636] hover:bg-[#E51636]/90 text-white"
            onClick={handleAcknowledge}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Acknowledge Incident
          </Button>
        );
      }
    }

    if (isManager) {
      if (incident.status === 'Pending Follow-up') {
        return (
          <Button
            className="bg-[#E51636] hover:bg-[#E51636]/90 text-white"
            onClick={handleScheduleFollowUp}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Follow-up
          </Button>
        );
      }
    }

    return null;
  };

  if (loading || !incident) {
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
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                className="rounded-full h-8 w-8 p-0"
                onClick={() => navigate('/disciplinary')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">
                    {incident.employee.name}
                  </h1>
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    incident.severity === 'Minor' ? 'bg-yellow-100 text-yellow-800' :
                    incident.severity === 'Moderate' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {incident.severity}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    incident.status === 'Open' ? 'bg-yellow-100 text-yellow-800' :
                    incident.status === 'Pending Acknowledgment' ? 'bg-blue-100 text-blue-800' :
                    incident.status === 'Pending Follow-up' ? 'bg-orange-100 text-orange-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {incident.status}
                  </span>
                </div>
                <p className="text-gray-500">Incident #{incident._id} • {incident.type}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {renderActionButton()}
              {isManager && (
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={handleEdit}
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-4 mt-6">
            {[
              { id: 'details', label: 'Details', icon: FileText },
              { id: 'history', label: 'History', icon: History },
              { id: 'followups', label: 'Follow-ups', icon: Clock },
              { id: 'documents', label: 'Documents', icon: Eye }
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'default' : 'outline'}
                className={`flex items-center gap-2 ${
                  activeTab === tab.id ? 'bg-red-600 hover:bg-red-700' : ''
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {activeTab === 'details' && (
            <>
              {/* Employee Information */}
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-gray-400" />
                    Employee Information
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Position</p>
                      <p className="font-medium">{incident.employee.position}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Department</p>
                      <p className="font-medium">{incident.employee.department}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Supervisor</p>
                      <p className="font-medium">{incident.supervisor.name}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Incident Details */}
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-gray-400" />
                    Incident Details
                  </h2>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="font-medium">{new Date(incident.date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Type</p>
                        <p className="font-medium">{incident.type}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Description</p>
                      <p className="mt-1">{incident.description}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Witnesses</p>
                      <p className="mt-1">{incident.witnesses || 'None'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Action Taken</p>
                      <p className="mt-1">{incident.actionTaken}</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Acknowledgment Information */}
              {incident.acknowledgment?.acknowledged && (
                <Card>
                  <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-gray-400" />
                      Acknowledgment
                    </h2>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Date Acknowledged</p>
                        <p className="font-medium">
                          {new Date(incident.acknowledgment.date).toLocaleDateString()}
                        </p>
                      </div>
                      {incident.acknowledgment.comments && (
                        <div>
                          <p className="text-sm text-gray-500">Comments</p>
                          <p className="mt-1">{incident.acknowledgment.comments}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-500">Fairness Rating</p>
                        <div className="flex gap-1 mt-1">
                          {Array.from({ length: incident.acknowledgment.rating }).map((_, i) => (
                            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}

          {activeTab === 'history' && (
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Incident History</h2>
                <div className="space-y-4">
                  {incident.followUps.map((followUp) => (
                    <div key={followUp._id} className="border-l-2 border-red-600 pl-4 pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">Follow-up</p>
                          <p className="text-sm text-gray-500">
                            {new Date(followUp.date).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500">
                          By {followUp.by.name}
                        </span>
                      </div>
                      <p className="mt-2 text-gray-600">{followUp.note}</p>
                    </div>
                  ))}

                  {incident.followUps.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No history available</p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'followups' && (
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Follow-up Actions</h2>
                  {isManager && incident.status === 'Pending Follow-up' && (
                    <Button 
                      className="bg-red-600 hover:bg-red-700"
                      onClick={handleScheduleFollowUp}
                    >
                      Schedule Follow-up
                    </Button>
                  )}
                </div>
                <div className="space-y-4">
                  {incident.followUps.map((followUp) => (
                    <div key={followUp._id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{new Date(followUp.date).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-500">
                            By {followUp.by.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-sm ${
                            followUp.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {followUp.status}
                          </span>
                          {isManager && followUp.status === 'Pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCompleteFollowUp(followUp._id)}
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-600">{followUp.note}</p>
                    </div>
                  ))}

                  {incident.followUps.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No follow-ups recorded</p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'documents' && (
            <Card>
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Related Documents</h2>
                  <Button 
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => {
                      // TODO: Implement document upload dialog
                      toast.info('Document upload coming soon');
                    }}
                  >
                    Upload Document
                  </Button>
                </div>
                <div className="space-y-2">
                  {incident.documents.map((doc) => (
                    <div key={doc._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-gray-500">
                            Added by {doc.uploadedBy.name} on{' '}
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.open(doc.url, '_blank')}
                      >
                        View
                      </Button>
                    </div>
                  ))}

                  {incident.documents.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No documents attached</p>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <AcknowledgmentDialog
        incidentId={id!}
        isOpen={showAcknowledgmentDialog}
        onClose={() => setShowAcknowledgmentDialog(false)}
        onAcknowledge={loadIncident}
      />

      <FollowUpDialog
        incidentId={id!}
        followUpId={selectedFollowUpId}
        isOpen={showFollowUpDialog}
        onClose={() => {
          setShowFollowUpDialog(false);
          setSelectedFollowUpId(undefined);
        }}
        onComplete={loadIncident}
        mode={selectedFollowUpId ? 'complete' : 'schedule'}
      />
    </div>
  );
}