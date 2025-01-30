import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { TrainingPlan } from '../../../types';
import AddTemplateDialog from './components/AddTemplateDialog';
import EditTemplateDialog from './components/EditTemplateDialog';
import DeleteConfirmDialog from '../../../components/DeleteConfirmDialog';

const TrainingTemplates = () => {
  const theme = useTheme();
  const [templates, setTemplates] = useState<TrainingPlan[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<TrainingPlan | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/training/templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates:', error);
      // TODO: Add error notification
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, template: TrainingPlan) => {
    setMenuAnchorEl(event.currentTarget);
    setActiveTemplateId(template.id);
    setSelectedTemplate(template);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setActiveTemplateId(null);
  };

  const handleEdit = () => {
    setIsEditDialogOpen(true);
    handleMenuClose();
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleDuplicate = async () => {
    if (!selectedTemplate) return;

    try {
      const response = await fetch(`/api/training/templates/${selectedTemplate.id}/duplicate`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchTemplates();
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
      // TODO: Add error notification
    }
    handleMenuClose();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTemplate) return;

    try {
      const response = await fetch(`/api/training/templates/${selectedTemplate.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTemplates();
        setIsDeleteDialogOpen(false);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      // TODO: Add error notification
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Training Templates</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setIsAddDialogOpen(true)}
        >
          Create Template
        </Button>
      </Box>

      <Grid container spacing={3}>
        {templates.map((template) => (
          <Grid item xs={12} sm={6} md={4} key={template.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {template.name}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={template.department}
                        color={template.department === 'FOH' ? 'primary' : 'secondary'}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        label={template.type}
                        color="default"
                        size="small"
                      />
                    </Box>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, template)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Duration: {template.numberOfDays} days
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Modules: {template.modules.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>Edit</MenuItem>
        <MenuItem onClick={handleDuplicate}>
          <ContentCopyIcon fontSize="small" sx={{ mr: 1 }} />
          Duplicate
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          Delete
        </MenuItem>
      </Menu>

      <AddTemplateDialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSave={fetchTemplates}
      />

      {selectedTemplate && (
        <>
          <EditTemplateDialog
            template={selectedTemplate}
            open={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            onSave={fetchTemplates}
          />

          <DeleteConfirmDialog
            open={isDeleteDialogOpen}
            onClose={() => setIsDeleteDialogOpen(false)}
            onConfirm={handleDeleteConfirm}
            title="Delete Template"
            content={`Are you sure you want to delete the template "${selectedTemplate.name}"? This action cannot be undone.`}
          />
        </>
      )}
    </Box>
  );
};

export default TrainingTemplates; 