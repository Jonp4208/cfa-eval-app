import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Typography,
  Link,
  Chip,
  Stack,
  InputAdornment,
  Card,
  CardContent,
  CardMedia,
  Collapse,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Link as LinkIcon,
  VideoLibrary as VideoIcon,
  Description as DocumentIcon,
  Search as SearchIcon,
  Sort as SortIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { TrainingMaterial } from '../../../../types';

interface MaterialListProps {
  materials: TrainingMaterial[];
  onChange: (materials: TrainingMaterial[]) => void;
}

interface MaterialDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (material: Omit<TrainingMaterial, 'id'>) => void;
  material?: TrainingMaterial;
}

interface VideoPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

const VideoPreviewDialog: React.FC<VideoPreviewDialogProps> = ({
  open,
  onClose,
  url,
  title,
}) => {
  // Extract video ID from YouTube URL
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return match ? match[1] : null;
  };

  const videoId = getYouTubeId(url);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {videoId ? (
          <Box sx={{ position: 'relative', paddingTop: '56.25%' /* 16:9 aspect ratio */ }}>
            <iframe
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
              src={`https://www.youtube.com/embed/${videoId}`}
              title={title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </Box>
        ) : (
          <Typography color="error">Invalid YouTube URL</Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

const MaterialDialog: React.FC<MaterialDialogProps> = ({
  open,
  onClose,
  onSave,
  material,
}) => {
  const [formData, setFormData] = useState({
    title: material?.title || '',
    type: material?.type || '',
    url: material?.url || '',
    category: material?.category || '',
  });

  const [errors, setErrors] = useState({
    title: '',
    type: '',
    url: '',
    category: '',
  });

  const validateForm = () => {
    const newErrors = {
      title: '',
      type: '',
      url: '',
      category: '',
    };
    let isValid = true;

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
      isValid = false;
    }

    if (!formData.type) {
      newErrors.type = 'Type is required';
      isValid = false;
    }

    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
      isValid = false;
    } else {
      try {
        new URL(formData.url);
      } catch {
        newErrors.url = 'Invalid URL format';
        isValid = false;
      }
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSave(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      type: '',
      url: '',
      category: '',
    });
    setErrors({
      title: '',
      type: '',
      url: '',
      category: '',
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{material ? 'Edit Material' : 'Add Material'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            error={!!errors.title}
            helperText={errors.title}
            fullWidth
          />

          <FormControl error={!!errors.type} fullWidth>
            <InputLabel>Type</InputLabel>
            <Select
              value={formData.type}
              label="Type"
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <MenuItem value="DOCUMENT">Document</MenuItem>
              <MenuItem value="VIDEO">Video</MenuItem>
              <MenuItem value="PATHWAY_LINK">Pathway Link</MenuItem>
            </Select>
            {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
          </FormControl>

          <TextField
            label="URL"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            error={!!errors.url}
            helperText={errors.url}
            fullWidth
          />

          <TextField
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            error={!!errors.category}
            helperText={errors.category}
            placeholder="e.g., Required Reading, Reference Material"
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {material ? 'Save Changes' : 'Add Material'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const MaterialList: React.FC<MaterialListProps> = ({ materials, onChange }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<TrainingMaterial | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [sortBy, setSortBy] = useState<'title' | 'type' | 'category'>('title');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Get unique categories for filtering
  const categories = useMemo(() => {
    const uniqueCategories = new Set(materials.map(m => m.category));
    return Array.from(uniqueCategories);
  }, [materials]);

  // Filter and sort materials
  const filteredAndSortedMaterials = useMemo(() => {
    return materials
      .filter(material => {
        const matchesSearch = material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          material.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = !selectedType || material.type === selectedType;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        const direction = sortDirection === 'asc' ? 1 : -1;
        if (sortBy === 'title') {
          return direction * a.title.localeCompare(b.title);
        }
        if (sortBy === 'type') {
          return direction * a.type.localeCompare(b.type);
        }
        return direction * a.category.localeCompare(b.category);
      });
  }, [materials, searchQuery, selectedType, sortBy, sortDirection]);

  const handleSort = (field: 'title' | 'type' | 'category') => {
    if (sortBy === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const handlePreview = (material: TrainingMaterial) => {
    if (material.type === 'VIDEO') {
      setPreviewUrl(material.url);
      setPreviewTitle(material.title);
      setIsPreviewOpen(true);
    }
  };

  const handleAdd = (material: Omit<TrainingMaterial, 'id'>) => {
    const newMaterial = {
      ...material,
      id: Date.now().toString(), // Temporary ID, will be replaced by server
    };
    onChange([...materials, newMaterial]);
  };

  const handleEdit = (material: Omit<TrainingMaterial, 'id'>) => {
    if (!selectedMaterial) return;
    
    const updatedMaterials = materials.map((m) =>
      m.id === selectedMaterial.id ? { ...material, id: selectedMaterial.id } : m
    );
    onChange(updatedMaterials);
    setSelectedMaterial(undefined);
  };

  const handleDelete = (materialId: string) => {
    onChange(materials.filter((m) => m.id !== materialId));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'DOCUMENT':
        return <DocumentIcon />;
      case 'VIDEO':
        return <VideoIcon />;
      case 'PATHWAY_LINK':
        return <LinkIcon />;
      default:
        return <DocumentIcon />;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Training Materials</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedMaterial(undefined);
            setIsDialogOpen(true);
          }}
          size="small"
        >
          Add Material
        </Button>
      </Box>

      <Stack spacing={2} sx={{ mb: 2 }}>
        <TextField
          placeholder="Search materials..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          size="small"
        />

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={selectedType}
              label="Type"
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="DOCUMENT">Documents</MenuItem>
              <MenuItem value="VIDEO">Videos</MenuItem>
              <MenuItem value="PATHWAY_LINK">Pathway Links</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              startIcon={<SortIcon />}
              onClick={() => handleSort('title')}
              variant={sortBy === 'title' ? 'contained' : 'outlined'}
            >
              Title {sortBy === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
            </Button>
            <Button
              size="small"
              startIcon={<SortIcon />}
              onClick={() => handleSort('type')}
              variant={sortBy === 'type' ? 'contained' : 'outlined'}
            >
              Type {sortBy === 'type' && (sortDirection === 'asc' ? '↑' : '↓')}
            </Button>
            <Button
              size="small"
              startIcon={<SortIcon />}
              onClick={() => handleSort('category')}
              variant={sortBy === 'category' ? 'contained' : 'outlined'}
            >
              Category {sortBy === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
            </Button>
          </Box>
        </Box>
      </Stack>

      <List>
        {filteredAndSortedMaterials.map((material) => (
          <Card key={material.id} sx={{ mb: 1 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                  {getIcon(material.type)}
                  <Box>
                    <Link
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ display: 'block' }}
                    >
                      {material.title}
                    </Link>
                    <Typography variant="body2" color="text.secondary">
                      {material.category}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {material.type === 'VIDEO' && (
                    <Button
                      size="small"
                      onClick={() => handlePreview(material)}
                    >
                      Preview
                    </Button>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedMaterial(material);
                      setIsDialogOpen(true);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(material.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </List>

      <MaterialDialog
        open={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedMaterial(undefined);
        }}
        onSave={selectedMaterial ? handleEdit : handleAdd}
        material={selectedMaterial}
      />

      <VideoPreviewDialog
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        url={previewUrl}
        title={previewTitle}
      />
    </Box>
  );
};

export default MaterialList; 