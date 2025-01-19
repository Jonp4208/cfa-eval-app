import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import disciplinaryService from '@/services/disciplinaryService';

interface Props {
  incidentId: string;
  followUpId?: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  mode: 'schedule' | 'complete';
}

export default function FollowUpDialog({ incidentId, followUpId, isOpen, onClose, onComplete, mode }: Props) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      if (mode === 'schedule') {
        await disciplinaryService.addFollowUp(incidentId, {
          date,
          note,
          status: 'Pending'
        });
        toast.success('Follow-up scheduled successfully');
      } else {
        await disciplinaryService.completeFollowUp(incidentId, followUpId!, { note });
        toast.success('Follow-up completed successfully');
      }
      onComplete();
      onClose();
    } catch (error) {
      toast.error(`Failed to ${mode} follow-up`);
      console.error(`Error ${mode}ing follow-up:`, error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'schedule' ? 'Schedule Follow-up' : 'Complete Follow-up'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'schedule'
              ? 'Schedule a follow-up meeting to discuss the disciplinary incident.'
              : 'Record the outcome of the follow-up meeting.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {mode === 'schedule' && (
            <div>
              <label className="block text-sm font-medium mb-2 text-[#27251F]/60">
                Follow-up Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E51636] focus:border-transparent"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-[#27251F]/60">
              {mode === 'schedule' ? 'Follow-up Plan' : 'Follow-up Notes'}
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                mode === 'schedule'
                  ? 'Describe the plan for the follow-up meeting...'
                  : 'Record the outcome and any actions taken...'
              }
              className="min-h-[100px]"
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={mode === 'schedule' ? !date || !note : !note || loading}
            className="bg-[#E51636] hover:bg-[#E51636]/90 text-white"
          >
            {loading ? 'Submitting...' : mode === 'schedule' ? 'Schedule' : 'Complete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 