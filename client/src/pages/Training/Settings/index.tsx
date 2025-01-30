import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { TrainingPosition, TrainingCategory } from '../../../types';
import PositionsTable from './components/PositionsTable';
import CategoriesTable from './components/CategoriesTable';
import AddPositionDialog from './components/AddPositionDialog';
import AddCategoryDialog from './components/AddCategoryDialog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`training-settings-tabpanel-${index}`}
      aria-labelledby={`training-settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const TrainingSettings = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [positions, setPositions] = useState<TrainingPosition[]>([]);
  const [categories, setCategories] = useState<TrainingCategory[]>([]);
  const [isAddPositionOpen, setIsAddPositionOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  useEffect(() => {
    // Fetch positions and categories
    fetchPositionsAndCategories();
  }, []);

  const fetchPositionsAndCategories = async () => {
    try {
      const [positionsRes, categoriesRes] = await Promise.all([
        fetch('/api/training/positions'),
        fetch('/api/training/categories')
      ]);
      
      const positionsData = await positionsRes.json();
      const categoriesData = await categoriesRes.json();
      
      setPositions(positionsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching training settings:', error);
      // TODO: Add error notification
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddPosition = async (position: Omit<TrainingPosition, 'id'>) => {
    try {
      const response = await fetch('/api/training/positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(position),
      });
      
      if (response.ok) {
        await fetchPositionsAndCategories();
        setIsAddPositionOpen(false);
      }
    } catch (error) {
      console.error('Error adding position:', error);
      // TODO: Add error notification
    }
  };

  const handleAddCategory = async (category: Omit<TrainingCategory, 'id'>) => {
    try {
      const response = await fetch('/api/training/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(category),
      });
      
      if (response.ok) {
        await fetchPositionsAndCategories();
        setIsAddCategoryOpen(false);
      }
    } catch (error) {
      console.error('Error adding category:', error);
      // TODO: Add error notification
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Training Settings
      </Typography>

      <Card>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Positions" />
              <Tab label="Categories" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setIsAddPositionOpen(true)}
              >
                Add Position
              </Button>
            </Box>
            <PositionsTable 
              positions={positions}
              onUpdate={fetchPositionsAndCategories}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setIsAddCategoryOpen(true)}
              >
                Add Category
              </Button>
            </Box>
            <CategoriesTable 
              categories={categories}
              onUpdate={fetchPositionsAndCategories}
            />
          </TabPanel>
        </CardContent>
      </Card>

      <AddPositionDialog
        open={isAddPositionOpen}
        onClose={() => setIsAddPositionOpen(false)}
        onAdd={handleAddPosition}
        categories={categories}
      />

      <AddCategoryDialog
        open={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onAdd={handleAddCategory}
      />
    </Box>
  );
};

export default TrainingSettings; 