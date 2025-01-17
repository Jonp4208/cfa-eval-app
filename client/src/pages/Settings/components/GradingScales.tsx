import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Check, MinusCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import api from '@/lib/axios';

const GRADE_COLORS = [
  { value: '#DC2626', label: 'Red', description: 'For lowest grades' },
  { value: '#EA580C', label: 'Orange', description: 'For below average grades' },
  { value: '#CA8A04', label: 'Amber', description: 'For below expectations' },
  { value: '#65A30D', label: 'Light Green', description: 'For meeting expectations' },
  { value: '#16A34A', label: 'Green', description: 'For above average' },
  { value: '#0D9488', label: 'Teal', description: 'For excellent performance' },
  { value: '#0284C7', label: 'Blue', description: 'For outstanding' },
  { value: '#6366F1', label: 'Indigo', description: 'For exceptional' },
  { value: '#9333EA', label: 'Purple', description: 'For superior' },
  { value: '#2563EB', label: 'Royal Blue', description: 'For perfect' },
];

interface Grade {
  value: number;
  label: string;
  description?: string;
  color: string;
}

interface GradingScale {
  _id: string;
  name: string;
  description?: string;
  grades: Grade[];
  isDefault: boolean;
  createdBy: {
    name: string;
  };
}

export default function GradingScales() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingScale, setEditingScale] = useState<GradingScale | null>(null);
  const [grades, setGrades] = useState<Array<{ value: number }>>([{ value: 1 }]);
  const [editingGrades, setEditingGrades] = useState<Grade[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addGrade = () => {
    if (grades.length < 10) {
      setGrades([...grades, { value: grades.length + 1 }]);
    }
  };

  const removeGrade = () => {
    if (grades.length > 1) {
      setGrades(grades.slice(0, -1));
    }
  };

  const addEditingGrade = () => {
    if (editingGrades.length < 10) {
      setEditingGrades([...editingGrades, { 
        value: editingGrades.length + 1,
        label: editingGrades.length === 0 ? "Poor" : 
               editingGrades.length === editingGrades.length ? "Excellent" :
               "Good",
        description: "",
        color: GRADE_COLORS[Math.floor((editingGrades.length) * (GRADE_COLORS.length / (editingGrades.length + 1)))]?.value || GRADE_COLORS[0].value
      }]);
    }
  };

  const removeEditingGrade = () => {
    if (editingGrades.length > 1) {
      const newGrades = editingGrades.slice(0, -1).map((grade, i) => ({
        ...grade,
        value: i + 1
      }));
      setEditingGrades(newGrades);
    }
  };

  const resetForm = () => {
    setGrades([{ value: 1 }]);
    setIsCreateOpen(false);
  };

  // Fetch grading scales
  const { data: scales, isLoading } = useQuery({
    queryKey: ['gradingScales'],
    queryFn: async () => {
      const response = await api.get('/api/grading-scales');
      return response.data;
    }
  });

  // Create grading scale
  const createScale = useMutation({
    mutationFn: async (data: Partial<GradingScale>) => {
      const response = await api.post('/api/grading-scales', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gradingScales'] });
      setIsCreateOpen(false);
      toast({
        title: 'Success',
        description: 'Grading scale created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create grading scale',
        variant: 'destructive',
      });
    }
  });

  // Update grading scale
  const updateScale = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<GradingScale> }) => {
      const response = await api.put(`/api/grading-scales/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gradingScales'] });
      setEditingScale(null);
      toast({
        title: 'Success',
        description: 'Grading scale updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update grading scale',
        variant: 'destructive',
      });
    }
  });

  // Delete grading scale
  const deleteScale = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/grading-scales/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gradingScales'] });
      toast({
        title: 'Success',
        description: 'Grading scale deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete grading scale',
        variant: 'destructive',
      });
    }
  });

  // Set default scale
  const setDefault = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/api/grading-scales/${id}/default`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gradingScales'] });
      toast({
        title: 'Success',
        description: 'Default grading scale updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update default scale',
        variant: 'destructive',
      });
    }
  });

  // When opening the edit dialog, map the grades to ensure proper value sequence
  const startEditing = (scale: GradingScale) => {
    const mappedGrades = scale.grades.map((grade, i) => ({
      ...grade,
      value: i + 1
    }));
    setEditingGrades(mappedGrades);
    setEditingScale(scale);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Grading Scales</h2>
          <p className="text-gray-500">Manage evaluation grading scales</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          if (!open) resetForm();
          setIsCreateOpen(open);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#E51636] hover:bg-[#E51636]/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Scale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader className="space-y-2">
              <DialogTitle>Create New Grading Scale</DialogTitle>
              <DialogDescription>
                Create a new grading scale for evaluations
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                name: formData.get('name') as string,
                description: formData.get('description') as string,
                grades: grades.map((grade, i) => ({
                  value: grade.value,
                  label: formData.get(`grade-${grade.value}-label`) as string,
                  description: formData.get(`grade-${grade.value}-description`) as string,
                  color: formData.get(`grade-${grade.value}-color`) as string,
                }))
              };
              createScale.mutate(data);
            }} className="space-y-3">
              <div className="space-y-3">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" required className="focus-visible:ring-[#E51636]" />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" className="focus-visible:ring-[#E51636]" />
                </div>
                <div className="space-y-3">
                  <h4>Grades ({grades.length} Point Scale)</h4>
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                    {grades.map((grade, i) => (
                      <div key={grade.value} className="p-2 border rounded-lg space-y-2 hover:border-[#E51636]/30 transition-colors">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label>Value</Label>
                            <Input value={grade.value} disabled className="bg-gray-50" />
                          </div>
                          <div>
                            <Label htmlFor={`grade-${grade.value}-label`}>Label</Label>
                            <Input 
                              id={`grade-${grade.value}-label`} 
                              name={`grade-${grade.value}-label`} 
                              required 
                              className="focus-visible:ring-[#E51636]"
                              defaultValue={
                                i === 0 ? "Poor" :
                                i === grades.length - 1 ? "Excellent" :
                                i === Math.floor(grades.length / 2) ? "Good" :
                                ""
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor={`grade-${grade.value}-color`}>Color</Label>
                            <Select 
                              name={`grade-${grade.value}-color`} 
                              defaultValue={GRADE_COLORS[Math.floor(i * (GRADE_COLORS.length / grades.length))]?.value} 
                              required
                            >
                              <SelectTrigger className="focus:ring-[#E51636]">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                {GRADE_COLORS.map((color) => (
                                  <SelectItem 
                                    key={color.value} 
                                    value={color.value}
                                    className="focus:bg-[#E51636]/10"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: color.value }} 
                                      />
                                      <span>{color.label}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor={`grade-${grade.value}-description`}>Description</Label>
                          <Input
                            id={`grade-${grade.value}-description`}
                            name={`grade-${grade.value}-description`}
                            className="focus-visible:ring-[#E51636]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    {grades.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="hover:border-[#E51636] hover:text-[#E51636]"
                        onClick={removeGrade}
                      >
                        <MinusCircle className="h-4 w-4 mr-1" />
                        Remove Grade
                      </Button>
                    )}
                    {grades.length < 10 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="hover:border-[#E51636] hover:text-[#E51636]"
                        onClick={addGrade}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Grade
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  className="hover:border-[#E51636] hover:text-[#E51636]"
                  onClick={() => {
                    resetForm();
                    setIsCreateOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createScale.isPending}
                  className="bg-[#E51636] hover:bg-[#E51636]/90 text-white"
                >
                  {createScale.isPending ? 'Creating...' : 'Create Scale'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {scales?.map((scale: GradingScale) => (
          <Card key={scale._id} className="hover:border-[#E51636]/30 transition-colors">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl font-bold">{scale.name}</CardTitle>
                  {scale.description && (
                    <CardDescription>{scale.description}</CardDescription>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Created by {scale.createdBy.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!scale.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:border-[#E51636] hover:text-[#E51636]"
                      onClick={() => setDefault.mutate(scale._id)}
                    >
                      Set as Default
                    </Button>
                  )}
                  {scale.isDefault && (
                    <div className="text-[#E51636] text-sm font-medium flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Default Scale
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:border-[#E51636] hover:text-[#E51636]"
                    onClick={() => startEditing(scale)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:border-[#E51636] hover:text-[#E51636]"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this grading scale?')) {
                        deleteScale.mutate(scale._id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {scale.grades.map((grade) => (
                  <div
                    key={grade.value}
                    className="p-3 rounded-lg text-center space-y-1"
                    style={{ backgroundColor: `${grade.color}10` }}
                  >
                    <div className="font-medium" style={{ color: grade.color }}>
                      {grade.label}
                    </div>
                    <div className="text-sm text-gray-500">Value: {grade.value}</div>
                    {grade.description && (
                      <div className="text-sm text-gray-500">{grade.description}</div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingScale} onOpenChange={(open) => {
        if (!open) {
          setEditingScale(null);
          setEditingGrades([]);
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2">
            <DialogTitle>Edit Grading Scale</DialogTitle>
            <DialogDescription>
              Modify the grading scale settings
            </DialogDescription>
          </DialogHeader>
          {editingScale && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                name: formData.get('name') as string,
                description: formData.get('description') as string,
                grades: editingGrades.map((grade) => ({
                  value: grade.value,
                  label: formData.get(`grade-${grade.value}-label`) as string,
                  description: formData.get(`grade-${grade.value}-description`) as string,
                  color: formData.get(`grade-${grade.value}-color`) as string,
                }))
              };
              updateScale.mutate({ id: editingScale._id, data });
            }}>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    name="name"
                    defaultValue={editingScale.name}
                    required
                    className="focus-visible:ring-[#E51636]"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    name="description"
                    defaultValue={editingScale.description}
                    className="focus-visible:ring-[#E51636]"
                  />
                </div>
                <div className="space-y-2">
                  <h4>Grades ({editingGrades.length} Point Scale)</h4>
                  <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                    {editingGrades.map((grade, i) => (
                      <div key={grade.value} className="p-2 border rounded-lg space-y-2 hover:border-[#E51636]/30 transition-colors">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label>Value</Label>
                            <Input value={i + 1} disabled className="bg-gray-50" />
                          </div>
                          <div>
                            <Label htmlFor={`grade-${grade.value}-label`}>Label</Label>
                            <Input
                              id={`grade-${grade.value}-label`}
                              name={`grade-${grade.value}-label`}
                              defaultValue={grade.label || (
                                i === 0 ? "Poor" :
                                i === editingGrades.length - 1 ? "Excellent" :
                                i === Math.floor(editingGrades.length / 2) ? "Good" :
                                ""
                              )}
                              required
                              className="focus-visible:ring-[#E51636]"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`grade-${grade.value}-color`}>Color</Label>
                            <Select 
                              name={`grade-${grade.value}-color`} 
                              defaultValue={grade.color}
                              required
                            >
                              <SelectTrigger className="focus:ring-[#E51636]">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                {GRADE_COLORS.map((color) => (
                                  <SelectItem 
                                    key={color.value} 
                                    value={color.value}
                                    className="focus:bg-[#E51636]/10"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: color.value }} 
                                      />
                                      <span>{color.label}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor={`grade-${grade.value}-description`}>Description</Label>
                          <Input
                            id={`grade-${grade.value}-description`}
                            name={`grade-${grade.value}-description`}
                            defaultValue={grade.description}
                            className="focus-visible:ring-[#E51636]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    {editingGrades.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="hover:border-[#E51636] hover:text-[#E51636]"
                        onClick={removeEditingGrade}
                      >
                        <MinusCircle className="h-4 w-4 mr-1" />
                        Remove Grade
                      </Button>
                    )}
                    {editingGrades.length < 10 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="hover:border-[#E51636] hover:text-[#E51636]"
                        onClick={addEditingGrade}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Grade
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 mt-2 border-t">
                <Button
                  type="button"
                  variant="outline"
                  className="hover:border-[#E51636] hover:text-[#E51636]"
                  onClick={() => setEditingScale(null)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateScale.isPending}
                  className="bg-[#E51636] hover:bg-[#E51636]/90 text-white"
                >
                  {updateScale.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 