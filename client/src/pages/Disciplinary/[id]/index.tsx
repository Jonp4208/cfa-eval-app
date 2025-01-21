import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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

  const isEmployee = user?._id === incident?.employee?._id;
  const isManager = user?._id === incident?.supervisor?._id || user?.role === 'admin';

  useEffect(() => {
    if (id) {
      loadIncident();
    }
  }, [id]);

  useEffect(() => {
    if (!isManager && activeTab !== 'details') {
      setActiveTab('details');
    }
  }, [isManager, activeTab]);

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

  const renderActionButton = () => {
    if (!incident) return null;

    if (isManager && incident.status === 'Pending Follow-up') {
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

    return null;
  };

  if (loading || !incident) {
    return (
      <div className="min-h-screen bg-[#F4F4F4] flex items-center justify-center">
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
                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    className="rounded-full h-8 w-8 p-0 text-white hover:bg-white/20"
                    onClick={() => navigate('/disciplinary')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold">
                      {incident.employee.name}
                    </h1>
                    <p className="text-white/80 mt-2 text-lg">
                      Incident #{incident._id} • {incident.type}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {renderActionButton()}
                {isManager && (
                  <Button 
                    variant="ghost"
                    className="h-12 px-6 bg-white/10 hover:bg-white/20 text-white rounded-2xl border-0"
                    onClick={handleEdit}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Incident
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status and Navigation Card */}
        <Card className="bg-white rounded-[20px] shadow-sm">
          <CardContent className="p-8 space-y-8">
            {/* Status and Severity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#E51636]" />
                  <div>
                    <p className="text-[#27251F]/60 text-sm">Status</p>
                    <p className="text-lg font-medium text-[#27251F]">{incident.status}</p>
                  </div>
                </div>
                {isEmployee && incident.status === 'Pending Acknowledgment' && (
                  <Button
                    className="bg-[#E51636] hover:bg-[#E51636]/90 text-white mt-4"
                    onClick={handleAcknowledge}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Acknowledge Incident
                  </Button>
                )}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[#E51636]" />
                  <div>
                    <p className="text-[#27251F]/60 text-sm">Severity</p>
                    <p className="text-lg font-medium text-[#27251F]">{incident.severity}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-wrap gap-4">
              {isManager && (
                <>
                  <Button
                    variant={activeTab === 'history' ? 'default' : 'outline'}
                    className={`h-12 px-6 ${
                      activeTab === 'history' 
                        ? 'bg-[#E51636] hover:bg-[#E51636]/90 text-white' 
                        : 'border-[#27251F]/10 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveTab('history')}
                  >
                    <History className="w-4 h-4 mr-2" />
                    History
                  </Button>
                  <Button
                    variant={activeTab === 'followups' ? 'default' : 'outline'}
                    className={`h-12 px-6 ${
                      activeTab === 'followups' 
                        ? 'bg-[#E51636] hover:bg-[#E51636]/90 text-white' 
                        : 'border-[#27251F]/10 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveTab('followups')}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Follow-ups
                  </Button>
                  <Button
                    variant={activeTab === 'documents' ? 'default' : 'outline'}
                    className={`h-12 px-6 ${
                      activeTab === 'documents' 
                        ? 'bg-[#E51636] hover:bg-[#E51636]/90 text-white' 
                        : 'border-[#27251F]/10 hover:bg-gray-100'
                    }`}
                    onClick={() => setActiveTab('documents')}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Documents
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-6">
          {activeTab === 'details' && (
            <>
              {/* Employee Information */}
              <Card className="bg-white rounded-[20px] shadow-sm">
                <CardContent className="p-8">
                  <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-[#27251F]">
                    <User className="w-5 h-5 text-[#E51636]" />
                    Employee Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-[#27251F]/60">Position</p>
                      <p className="text-lg font-medium text-[#27251F]">{incident.employee.position}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#27251F]/60">Department</p>
                      <p className="text-lg font-medium text-[#27251F]">{incident.employee.department}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#27251F]/60">Supervisor</p>
                      <p className="text-lg font-medium text-[#27251F]">{incident.supervisor.name}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Incident Details */}
              <Card className="bg-white rounded-[20px] shadow-sm">
                <CardContent className="p-8">
                  <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-[#27251F]">
                    <AlertTriangle className="w-5 h-5 text-[#E51636]" />
                    Incident Details
                  </h2>
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-[#27251F]/60">Date</p>
                        <p className="text-lg font-medium text-[#27251F]">
                          {new Date(incident.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-[#27251F]/60">Type</p>
                        <p className="text-lg font-medium text-[#27251F]">{incident.type}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-[#27251F]/60">Description</p>
                      <p className="mt-2 text-[#27251F]">{incident.description}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#27251F]/60">Witnesses</p>
                      <p className="mt-2 text-[#27251F]">{incident.witnesses || 'None'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#27251F]/60">Action Taken</p>
                      <p className="mt-2 text-[#27251F]">{incident.actionTaken}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Acknowledgment Information */}
              {incident.acknowledgment?.acknowledged && (
                <Card className="bg-white rounded-[20px] shadow-sm">
                  <CardContent className="p-8">
                    <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-[#27251F]">
                      <CheckCircle className="w-5 h-5 text-[#E51636]" />
                      Acknowledgment
                    </h2>
                    <div className="space-y-6">
                      <div>
                        <p className="text-sm text-[#27251F]/60">Date Acknowledged</p>
                        <p className="text-lg font-medium text-[#27251F]">
                          {new Date(incident.acknowledgment.date).toLocaleDateString()}
                        </p>
                      </div>
                      {incident.acknowledgment.comments && (
                        <div>
                          <p className="text-sm text-[#27251F]/60">Comments</p>
                          <p className="mt-2 text-[#27251F]">{incident.acknowledgment.comments}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-[#27251F]/60">Fairness Rating</p>
                        <div className="flex gap-1 mt-2">
                          {Array.from({ length: incident.acknowledgment.rating }).map((_, i) => (
                            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {isManager && (
            <>
              {activeTab === 'history' && (
                <Card className="bg-white rounded-[20px] shadow-sm">
                  <CardContent className="p-8">
                    <h2 className="text-lg font-semibold mb-6">Incident History</h2>
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
                  </CardContent>
                </Card>
              )}

              {activeTab === 'followups' && (
                <Card className="bg-white rounded-[20px] shadow-sm">
                  <CardContent className="p-8">
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
                  </CardContent>
                </Card>
              )}

              {activeTab === 'documents' && (
                <Card className="bg-white rounded-[20px] shadow-sm">
                  <CardContent className="p-8">
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
                  </CardContent>
                </Card>
              )}
            </>
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