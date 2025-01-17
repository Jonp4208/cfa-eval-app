// client/src/pages/Templates/components/DraggableSection.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';

interface Props {
  section: {
    id: string;
    title: string;
    description: string;
    criteria: Array<{
      id: string;
      name: string;
      description: string;
      gradingScale: string;
      required: boolean;
    }>;
  };
  onSectionChange: (id: string, field: string, value: string) => void;
  onRemoveSection: (id: string) => void;
  onAddCriterion: (sectionId: string) => void;
  onRemoveCriterion: (sectionId: string, criterionId: string) => void;
  onCriterionChange: (sectionId: string, criterionId: string, field: string, value: any) => void;
  renderCriterionForm: (criterion: any, sectionId: string, index: number) => React.ReactNode;
}

export default function DraggableSection({
  section,
  onSectionChange,
  onRemoveSection,
  onAddCriterion,
  onRemoveCriterion,
  onCriterionChange,
  renderCriterionForm
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : 1,
    position: isDragging ? 'relative' : 'static',
  } as React.CSSProperties;

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2">
              <div {...attributes} {...listeners}>
                <GripVertical className="h-5 w-5 text-gray-500 cursor-grab" />
              </div>
              <div className="flex-1">
                <Label htmlFor={`section-${section.id}-title`}>Section Title</Label>
                <Input
                  id={`section-${section.id}-title`}
                  value={section.title}
                  onChange={(e) => onSectionChange(section.id, 'title', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor={`section-${section.id}-description`}>Description</Label>
              <Textarea
                id={`section-${section.id}-description`}
                value={section.description}
                onChange={(e) => onSectionChange(section.id, 'description', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onRemoveSection(section.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {section.criteria.map((criterion, index) => (
            <div key={criterion.id}>
              {renderCriterionForm(criterion, section.id, index)}
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onAddCriterion(section.id)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Criterion
          </Button>
        </div>
      </Card>
    </div>
  );
}