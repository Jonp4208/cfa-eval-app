import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, PlayCircle, History, X, Clock, Check } from 'lucide-react';
import { kitchenService } from '@/services/kitchenService';
import { FoodSafetyChecklist, ChecklistFrequency, FoodSafetyChecklistCompletion } from '@/types/kitchen';
import { cn } from "@/lib/utils";

const FoodSafety: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [checklists, setChecklists] = useState<FoodSafetyChecklist[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<FoodSafetyChecklist | null>(null);
  const [view, setView] = useState<'active' | 'upcoming' | 'completed'>('active');
  const [completions, setCompletions] = useState<FoodSafetyChecklistCompletion[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequency: 'daily' as ChecklistFrequency,
    weeklyDay: 'monday',
    monthlyWeek: 1,
    monthlyDay: 'monday',
    items: []
  });
  const [newItem, setNewItem] = useState({
    name: '',
    type: 'yes_no',
    validation: {
      requiredValue: 'yes',
      minTemp: 0,
      maxTemp: 0,
      requiredPattern: '',
      warningThreshold: 0,
      criticalThreshold: 0
    },
    isCritical: false
  });
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    loadChecklists();
  }, []);

  useEffect(() => {
    if (view === 'completed') {
      loadCompletions();
    }
  }, [view]);

  const loadChecklists = async () => {
    try {
      setLoading(true);
      const response = await kitchenService.getAllChecklists();
      // Ensure we have an array, even if the response is null/undefined
      setChecklists(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Failed to load checklists:', error);
      enqueueSnackbar('Failed to load checklists', { variant: 'error' });
      setChecklists([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const loadCompletions = async () => {
    try {
      const allCompletions: FoodSafetyChecklistCompletion[] = [];
      for (const checklist of checklists) {
        if (!checklist._id) continue;
        const checklistCompletions = await kitchenService.getChecklistCompletions(checklist._id);
        allCompletions.push(...checklistCompletions);
      }
      setCompletions(allCompletions);
    } catch (error) {
      console.error('Failed to load completions:', error);
      enqueueSnackbar('Failed to load completions', { variant: 'error' });
    }
  };

  // Get upcoming checklists for the next 30 days
  const getUpcomingChecklists = () => {
    const upcoming: { date: Date; checklists: FoodSafetyChecklist[] }[] = [];
    const today = new Date();
    
    // Look ahead 30 days
    for (let i = 1; i <= 30; i++) {
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + i);
      
      const checklistsForDate = checklists.filter(checklist => {
        if (checklist.frequency === 'daily') return true;
        
        if (checklist.frequency === 'weekly' && checklist.weeklyDay) {
          const dayName = futureDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
          return dayName === checklist.weeklyDay;
        }
        
        if (checklist.frequency === 'monthly' && checklist.monthlyWeek && checklist.monthlyDay) {
          const dayName = futureDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
          const weekOfMonth = Math.ceil(futureDate.getDate() / 7);
          return dayName === checklist.monthlyDay && weekOfMonth === checklist.monthlyWeek;
        }
        
        return false;
      });
      
      if (checklistsForDate.length > 0) {
        upcoming.push({ date: futureDate, checklists: checklistsForDate });
      }
    }
    
    return upcoming;
  };

  const handleOpenDialog = (checklist?: FoodSafetyChecklist) => {
    if (checklist) {
      setEditingChecklist(checklist);
      setFormData({
        name: checklist.name,
        description: checklist.description || '',
        frequency: checklist.frequency,
        weeklyDay: checklist.weeklyDay || 'monday',
        monthlyWeek: checklist.monthlyWeek || 1,
        monthlyDay: checklist.monthlyDay || 'monday',
        items: checklist.items
      });
    } else {
      setEditingChecklist(null);
      setFormData({
        name: '',
        description: '',
        frequency: 'daily',
        weeklyDay: 'monday',
        monthlyWeek: 1,
        monthlyDay: 'monday',
        items: []
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingChecklist(null);
    setFormData({
      name: '',
      description: '',
      frequency: 'daily',
      weeklyDay: 'monday',
      monthlyWeek: 1,
      monthlyDay: 'monday',
      items: []
    });
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        department: 'Kitchen'
      };

      // Only include frequency-specific fields when needed
      if (submitData.frequency === 'daily') {
        delete submitData.weeklyDay;
        delete submitData.monthlyWeek;
        delete submitData.monthlyDay;
      } else if (submitData.frequency === 'weekly') {
        delete submitData.monthlyWeek;
        delete submitData.monthlyDay;
      }

      console.log('Submitting checklist data:', submitData);

      if (editingChecklist) {
        await kitchenService.updateChecklist(editingChecklist._id!, submitData);
        enqueueSnackbar('Checklist updated successfully', { variant: 'success' });
      } else {
        await kitchenService.createChecklist(submitData);
        enqueueSnackbar('Checklist created successfully', { variant: 'success' });
      }
      handleCloseDialog();
      loadChecklists();
    } catch (error) {
      console.error('Error submitting checklist:', error);
      enqueueSnackbar('Failed to save checklist', { variant: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this checklist?')) {
      try {
        await kitchenService.deleteChecklist(id);
        enqueueSnackbar('Checklist deleted successfully', { variant: 'success' });
        loadChecklists();
      } catch (error) {
        enqueueSnackbar('Failed to delete checklist', { variant: 'error' });
      }
    }
  };

  const handleStartChecklist = (id: string) => {
    navigate(`/kitchen/food-safety/complete/${id}`);
  };

  const handleAddItem = () => {
    if (!newItem.name) return;
    
    // Clean up validation data based on item type
    let validation = {};
    if (newItem.type === 'temperature') {
      validation = {
        minTemp: newItem.validation.minTemp,
        maxTemp: newItem.validation.maxTemp,
        warningThreshold: newItem.validation.warningThreshold,
        criticalThreshold: newItem.validation.criticalThreshold
      };
    } else if (newItem.type === 'yes_no') {
      validation = {
        requiredValue: newItem.validation.requiredValue
      };
    } else if (newItem.type === 'text') {
      validation = newItem.validation.requiredPattern ? {
        requiredPattern: newItem.validation.requiredPattern
      } : {};
    }

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        name: newItem.name,
        type: newItem.type,
        isCritical: newItem.isCritical,
        validation,
        order: prev.items.length + 1 // Add order field
      }]
    }));

    setNewItem({
      name: '',
      type: 'yes_no',
      validation: {
        requiredValue: 'yes',
        minTemp: 0,
        maxTemp: 0,
        requiredPattern: '',
        warningThreshold: 0,
        criticalThreshold: 0
      },
      isCritical: false
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F4F4]">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#E51636] to-[#DD0031] p-4 sm:p-6 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl sm:text-3xl font-bold">Food Safety</h1>
              <Button 
                className="bg-white/10 text-white hover:bg-white/20 h-10 px-4 rounded-xl inline-flex items-center justify-center text-sm font-medium transition-colors"
                onClick={() => navigate('/dashboard')}
              >
                Back
              </Button>
            </div>
            <p className="text-white/80 text-sm sm:text-base">Manage and track kitchen food safety checklists</p>
            <Button 
              className="bg-white text-[#E51636] hover:bg-white/90 h-12 rounded-xl inline-flex items-center justify-center font-medium transition-colors w-full sm:w-auto"
              onClick={() => handleOpenDialog()}
            >
              <Plus className="w-5 h-5 mr-2" />
              New Checklist
            </Button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-white rounded-xl hover:shadow-md transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-[#E51636]/10 rounded-lg flex items-center justify-center shrink-0">
                  <PlayCircle className="h-5 w-5 text-[#E51636]" />
                </div>
                <div>
                  <p className="text-[#27251F]/60 text-sm font-medium">Active Today</p>
                  <h3 className="text-xl font-bold text-[#27251F]">
                    {checklists.filter(c => c.frequency === 'daily').length}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl hover:shadow-md transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[#27251F]/60 text-sm font-medium">Weekly</p>
                  <h3 className="text-xl font-bold text-[#27251F]">
                    {checklists.filter(c => c.frequency === 'weekly').length}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl hover:shadow-md transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                  <History className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-[#27251F]/60 text-sm font-medium">Monthly</p>
                  <h3 className="text-xl font-bold text-[#27251F]">
                    {checklists.filter(c => c.frequency === 'monthly').length}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl hover:shadow-md transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0">
                  <Check className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-[#27251F]/60 text-sm font-medium">Done Today</p>
                  <h3 className="text-xl font-bold text-[#27251F]">
                    {completions.filter(c => 
                      new Date(c.completedAt).toDateString() === new Date().toDateString()
                    ).length}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <Button
            variant={view === 'active' ? 'default' : 'outline'}
            onClick={() => setView('active')}
            className={`rounded-full shrink-0 ${
              view === 'active' 
                ? 'bg-[#E51636] hover:bg-[#E51636]/90 text-white' 
                : 'hover:bg-[#E51636]/10 hover:text-[#E51636]'
            }`}
          >
            Active Tasks
          </Button>
          <Button
            variant={view === 'upcoming' ? 'default' : 'outline'}
            onClick={() => setView('upcoming')}
            className={`rounded-full shrink-0 ${
              view === 'upcoming' 
                ? 'bg-[#E51636] hover:bg-[#E51636]/90 text-white' 
                : 'hover:bg-[#E51636]/10 hover:text-[#E51636]'
            }`}
          >
            Upcoming
          </Button>
          <Button
            variant={view === 'completed' ? 'default' : 'outline'}
            onClick={() => setView('completed')}
            className={`rounded-full shrink-0 ${
              view === 'completed' 
                ? 'bg-[#E51636] hover:bg-[#E51636]/90 text-white' 
                : 'hover:bg-[#E51636]/10 hover:text-[#E51636]'
            }`}
          >
            Completed
          </Button>
        </div>

        {/* Checklists Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {loading ? (
            <div className="col-span-full flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E51636]" />
            </div>
          ) : view === 'active' ? (
            checklists.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl p-8 text-center">
                <p className="text-[#27251F]/60">No active checklists found</p>
                <Button
                  className="mt-4 bg-[#E51636] text-white hover:bg-[#E51636]/90"
                  onClick={() => handleOpenDialog()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Checklist
                </Button>
              </div>
            ) : (
              checklists.map((checklist) => (
                <Card
                  key={checklist._id}
                  className="bg-white rounded-xl hover:shadow-md transition-all group"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-[#27251F] truncate">{checklist.name}</h3>
                        <p className="text-sm text-[#27251F]/60 mt-0.5 line-clamp-2">{checklist.description}</p>
                      </div>
                      <div className="flex items-start gap-1 ml-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDialog(checklist);
                          }}
                          className="h-8 w-8 text-gray-500 hover:text-[#E51636] hover:bg-[#E51636]/10"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(checklist._id!);
                          }}
                          className="h-8 w-8 text-gray-500 hover:text-[#E51636] hover:bg-[#E51636]/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-[#27251F]/60">
                          {checklist.items.length} items to check
                        </div>
                        <Badge 
                          className={cn(
                            "capitalize shrink-0",
                            checklist.frequency === 'daily' ? "bg-[#E51636]/10 text-[#E51636]" :
                            checklist.frequency === 'weekly' ? "bg-blue-100 text-blue-600" :
                            "bg-green-100 text-green-600"
                          )}
                        >
                          {checklist.frequency}
                        </Badge>
                      </div>
                      
                      <Button
                        size="sm"
                        className="w-full bg-[#E51636] text-white hover:bg-[#E51636]/90"
                        onClick={() => handleStartChecklist(checklist._id!)}
                      >
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Start
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )
          ) : view === 'upcoming' ? (
            getUpcomingChecklists().length === 0 ? (
              <div className="col-span-full bg-white rounded-xl p-8 text-center">
                <p className="text-[#27251F]/60">No upcoming checklists found</p>
              </div>
            ) : (
              getUpcomingChecklists().map((day, index) => (
                <Card key={index} className="bg-white rounded-xl hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="mb-3">
                      <h3 className="font-medium text-[#27251F]">
                        {day.date.toLocaleDateString('en-US', { 
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {day.checklists.map((checklist, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                          <span className="text-[#27251F] truncate mr-2">{checklist.name}</span>
                          <Badge 
                            className={cn(
                              "capitalize shrink-0",
                              checklist.frequency === 'daily' ? "bg-[#E51636]/10 text-[#E51636]" :
                              checklist.frequency === 'weekly' ? "bg-blue-100 text-blue-600" :
                              "bg-green-100 text-green-600"
                            )}
                          >
                            {checklist.frequency}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )
          ) : (
            completions.length === 0 ? (
              <div className="col-span-full bg-white rounded-xl p-8 text-center">
                <p className="text-[#27251F]/60">No completed checklists found</p>
              </div>
            ) : (
              completions.map((completion) => (
                <Card
                  key={completion._id}
                  className="bg-white rounded-xl hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate(`/food-safety/view/${completion._id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-[#27251F] truncate">{completion.checklist.name}</h3>
                        <p className="text-sm text-[#27251F]/60 mt-0.5">
                          Completed {new Date(completion.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-600 shrink-0">
                        Completed
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                        <span className="text-[#27251F]/60">Completed by:</span>
                        <span className="text-[#27251F] font-medium">{completion.completedBy.name}</span>
                      </div>
                      <div className="text-sm flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                        <span className="text-[#27251F]/60">Items checked:</span>
                        <span className="text-[#27251F] font-medium">{completion.items.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingChecklist ? 'Edit Checklist' : 'Create New Checklist'}</DialogTitle>
          </DialogHeader>
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
            <div>
              <Label htmlFor="name" className="text-base font-semibold">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-base font-semibold">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-2"
              />
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="frequency" className="text-base font-semibold">Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => setFormData({ ...formData, frequency: value as ChecklistFrequency })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.frequency === 'weekly' && (
                <div>
                  <Label htmlFor="weeklyDay" className="text-base font-semibold">Day of Week</Label>
                  <Select
                    value={formData.weeklyDay}
                    onValueChange={(value) => setFormData({ ...formData, weeklyDay: value })}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monday">Monday</SelectItem>
                      <SelectItem value="tuesday">Tuesday</SelectItem>
                      <SelectItem value="wednesday">Wednesday</SelectItem>
                      <SelectItem value="thursday">Thursday</SelectItem>
                      <SelectItem value="friday">Friday</SelectItem>
                      <SelectItem value="saturday">Saturday</SelectItem>
                      <SelectItem value="sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.frequency === 'monthly' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="monthlyWeek" className="text-base font-semibold">Week of Month</Label>
                    <Select
                      value={formData.monthlyWeek.toString()}
                      onValueChange={(value) => setFormData({ ...formData, monthlyWeek: parseInt(value) })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">First Week</SelectItem>
                        <SelectItem value="2">Second Week</SelectItem>
                        <SelectItem value="3">Third Week</SelectItem>
                        <SelectItem value="4">Fourth Week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="monthlyDay" className="text-base font-semibold">Day of Week</Label>
                    <Select
                      value={formData.monthlyDay}
                      onValueChange={(value) => setFormData({ ...formData, monthlyDay: value })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monday">Monday</SelectItem>
                        <SelectItem value="tuesday">Tuesday</SelectItem>
                        <SelectItem value="wednesday">Wednesday</SelectItem>
                        <SelectItem value="thursday">Thursday</SelectItem>
                        <SelectItem value="friday">Friday</SelectItem>
                        <SelectItem value="saturday">Saturday</SelectItem>
                        <SelectItem value="sunday">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label className="text-base font-semibold">Checklist Items</Label>
              
              <div className="space-y-4 mt-4">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-sm text-gray-500">Type: {item.type}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                      className="text-gray-500 hover:text-red-600 shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                <div className="p-4 border rounded-lg space-y-4">
                  <div>
                    <Label htmlFor="itemName">Item Name</Label>
                    <Input
                      id="itemName"
                      value={newItem.name}
                      onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="itemType">Type</Label>
                    <Select
                      value={newItem.type}
                      onValueChange={(value) => setNewItem(prev => ({ 
                        ...prev, 
                        type: value,
                        validation: {
                          ...prev.validation,
                          // Reset validation based on type
                          requiredValue: value === 'yes_no' ? 'yes' : '',
                          minTemp: value === 'temperature' ? 0 : 0,
                          maxTemp: value === 'temperature' ? 0 : 0,
                          warningThreshold: value === 'temperature' ? 0 : 0,
                          criticalThreshold: value === 'temperature' ? 0 : 0,
                          requiredPattern: value === 'text' ? '' : '',
                        }
                      }))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes_no">Yes/No</SelectItem>
                        <SelectItem value="temperature">Temperature</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Validation fields based on type */}
                  {newItem.type === 'yes_no' && (
                    <div>
                      <Label htmlFor="requiredValue">Required Value</Label>
                      <Select
                        value={newItem.validation.requiredValue}
                        onValueChange={(value) => setNewItem(prev => ({
                          ...prev,
                          validation: { ...prev.validation, requiredValue: value }
                        }))}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {newItem.type === 'temperature' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="minTemp">Minimum Temperature</Label>
                          <Input
                            id="minTemp"
                            type="number"
                            value={newItem.validation.minTemp}
                            onChange={(e) => setNewItem(prev => ({
                              ...prev,
                              validation: { ...prev.validation, minTemp: Number(e.target.value) }
                            }))}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="maxTemp">Maximum Temperature</Label>
                          <Input
                            id="maxTemp"
                            type="number"
                            value={newItem.validation.maxTemp}
                            onChange={(e) => setNewItem(prev => ({
                              ...prev,
                              validation: { ...prev.validation, maxTemp: Number(e.target.value) }
                            }))}
                            className="mt-2"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="warningThreshold">Warning Threshold</Label>
                          <Input
                            id="warningThreshold"
                            type="number"
                            value={newItem.validation.warningThreshold}
                            onChange={(e) => setNewItem(prev => ({
                              ...prev,
                              validation: { ...prev.validation, warningThreshold: Number(e.target.value) }
                            }))}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="criticalThreshold">Critical Threshold</Label>
                          <Input
                            id="criticalThreshold"
                            type="number"
                            value={newItem.validation.criticalThreshold}
                            onChange={(e) => setNewItem(prev => ({
                              ...prev,
                              validation: { ...prev.validation, criticalThreshold: Number(e.target.value) }
                            }))}
                            className="mt-2"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {newItem.type === 'text' && (
                    <div>
                      <Label htmlFor="requiredPattern">Required Pattern (optional)</Label>
                      <Input
                        id="requiredPattern"
                        value={newItem.validation.requiredPattern}
                        onChange={(e) => setNewItem(prev => ({
                          ...prev,
                          validation: { ...prev.validation, requiredPattern: e.target.value }
                        }))}
                        className="mt-2"
                        placeholder="Regular expression pattern"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isCritical"
                      checked={newItem.isCritical}
                      onChange={(e) => setNewItem(prev => ({ ...prev, isCritical: e.target.checked }))}
                    />
                    <Label htmlFor="isCritical">Critical Item</Label>
                  </div>

                  <div className="pt-4 border-t">
                    <Button 
                      onClick={() => handleAddItem()} 
                      className="bg-[#FF1654] text-white hover:bg-[#E51636] w-full"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 p-6 sm:p-8 border-t bg-white">
            <Button variant="outline" onClick={handleCloseDialog} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleSubmit} className="bg-[#FF1654] text-white hover:bg-[#E51636] w-full sm:w-auto">Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FoodSafety; 