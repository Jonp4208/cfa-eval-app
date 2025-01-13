// client/src/pages/Evaluations/EmployeeReview.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/axios';
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Paperclip, Pen, Star, History } from 'lucide-react';  
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

interface Section {
  id: string;
  title: string;
  criteria: Array<{
    id: string;
    name: string;
  }>;
}

interface Attachment {
  id: string;
  url: string;
  name: string;
}

export function EmployeeReview() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [showHistory, setShowHistory] = useState(false);
  const [acknowledgeNotes, setAcknowledgeNotes] = useState('');
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signature, setSignature] = useState('');

  const { data: evaluation, isLoading } = useQuery({
    queryKey: ['evaluation', id],
    queryFn: async () => {
      try {
        const response = await api.get(`/api/evaluations/${id}`);
        return response.data;
      } catch (error) {
        throw error;
      }
    }
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        return await api.post(`/api/evaluations/${id}/acknowledge`, data);
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Thank you for reviewing your evaluation.');
      navigate('/evaluations');
    }
  });

  const handleAcknowledge = () => {
    acknowledgeMutation.mutate({
      notes: acknowledgeNotes,
      signature
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Evaluation Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{evaluation?.template.name}</CardTitle>
              <p className="text-gray-500">
                Evaluated by {evaluation?.evaluator.name} on{' '}
                {new Date(evaluation?.completedDate).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => setShowHistory(prev => !prev)}
              className="flex items-center gap-2 px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
            >
              <History className="w-4 h-4" />
              View History
            </button>
          </div>
        </CardHeader>
      </Card>

      {/* Evaluation Sections */}
      {evaluation?.template.sections.map((section: Section) => (
        <Card key={section.id}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {section.criteria.map(criterion => {
              const rating = evaluation.ratings[criterion.id];
              return (
                <div key={criterion.id} className="space-y-2">
                  <div className="flex justify-between">
                    <h3 className="font-medium">{criterion.name}</h3>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: rating.rating }, (_, i) => (
                        <Star 
                          key={i} 
                          className="w-5 h-5 text-yellow-400 fill-current"
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600">{rating.comment}</p>
                  
                  {/* Attachments */}
                  {rating.attachments?.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {rating.attachments.map((attachment: Attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          <Paperclip className="w-4 h-4" />
                          {attachment.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* Development Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Development Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Key Strengths</h3>
            <p className="text-gray-600">{evaluation?.developmentPlan.strengths}</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Areas for Improvement</h3>
            <p className="text-gray-600">{evaluation?.developmentPlan.improvements}</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Goals</h3>
            <p className="text-gray-600">{evaluation?.developmentPlan.goals}</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Action Items</h3>
            <p className="text-gray-600">{evaluation?.developmentPlan.actionItems}</p>
          </div>
        </CardContent>
      </Card>

      {/* Acknowledgment Section */}
      <Card>
        <CardHeader>
          <CardTitle>Acknowledge Evaluation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comments (Optional)
            </label>
            <textarea
              value={acknowledgeNotes}
              onChange={e => setAcknowledgeNotes(e.target.value)}
              placeholder="Add any comments about your evaluation..."
              className="w-full p-2 border rounded-md"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Signature
            </label>
            <button
              onClick={() => setShowSignaturePad(true)}
              className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              <Pen className="w-4 h-4" />
              {signature ? 'Change Signature' : 'Add Signature'}
            </button>
          </div>

          <button
            onClick={handleAcknowledge}
            disabled={!signature || acknowledgeMutation.isPending}
            className="w-full py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {acknowledgeMutation.isPending ? 'Acknowledging...' : 'Acknowledge Evaluation'}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}