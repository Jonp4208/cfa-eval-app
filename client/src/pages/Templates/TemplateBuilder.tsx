// client/src/pages/Templates/TemplateBuilder.tsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, GripVertical, Trash2, Save, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import DraggableSection from './components/DraggableSection';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { handleError, handleValidationError } from '@/lib/utils/error-handler';
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/PageHeader';


interface Section {
  id: string;
  title: string;
  description: string;
  criteria: Criterion[];
  order: number;
}

interface Criterion {
  id: string;
  name: string;
  description: string;
  gradingScale: string;
  required: boolean;
}

interface Template {
  _id?: string;
  name: string;
  description: string;
  store: string;
  sections: Section[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface TemplateFormData {
  name: string;
  description: string;
  tags: string[];
  sections: Section[];
  store?: string;
  isActive?: boolean;
}

interface GradingScale {
  _id: string;
  name: string;
  description?: string;
  grades: Array<{
    value: number;
    label: string;
    description?: string;
    color: string;
  }>;
  isDefault: boolean;
}

export default function TemplateBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();  // Get template ID from URL if editing
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const [hasCheckedStore, setHasCheckedStore] = useState(false);
  const [isEditMode] = useState(!!id);  // Check if we're in edit mode

  // DnD sensors setup
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch available grading scales
  const { data: gradingScales } = useQuery({
    queryKey: ['gradingScales'],
    queryFn: async () => {
      const response = await api.get('/api/grading-scales');
      return response.data;
    }
  });

  // Get default scale
  const defaultScale = gradingScales?.find((scale: GradingScale) => scale.isDefault);
  
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    tags: ['General'],
    sections: [{
      id: Date.now().toString(),
      title: 'Customer Service',
      description: 'Evaluate employee performance in customer service and interaction',
      order: 0,
      criteria: [
        {
          id: `${Date.now()}-1`,
          name: 'Communication Skills',
          description: 'Ability to communicate clearly and effectively with customers',
          gradingScale: defaultScale?._id || '1-5',
          required: true
        }
      ]
    }],
    store: '',
    isActive: true
  });

  // Add error state
  const [errors, setErrors] = useState<{
    name?: string;
    sections: {
      [key: string]: {
        title?: string;
        criteria: {
          [key: string]: {
            name?: string;
            description?: string;
          };
        };
      };
    };
  }>({
    sections: {}
  });

  const availableTags = ['FOH', 'BOH', 'Leadership', 'General'];

  // Initialize new criterion with default scale
  const createNewCriterion = () => ({
    id: Date.now().toString(),
    name: '',
    description: '',
    gradingScale: defaultScale?._id || '1-5',
    required: true
  });

  // Add this function to get scale name for display
  const getScaleName = (scaleId: string) => {
    if (!gradingScales) return 'Loading...';
    const scale = gradingScales.find((s: GradingScale) => s._id === scaleId);
    if (scale) return scale.name;
    // Handle legacy scales
    if (scaleId === '1-5') return '5 Point Scale';
    if (scaleId === '1-10') return '10 Point Scale';
    if (scaleId === 'yes-no') return 'Yes/No';
    return 'Unknown Scale';
  };

  // Fetch template data if in edit mode
  useEffect(() => {
    const fetchTemplate = async () => {
      if (id) {
        try {
          const response = await api.get(`/api/templates/${id}`);
          const template = response.data.template;
          
          // Transform the data to match the form structure
          setFormData({
            name: template.name,
            description: template.description || '',
            tags: template.tags || ['General'],
            sections: template.sections.map((section: any) => ({
              id: section._id || Date.now().toString(),
              title: section.title,
              description: section.description || '',
              order: section.order,
              criteria: section.criteria.map((criterion: any) => ({
                id: criterion._id || Date.now().toString(),
                name: criterion.name,
                description: criterion.description || '',
                gradingScale: criterion.gradingScale || defaultScale?._id || '',
                required: criterion.required
              }))
            })),
            store: template.store || '',
            isActive: template.isActive
          });
        } catch (error) {
          console.error('Error fetching template:', error);
          toast({
            title: "Error",
            description: "Failed to load template data",
            duration: 5000,
          });
          navigate('/templates');
        }
      }
    };

    fetchTemplate();
  }, [id, navigate, toast, defaultScale]);

  useEffect(() => {
    console.log('Auth check effect running', { 
      isLoading, 
      user, 
      userStore: user?.store,
      storeType: user?.store ? typeof user.store : 'undefined'
    });
    
    if (!isLoading) {
      if (!user) {
        console.log('No user found, redirecting to login');
        navigate('/login');
        return;
      }

      if (!user.store) {
        console.log('No store found for user');
        toast({
          title: "Access Denied",
          description: "You must be associated with a store to create templates. Please contact your administrator.",
          variant: "destructive",
        });
        navigate('/templates');
        return;
      }

      // Check the type and structure of store before accessing _id
      let storeId;
      if (typeof user.store === 'string') {
        storeId = user.store;
      } else if (typeof user.store === 'object' && user.store?._id) {
        storeId = user.store._id;
      } else {
        console.error('Invalid store format:', user.store);
        toast({
          title: "Error",
          description: "Invalid store data format. Please contact support.",
          variant: "destructive",
        });
        navigate('/templates');
        return;
      }

      console.log('Setting store ID:', storeId);
      setFormData(prev => ({
        ...prev,
        store: storeId
      }));
      setHasCheckedStore(true);
    }
  }, [isLoading, user, navigate, toast]);

  const addSection = () => {
    const newSectionId = Date.now().toString();
    const newCriterionId = `${Date.now()}-1`;
    
    setFormData(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: newSectionId,
          title: 'Customer Service',
          description: 'Evaluate employee performance in customer service and interaction',
          order: prev.sections.length,
          criteria: [
            {
              id: newCriterionId,
              name: 'Communication Skills',
              description: 'Ability to communicate clearly and effectively with customers',
              gradingScale: '1-5',
              required: true
            }
          ]
        }
      ]
    }));
  };

  const addCriterion = (sectionId: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            criteria: [
              ...section.criteria,
              {
                id: Date.now().toString(),
                name: '',
                description: '',
                gradingScale: defaultScale?._id || '',
                required: true
              }
            ]
          };
        }
        return section;
      })
    }));
  };

  const updateSection = (sectionId: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(section => {
        if (section.id === sectionId) {
          return { ...section, [field]: value };
        }
        return section;
      })
    }));
  };

  const updateCriterion = (sectionId: string, criterionId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            criteria: section.criteria.map(criterion => {
              if (criterion.id === criterionId) {
                return { ...criterion, [field]: value };
              }
              return criterion;
            })
          };
        }
        return section;
      })
    }));
  };

  const removeSection = (sectionId: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));
  };

  const removeCriterion = (sectionId: string, criterionId: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            criteria: section.criteria.filter(criterion => criterion.id !== criterionId)
          };
        }
        return section;
      })
    }));
  };

  const handleSave = async () => {
    // Reset errors
    setErrors({ sections: {} });
    let hasErrors = false;

    if (!user?._id) {
      handleValidationError({
        message: "User data not available. Please try again."
      });
      return;
    }

    if (!formData.store) {
      handleValidationError({
        message: "No store selected"
      });
      return;
    }

    // Validate template name
    if (!formData.name.trim()) {
      setErrors(prev => ({ ...prev, name: "Template name is required" }));
      hasErrors = true;
    }

    // Validate sections exist
    if (formData.sections.length === 0) {
      handleValidationError({
        message: "Template must have at least one section"
      });
      return;
    }

    // Validate each section and its criteria
    formData.sections.forEach((section, i) => {
      if (!section.title.trim()) {
        setErrors(prev => ({
          ...prev,
          sections: {
            ...prev.sections,
            [section.id]: {
              ...prev.sections[section.id],
              title: `Section ${i + 1} requires a title`,
              criteria: {}
            }
          }
        }));
        hasErrors = true;
      }

      if (section.criteria.length === 0) {
        setErrors(prev => ({
          ...prev,
          sections: {
            ...prev.sections,
            [section.id]: {
              ...prev.sections[section.id],
              title: `Section must have at least one criterion`,
              criteria: {}
            }
          }
        }));
        hasErrors = true;
      }

      section.criteria.forEach((criterion) => {
        if (!criterion.name.trim()) {
          setErrors(prev => ({
            ...prev,
            sections: {
              ...prev.sections,
              [section.id]: {
                ...prev.sections[section.id],
                criteria: {
                  ...prev.sections[section.id]?.criteria,
                  [criterion.id]: {
                    ...prev.sections[section.id]?.criteria[criterion.id],
                    name: `Question name is required`
                  }
                }
              }
            }
          }));
          hasErrors = true;
        }
      });
    });

    if (hasErrors) {
      handleValidationError({
        message: "Please fix the highlighted errors"
      });
      return;
    }

    try {
      const templateData = {
        ...formData,
        createdBy: user?._id,
        sections: formData.sections.map((section, index) => ({
          ...section,
          order: index,
          criteria: section.criteria.map(criterion => ({
            name: criterion.name,
            description: criterion.description,
            gradingScale: criterion.gradingScale,
            required: criterion.required
          }))
        }))
      };

      if (isEditMode) {
        await api.put(`/api/templates/${id}`, templateData);
        toast({
          title: "Success",
          description: "Template updated successfully",
          duration: 5000,
        });
      } else {
        await api.post('/api/templates', templateData);
        toast({
          title: "Success",
          description: "Template created successfully",
          duration: 5000,
        });
      }
      
      navigate('/templates');
    } catch (error: any) {
      console.error('Error saving template:', error);
      handleError(error);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setFormData((prev) => {
        const oldIndex = prev.sections.findIndex((s) => s.id === active.id);
        const newIndex = prev.sections.findIndex((s) => s.id === over.id);
        
        return {
          ...prev,
          sections: arrayMove(prev.sections, oldIndex, newIndex),
        };
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleTagChange = (tag: string, checked: boolean | "indeterminate") => {
    if (checked === true) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tag]
      });
    } else {
      setFormData({
        ...formData,
        tags: formData.tags.filter(t => t !== tag)
      });
    }
  };

  const handleCriterionChange = useCallback((sectionId: string, criterionId: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            criteria: section.criteria.map(criterion => {
              if (criterion.id === criterionId) {
                return {
                  ...criterion,
                  [field]: value
                };
              }
              return criterion;
            })
          };
        }
        return section;
      })
    }));
  }, []);

  const handleRemoveCriterion = useCallback((sectionId: string, criterionId: string) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            criteria: section.criteria.filter(criterion => criterion.id !== criterionId)
          };
        }
        return section;
      })
    }));
  }, []);

  const renderCriterionForm = useCallback((criterion: Criterion, sectionId: string, index: number) => {
    return (
      <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Criterion {index + 1}</h4>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => handleRemoveCriterion(sectionId, criterion.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor={`criterion-${criterion.id}-name`}>Name</Label>
            <Input
              id={`criterion-${criterion.id}-name`}
              value={criterion.name}
              onChange={(e) => handleCriterionChange(sectionId, criterion.id, 'name', e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor={`criterion-${criterion.id}-description`}>Description</Label>
            <Textarea
              id={`criterion-${criterion.id}-description`}
              value={criterion.description}
              onChange={(e) => handleCriterionChange(sectionId, criterion.id, 'description', e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor={`criterion-${criterion.id}-scale`}>Grading Scale</Label>
            <select
              id={`criterion-${criterion.id}-scale`}
              value={criterion.gradingScale}
              onChange={(e) => handleCriterionChange(sectionId, criterion.id, 'gradingScale', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {gradingScales?.map((scale: GradingScale) => (
                <option key={scale._id} value={scale._id}>
                  {scale.name} {scale.isDefault && '(Default)'}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`criterion-${criterion.id}-required`}
              checked={criterion.required}
              onCheckedChange={(checked) => 
                handleCriterionChange(sectionId, criterion.id, 'required', checked)
              }
            />
            <Label htmlFor={`criterion-${criterion.id}-required`}>Required</Label>
          </div>
        </div>
      </div>
    );
  }, [gradingScales, handleCriterionChange, handleRemoveCriterion]);

  return (
    <div className="min-h-screen bg-[#F4F4F4] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title={isEditMode ? 'Edit Template' : 'Create Template'}
          subtitle="Design evaluation templates for your team"
          actions={
            <Button 
              variant="secondary"
              className="bg-white/10 hover:bg-white/20 text-white border-0 h-12 px-6 flex-1 md:flex-none"
              onClick={() => navigate('/templates')}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Templates
            </Button>
          }
        />

        {/* Main Content */}
        <Card className="bg-white rounded-[20px] shadow-md">
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* Template Details */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-base font-medium text-[#27251F]">Template Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1.5 h-12 rounded-xl border-gray-200"
                    placeholder="Enter template name"
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="description" className="text-base font-medium text-[#27251F]">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-1.5 min-h-[100px] rounded-xl border-gray-200 resize-none"
                    placeholder="Enter template description"
                  />
                </div>

                <div>
                  <Label className="text-base font-medium text-[#27251F]">Tags</Label>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {availableTags.map((tag) => (
                      <div key={tag} className="flex items-center space-x-2">
                        <Checkbox
                          id={tag}
                          checked={formData.tags.includes(tag)}
                          onCheckedChange={(checked) => handleTagChange(tag, checked)}
                          className="rounded-md data-[state=checked]:bg-[#E51636] data-[state=checked]:border-[#E51636]"
                        />
                        <Label
                          htmlFor={tag}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {tag}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sections */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-[#27251F]">Sections</h2>
                  <Button
                    onClick={addSection}
                    className="bg-[#E51636] hover:bg-[#E51636]/90 text-white h-10 px-4 rounded-xl"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Section
                  </Button>
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={formData.sections.map(section => section.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {formData.sections.map((section, index) => (
                        <DraggableSection
                          key={section.id}
                          section={section}
                          index={index}
                          errors={errors.sections[section.id] || {}}
                          onUpdateSection={updateSection}
                          onUpdateCriterion={updateCriterion}
                          onAddCriterion={() => addCriterion(section.id)}
                          onRemoveSection={() => removeSection(section.id)}
                          onRemoveCriterion={(criterionId) => removeCriterion(section.id, criterionId)}
                          renderCriterionForm={renderCriterionForm}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-start gap-4">
          <Button
            onClick={handleSave}
            className="bg-[#E51636] hover:bg-[#E51636]/90 text-white h-12 px-6 rounded-xl"
          >
            <Save className="w-5 h-5 mr-2" />
            {isEditMode ? 'Save Changes' : 'Create Template'}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/templates')}
            className="h-12 px-6 rounded-xl border-gray-200 hover:bg-gray-50 text-[#27251F]"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}