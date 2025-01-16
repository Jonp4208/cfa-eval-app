// client/src/pages/Templates/components/DraggableSection.tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GripVertical, Trash2, Plus } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

interface Criterion {
  id: string;
  name: string;
  description: string;
  ratingScale: '1-5' | '1-10' | 'yes-no';
  required: boolean;
}

interface Section {
  id: string;
  title: string;
  description: string;
  criteria: Criterion[];
}

interface Props {
  section: Section;
  index: number;
  errors: {
    title?: string;
    criteria?: {
      [key: string]: {
        name?: string;
        description?: string;
      };
    };
  };
  onUpdateSection: (id: string, field: string, value: string) => void;
  onUpdateCriterion: (sectionId: string, criterionId: string, field: string, value: any) => void;
  onAddCriterion: () => void;
  onRemoveSection: () => void;
  onRemoveCriterion: (criterionId: string) => void;
}

export default function DraggableSection({ 
  section, 
  index,
  errors = { criteria: {} },
  onUpdateSection,
  onUpdateCriterion,
  onAddCriterion,
  onRemoveSection,
  onRemoveCriterion
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
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="bg-white rounded-[20px] shadow-sm border border-gray-100">
        <CardHeader className="flex flex-row items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <div {...attributes} {...listeners} className="cursor-grab">
              <GripVertical className="w-5 h-5 text-gray-400" />
            </div>
            <CardTitle className="text-lg font-medium text-[#27251F]">Section {index + 1}</CardTitle>
          </div>
          <button
            onClick={onRemoveSection}
            className="text-gray-400 hover:text-red-600 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="p-6 pt-0 space-y-6">
          {/* Section Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor={`section-${section.id}-title`} className="text-base font-medium text-[#27251F]">
                Section Title
              </Label>
              <Input
                id={`section-${section.id}-title`}
                value={section.title}
                onChange={(e) => onUpdateSection(section.id, 'title', e.target.value)}
                className="mt-1.5 h-12 rounded-xl border-gray-200"
                placeholder="e.g., Customer Service"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">{errors.title}</p>
              )}
            </div>
            <div>
              <Label htmlFor={`section-${section.id}-description`} className="text-base font-medium text-[#27251F]">
                Section Description
              </Label>
              <Textarea
                id={`section-${section.id}-description`}
                value={section.description}
                onChange={(e) => onUpdateSection(section.id, 'description', e.target.value)}
                className="mt-1.5 min-h-[100px] rounded-xl border-gray-200 resize-none"
                placeholder="Describe what this section evaluates"
              />
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium text-[#27251F]">Questions</h3>
              <Button
                onClick={onAddCriterion}
                className="bg-[#E51636] hover:bg-[#E51636]/90 text-white h-10 px-4 rounded-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Question
              </Button>
            </div>

            <div className="space-y-6">
              {section.criteria.map((criterion, criterionIndex) => (
                <Card key={criterion.id} className="rounded-xl border border-gray-100">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="font-medium text-[#27251F]">Question {criterionIndex + 1}</h4>
                      <button
                        onClick={() => onRemoveCriterion(criterion.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`criterion-${criterion.id}-name`} className="text-sm font-medium text-[#27251F]">
                          Question Name
                        </Label>
                        <Input
                          id={`criterion-${criterion.id}-name`}
                          value={criterion.name}
                          onChange={(e) => onUpdateCriterion(section.id, criterion.id, 'name', e.target.value)}
                          className="mt-1.5 h-10 rounded-lg border-gray-200"
                          placeholder="e.g., Communication Skills"
                        />
                        {errors?.criteria?.[criterion.id]?.name && (
                          <p className="mt-1 text-sm text-red-500">{errors?.criteria?.[criterion.id]?.name}</p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`criterion-${criterion.id}-description`} className="text-sm font-medium text-[#27251F]">
                          Description
                        </Label>
                        <Textarea
                          id={`criterion-${criterion.id}-description`}
                          value={criterion.description}
                          onChange={(e) => onUpdateCriterion(section.id, criterion.id, 'description', e.target.value)}
                          className="mt-1.5 min-h-[80px] rounded-lg border-gray-200 resize-none"
                          placeholder="Describe what to evaluate for this criterion"
                        />
                      </div>

                      <div className="flex gap-4">
                        <div className="flex-1">
                          <Label htmlFor={`criterion-${criterion.id}-scale`} className="text-sm font-medium text-[#27251F]">
                            Response Type
                          </Label>
                          <Select
                            value={criterion.ratingScale}
                            onValueChange={(value) => onUpdateCriterion(section.id, criterion.id, 'ratingScale', value)}
                          >
                            <SelectTrigger className="mt-1.5 h-10 rounded-lg border-gray-200">
                              <SelectValue placeholder="Select a rating scale" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1-5">Rating Scale (1-5)</SelectItem>
                              <SelectItem value="1-10">Rating Scale (1-10)</SelectItem>
                              <SelectItem value="yes-no">Yes/No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-end">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`criterion-${criterion.id}-required`}
                              checked={criterion.required}
                              onCheckedChange={(checked) => 
                                onUpdateCriterion(section.id, criterion.id, 'required', checked === true)
                              }
                              className="rounded-md data-[state=checked]:bg-[#E51636] data-[state=checked]:border-[#E51636]"
                            />
                            <Label
                              htmlFor={`criterion-${criterion.id}-required`}
                              className="text-sm font-medium leading-none"
                            >
                              Required
                            </Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}