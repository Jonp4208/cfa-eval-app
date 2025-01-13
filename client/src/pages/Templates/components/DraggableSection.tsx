// client/src/pages/Templates/components/DraggableSection.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GripVertical, Trash2 } from 'lucide-react';

interface Props {
  id: string;
  index: number;
  section: any;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: string, value: string) => void;
  // ... other props
}

export function DraggableSection({ id, index, section, onRemove, onUpdate }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div {...attributes} {...listeners} className="cursor-grab">
              <GripVertical className="w-5 h-5 text-gray-400" />
            </div>
            <CardTitle>Section {index + 1}</CardTitle>
          </div>
          <button
            onClick={() => onRemove(id)}
            className="text-red-600"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent>
          {/* Section content remains the same */}
        </CardContent>
      </Card>
    </div>
  );
}