// client/src/pages/Evaluations/EnhancedEvaluationForm.tsx
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Upload,
  Camera,
  Paperclip,
  Image,
  File,
  Trash2,
  MessageSquare,
  History
} from 'lucide-react';

// Additional interfaces for new features
interface Attachment {
  id: string;
  name: string;
  type: string;
  url: string;
  size: number;
}

interface DiscussionPoint {
  id: string;
  text: string;
  timestamp: Date;
  author: string;
}

// Extend the ratings interface
interface EnhancedRating {
  rating: number;
  comment: string;
  attachments: Attachment[];
  discussionPoints: DiscussionPoint[];
  evidenceNotes: string;
  followUpDate?: Date;
}

export default function EnhancedEvaluationForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [discussionPoint, setDiscussionPoint] = useState('');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [signature, setSignature] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // Handle file upload logic
      const newAttachments: Attachment[] = Array.from(files).map(file => ({
        id: Math.random().toString(),
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
        size: file.size
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const renderAttachmentPreview = (attachment: Attachment) => {
    if (attachment.type.startsWith('image/')) {
      return (
        <div className="relative group">
          <img 
            src={attachment.url} 
            alt={attachment.name}
            className="w-20 h-20 object-cover rounded-lg"
          />
          <button 
            onClick={() => handleRemoveAttachment(attachment.id)}
            className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 p-2 border rounded-lg">
        <File className="w-4 h-4" />
        <span className="text-sm truncate">{attachment.name}</span>
        <button 
          onClick={() => handleRemoveAttachment(attachment.id)}
          className="ml-auto text-red-600"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Evidence & Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paperclip className="w-5 h-5" />
            Evidence & Documentation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Upload */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg hover:bg-gray-50 w-full justify-center"
            >
              <Upload className="w-4 h-4" />
              Upload Files or Images
            </button>
          </div>

          {/* Attachments Preview */}
          {attachments.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              {attachments.map(attachment => (
                <div key={attachment.id}>
                  {renderAttachmentPreview(attachment)}
                </div>
              ))}
            </div>
          )}

          {/* Evidence Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Evidence Notes
            </label>
            <textarea
              value={evidenceNotes}
              onChange={e => setEvidenceNotes(e.target.value)}
              placeholder="Document specific examples, incidents, or achievements..."
              className="w-full p-2 border rounded-md"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Discussion Points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Discussion Points
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={discussionPoint}
              onChange={e => setDiscussionPoint(e.target.value)}
              placeholder="Add a discussion point..."
              className="flex-1 p-2 border rounded-md"
            />
            <button
              onClick={() => {/* Handle adding discussion point */}}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Add
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Follow-up Planning */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Follow-up Planning
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Schedule Follow-up
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={e => setFollowUpDate(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

