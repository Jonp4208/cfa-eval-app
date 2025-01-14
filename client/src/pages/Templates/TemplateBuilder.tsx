// client/src/pages/Templates/TemplateBuilder.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, GripVertical, Trash2, Save } from 'lucide-react';
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
import { DraggableSection } from './components/DraggableSection';
import api from '@/lib/axios';
import { useAuth } from '@/contexts/AuthContext';
import { handleError, handleValidationError } from '@/lib/utils/error-handler';
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";


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
  ratingScale: '1-5' | '1-10' | 'yes-no';
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

export default function TemplateBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();  // Get template ID from URL if editing
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  
  // DnD sensors setup
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const [hasCheckedStore, setHasCheckedStore] = useState(false);
  const [isEditMode] = useState(!!id);  // Check if we're in edit mode
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    tags: ['General'],
    sections: [],
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
                ratingScale: criterion.ratingScale || '1-5',
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
  }, [id, navigate, toast]);

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

  if (isLoading || !hasCheckedStore) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const addSection = () => {
    setFormData(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: Date.now().toString(),
          title: '',
          description: '',
          order: prev.sections.length,
          criteria: [
            {
              id: `${Date.now()}-1`,
              name: '',
              description: '',
              ratingScale: '1-5',
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
                ratingScale: '1-5',
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
            ratingScale: criterion.ratingScale,
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

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header with Save Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{isEditMode ? 'Edit' : 'Create'} Evaluation Template</h1>
        <Button 
          onClick={handleSave}
          variant="red"
        >
          <Save className="w-4 h-4 mr-2" />
          {isEditMode ? 'Update' : 'Save'} Template
        </Button>
      </div>

      {/* Template Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter template name"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter template description"
              />
            </div>

            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-4 mt-2">
                {availableTags.map((tag) => (
                  <div key={tag} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tag-${tag}`}
                      checked={formData.tags.includes(tag)}
                      onCheckedChange={(checked: boolean) => handleTagChange(tag, checked)}
                    />
                    <label
                      htmlFor={`tag-${tag}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {tag}
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                {formData.tags.map(tag => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sections with DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={formData.sections.map(s => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {formData.sections.map((section, index) => (
            <DraggableSection
              key={section.id}
              id={section.id}
              index={index}
              section={section}
              onRemove={removeSection}
              onUpdate={updateSection}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Sections */}
      {formData.sections.map((section, sectionIndex) => (
        <Card key={section.id} className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="w-5 h-5 text-gray-400" />
              <CardTitle>Section {sectionIndex + 1}</CardTitle>
            </div>
            <button
              onClick={() => removeSection(section.id)}
              className="text-red-600"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Section Title
              </label>
              <input
                type="text"
                className={`w-full p-2 border rounded-md ${errors.sections[section.id]?.title ? 'border-red-500' : ''}`}
                value={section.title}
                onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                placeholder="e.g., Customer Service"
              />
              {errors.sections[section.id]?.title && (
                <p className="mt-1 text-sm text-red-500">{errors.sections[section.id].title}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Section Description
              </label>
              <textarea
                className="w-full p-2 border rounded-md"
                rows={2}
                value={section.description}
                onChange={(e) => updateSection(section.id, 'description', e.target.value)}
                placeholder="Describe what this section evaluates"
              />
            </div>

            {/* Criteria */}
            <div className="space-y-4">
              {section.criteria.map((criterion, criterionIndex) => (
                <div key={criterion.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Question {criterionIndex + 1}</span>
                    </div>
                    <button
                      onClick={() => removeCriterion(section.id, criterion.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Question Name
                      </label>
                      <input
                        type="text"
                        className={`w-full p-2 border rounded-md ${
                          errors.sections[section.id]?.criteria[criterion.id]?.name ? 'border-red-500' : ''
                        }`}
                        value={criterion.name}
                        onChange={(e) => updateCriterion(section.id, criterion.id, 'name', e.target.value)}
                        placeholder="e.g., Communication Skills"
                      />
                      {errors.sections[section.id]?.criteria[criterion.id]?.name && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.sections[section.id].criteria[criterion.id].name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Description
                      </label>
                      <textarea
                        className={`w-full p-2 border rounded-md ${
                          errors.sections[section.id]?.criteria[criterion.id]?.description ? 'border-red-500' : ''
                        }`}
                        rows={2}
                        value={criterion.description}
                        onChange={(e) => updateCriterion(section.id, criterion.id, 'description', e.target.value)}
                        placeholder="Describe what to evaluate for this criterion"
                      />
                      {errors.sections[section.id]?.criteria[criterion.id]?.description && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.sections[section.id].criteria[criterion.id].description}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">
                          Response Type
                        </label>
                        <select
                          className="w-full p-2 border rounded-md"
                          value={criterion.ratingScale}
                          onChange={(e) => updateCriterion(section.id, criterion.id, 'ratingScale', e.target.value)}
                        >
                          <option value="1-5">Rating Scale (1-5)</option>
                          <option value="1-10">Rating Scale (1-10)</option>
                          <option value="yes-no">Yes/No</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={criterion.required}
                            onChange={(e) => updateCriterion(section.id, criterion.id, 'required', e.target.checked)}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                          <span className="text-sm">Required</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={() => addCriterion(section.id)}
                className="flex items-center gap-2 text-red-600"
              >
                <Plus className="w-4 h-4" />
                Add Question
              </button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add Section Button */}
      <button
        onClick={addSection}
        className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-red-600 hover:text-red-600 flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Add New Section
      </button>

      {/* Bottom Save Button */}
      <div className="flex justify-end mt-6">
        <Button 
          onClick={handleSave}
          variant="red"
        >
          <Save className="w-4 h-4 mr-2" />
          {isEditMode ? 'Update' : 'Save'} Template
        </Button>
      </div>
    </div>
    
  );
}