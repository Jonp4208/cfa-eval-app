import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/ui/StarRating';
import { toast } from 'sonner';
import disciplinaryService from '@/services/disciplinaryService';

interface AcknowledgmentDialogProps {
  incidentId: string;
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: () => void;
}

export default function AcknowledgmentDialog({
  incidentId,
  isOpen,
  onClose,
  onAcknowledge,
}: AcknowledgmentDialogProps) {
  const [comments, setComments] = useState('');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please provide a fairness rating');
      return;
    }

    try {
      setLoading(true);
      await disciplinaryService.acknowledgeIncident(incidentId, {
        comments,
        rating,
      });
      toast.success('Incident acknowledged successfully');
      onAcknowledge();
      onClose();
    } catch (error) {
      console.error('Error acknowledging incident:', error);
      toast.error('Failed to acknowledge incident');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Acknowledge Incident</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              How fair do you feel this disciplinary action was?
            </label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Comments (optional)
            </label>
            <Textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add any comments or concerns..."
              className="min-h-[100px]"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Submitting...' : 'Submit Acknowledgment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 