// client/src/pages/Templates/index.tsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Plus, 
  Search, 
  FileText, 
  Clock,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Copy
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import api from '@/lib/axios';
import { handleError } from '@/lib/utils/error-handler';

interface Template {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  lastModified: string;
  createdBy: {
    name: string;
  };
  usageCount: number;
  sectionsCount: number;
  criteriaCount: number;
}

export default function Templates() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && !(event.target as Element).closest('.action-menu')) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const { data: templates, isLoading, error, refetch } = useQuery({
    queryKey: ['templates', statusFilter],
    queryFn: async () => {
      try {
        console.log('Fetching templates with status:', statusFilter);
        const response = await api.get('/api/templates', {
          params: { status: statusFilter }
        });
        console.log('Templates response:', response.data);
        return response.data.templates;
      } catch (err) {
        console.error('Failed to fetch templates:', err);
        throw err;
      }
    }
  });

  // Handle error state in the UI
  if (error instanceof Error) {
    handleError({ message: error.message });
    return (
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6">
            <div className="flex flex-col items-center text-center">
              <AlertTriangle className="w-12 h-12 text-red-600 mb-4" />
              <h1 className="text-xl font-semibold mb-2">Error Loading Templates</h1>
              <p className="text-gray-600 mb-4">There was a problem loading the templates. Please try again later.</p>
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const filteredTemplates = templates?.filter((template: Template) => 
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (templateId: string) => {
      await api.delete(`/api/templates/${templateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: "Success",
        description: "Template deleted successfully",
        duration: 5000,
      });
      setTemplateToDelete(null);
    },
    onError: (error: any) => {
      handleError(error);
    }
  });

  // Add copy mutation
  const copyMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const response = await api.post(`/api/templates/${templateId}/duplicate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast({
        title: "Success",
        description: "Template copied successfully",
        duration: 5000,
      });
    },
    onError: (error: any) => {
      handleError(error);
    }
  });

  const handleDelete = (template: Template) => {
    setTemplateToDelete(template);
    setOpenMenuId(null);
  };

  const confirmDelete = () => {
    if (templateToDelete) {
      deleteMutation.mutate(templateToDelete.id);
    }
  };

  const handleCopy = async (templateId: string) => {
    try {
      await copyMutation.mutateAsync(templateId);
    } catch (error) {
      console.error('Error copying template:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-[#E51636] to-[#DD0031] rounded-[20px] p-6 md:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />
          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="flex-1">
                <h1 className="text-3xl md:text-[40px] font-bold text-white leading-tight">Evaluation Templates</h1>
                <p className="text-white/80 mt-2 text-base md:text-lg">Create and manage evaluation forms</p>
              </div>
              <Button 
                onClick={() => navigate('/templates/new')}
                className="bg-white text-[#E51636] hover:bg-white/90 h-12 px-4 sm:px-6 rounded-2xl flex items-center gap-2 text-base font-medium w-full sm:w-auto justify-center"
              >
                <Plus className="w-5 h-5" />
                Create Template
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-4 md:space-y-6">
          {/* Filters Section */}
          <Card className="bg-white rounded-[20px] shadow-md">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <CardTitle className="text-lg md:text-xl font-medium">All Templates</CardTitle>
                </div>
                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search templates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#E51636] focus:border-transparent text-base"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E51636] text-base w-full sm:w-auto"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Templates List */}
          <div className="grid grid-cols-1 gap-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E51636] mx-auto"></div>
              </div>
            ) : filteredTemplates?.length === 0 ? (
              <Card className="bg-white rounded-[20px] shadow-md">
                <CardContent className="p-6 md:p-8 text-center">
                  <div className="h-16 w-16 bg-[#E51636]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-[#E51636]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-[#27251F]">No templates found</h3>
                  <p className="text-[#27251F]/60 mb-6">Create your first evaluation template to get started.</p>
                  <Link 
                    to="/templates/new"
                    className="inline-flex items-center gap-2"
                  >
                    <Button className="bg-[#E51636] text-white hover:bg-[#E51636]/90 h-12 px-6 rounded-2xl flex items-center gap-2 text-base font-medium w-full sm:w-auto justify-center">
                      <Plus className="w-5 h-5" />
                      Create Template
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              filteredTemplates?.map((template: Template) => (
                <Card 
                  key={template.id} 
                  className="bg-white rounded-[20px] hover:shadow-xl transition-all duration-300 cursor-pointer"
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-[#27251F] truncate">{template.name}</h3>
                          {template.isActive ? (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0">
                              <XCircle className="w-3 h-3" />
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#27251F]/60 mb-4 line-clamp-2">{template.description}</p>
                        
                        <div className="flex items-center gap-4 md:gap-6 text-sm text-[#27251F]/60 flex-wrap">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 flex-shrink-0" />
                            {template.sectionsCount} {template.sectionsCount === 1 ? 'section' : 'sections'}
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 flex-shrink-0" />
                            {template.criteriaCount} {template.criteriaCount === 1 ? 'question' : 'questions'}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 flex-shrink-0" />
                            Used {template.usageCount} {template.usageCount === 1 ? 'time' : 'times'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 pt-4 md:pt-0 border-t md:border-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/templates/${template.id}/edit`)}
                                className="hover:bg-[#E51636]/10 hover:text-[#E51636] h-10 w-10"
                              >
                                <Edit className="w-5 h-5 text-[#27251F]/60" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit Template</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/templates/${template.id}`)}
                                className="hover:bg-[#E51636]/10 hover:text-[#E51636] h-10 w-10"
                              >
                                <FileText className="w-5 h-5 text-[#27251F]/60" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View Template</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopy(template.id)}
                                className="hover:bg-[#E51636]/10 hover:text-[#E51636] h-10 w-10"
                              >
                                <Copy className="w-5 h-5 text-[#27251F]/60" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copy Template</p>
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(template)}
                                className="hover:bg-[#E51636]/10 hover:text-[#E51636] h-10 w-10"
                              >
                                <Trash2 className="w-5 h-5 text-[#27251F]/60" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete Template</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Confirm Delete
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{templateToDelete?.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={confirmDelete}
                  variant="red"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}