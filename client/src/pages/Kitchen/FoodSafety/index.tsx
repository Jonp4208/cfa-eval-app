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
import { Plus, Edit, Trash2, PlayCircle, History, X, Clock } from 'lucide-react';
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
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Food Safety Checklists</h1>
          <p className="text-gray-500 mt-2">Manage and complete your food safety checks</p>
        </div>
        <Button onClick={() => handleOpenDialog()} className="bg-[#E51636] text-white hover:bg-[#DD0031] w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Create New Checklist
        </Button>
      </div>

      {/* View Selection Tabs */}
      <div className="flex justify-center px-4">
        <div className="bg-white rounded-full p-1 flex flex-nowrap overflow-x-auto w-full max-w-md gap-1 no-scrollbar">
          <Button 
            variant="ghost"
            className={cn(
              "rounded-full px-3 py-2 text-sm whitespace-nowrap flex-1 min-w-0",
              view === 'active' && "bg-[#E51636] text-white hover:bg-[#E51636]/90"
            )}
            onClick={() => setView('active')}
          >
            Active
          </Button>
          <Button 
            variant="ghost"
            className={cn(
              "rounded-full px-3 py-2 text-sm whitespace-nowrap flex-1 min-w-0",
              view === 'upcoming' && "bg-[#E51636] text-white hover:bg-[#E51636]/90"
            )}
            onClick={() => setView('upcoming')}
          >
            Upcoming
          </Button>
          <Button 
            variant="ghost"
            className={cn(
              "rounded-full px-3 py-2 text-sm whitespace-nowrap flex-1 min-w-0",
              view === 'completed' && "bg-[#E51636] text-white hover:bg-[#E51636]/90"
            )}
            onClick={() => setView('completed')}
          >
            Completed
          </Button>
        </div>
      </div>

      {/* Content based on selected view */}
      {view === 'upcoming' ? (
        <div className="space-y-8">
          {getUpcomingChecklists().map(({ date, checklists }) => (
            <div key={date.toISOString()} className="space-y-4">
              <h3 className="text-xl font-bold text-[#27251F] sticky top-0 bg-[#F4F4F4] py-4 z-10">
                {date.toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </h3>
              <div className="space-y-4">
                {checklists.map((checklist) => (
                  <Card 
                    key={checklist._id}
                    className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer w-full"
                  >
                    <CardContent className="p-8">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-[#27251F]">{checklist.name}</h3>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                              {checklist.frequency.charAt(0).toUpperCase() + checklist.frequency.slice(1)}
                            </Badge>
                          </div>
                          <div className="mt-2 text-sm text-[#27251F]/60">
                            {checklist.items.length} items • Passing Score: {checklist.passingScore}%
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
          {getUpcomingChecklists().length === 0 && (
            <Card className="bg-white rounded-[20px] w-full">
              <CardContent className="p-8 text-center">
                <p className="text-[#27251F]/60">
                  No upcoming checklists found for the next 30 days
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : view === 'completed' ? (
        <div className="space-y-4">
          {completions.map((completion) => {
            const checklist = checklists.find(c => c._id === completion.checklist);
            if (!checklist) return null;

            return (
              <Card 
                key={completion._id}
                className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer w-full bg-green-50 border-green-100"
              >
                <CardContent className="p-8">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-[#27251F]">{checklist.name}</h3>
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          {completion.overallStatus.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm text-[#27251F]/60">
                        {completion.items.length} items • Score: {completion.score}%
                      </div>
                      <div className="mt-4">
                        <div className="h-2 bg-green-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full transition-all duration-300"
                            style={{ width: `${completion.score}%` }} 
                          />
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-green-200">
                        <div className="text-sm text-[#27251F]/60">
                          <p>Completed at: {new Date(completion.completedAt).toLocaleString()}</p>
                          <p>Completed by: {typeof completion.completedBy === 'string' ? completion.completedBy : completion.completedBy.name}</p>
                          {completion.reviewedBy && (
                            <p>Reviewed by: {typeof completion.reviewedBy === 'string' ? completion.reviewedBy : completion.reviewedBy.name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {completions.length === 0 && (
            <Card className="bg-white rounded-[20px] w-full">
              <CardContent className="p-8 text-center">
                <p className="text-[#27251F]/60">
                  No completed checklists found
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {checklists.length === 0 ? (
            <Card className="bg-white rounded-[20px] w-full">
              <CardContent className="p-8 text-center">
                <p className="text-[#27251F]/60 mb-4">No checklists found</p>
                <Button onClick={() => handleOpenDialog()} variant="outline" className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" /> Create Your First Checklist
                </Button>
              </CardContent>
            </Card>
          ) : (
            checklists.map((checklist) => (
              <Card 
                key={checklist._id}
                className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300 w-full"
                onClick={() => handleStartChecklist(checklist._id!)}
              >
                <CardContent className="p-6">
                  {/* Title and Actions Row */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-[#27251F]">{checklist.name}</h3>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog(checklist);
                        }}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(checklist._id!);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Badges and Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full font-medium">
                        {checklist.frequency.charAt(0).toUpperCase() + checklist.frequency.slice(1)}
                      </span>
                      <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                        {checklist.items.length} items
                      </span>
                      <span className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                        Passing: {checklist.passingScore}%
                      </span>
                    </div>
                    {(checklist.frequency === 'weekly' && checklist.weeklyDay) && (
                      <p className="text-sm text-[#27251F]/60">
                        Every {checklist.weeklyDay.charAt(0).toUpperCase() + checklist.weeklyDay.slice(1)}
                      </p>
                    )}
                    {(checklist.frequency === 'monthly' && checklist.monthlyWeek && checklist.monthlyDay) && (
                      <p className="text-sm text-[#27251F]/60">
                        {checklist.monthlyWeek}th {checklist.monthlyDay.charAt(0).toUpperCase() + checklist.monthlyDay.slice(1)} of each month
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-100">
                    <Button 
                      className="bg-[#E51636] text-white hover:bg-[#DD0031] w-full h-11"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartChecklist(checklist._id!);
                      }}
                    >
                      <PlayCircle className="mr-2 h-5 w-5" /> Complete Checklist
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full h-11 border-gray-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/kitchen/food-safety/history/${checklist._id}`);
                      }}
                    >
                      <History className="mr-2 h-5 w-5" /> View History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="p-0 bg-white w-[95vw] sm:max-w-[600px] max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="bg-[#FF1654] p-6 sm:p-8">
            <DialogTitle className="text-xl sm:text-2xl font-semibold text-white">
              {editingChecklist ? 'Edit Checklist' : 'Create New Checklist'}
            </DialogTitle>
            <p className="text-white/80 text-base sm:text-lg mt-2">
              {editingChecklist ? 'Modify existing checklist details' : 'Create a new checklist to manage food safety'}
            </p>
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