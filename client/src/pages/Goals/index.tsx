import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

const categories = [
  'Operational',
  'Service',
  'Leadership',
  'Training',
  'Team Building',
  'Guest Experience'
];

interface Step {
  text: string;
  completed: boolean;
}

interface Goal {
  id: string;
  name: string;
  description: string;
  category: string;
  progress: number;
  dueDate: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'overdue';
  steps: Step[];
}

export default function Goals() {
  const [showNewGoalForm, setShowNewGoalForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    description: '',
    category: '',
    dueDate: '',
    steps: ['']
  });

  const { data: goals, isLoading } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: async () => {
      const response = await api.get('/api/goals');
      return response.data;
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    );
  }

  const activeGoals = goals?.filter(goal => goal.status !== 'completed') || [];
  const completedGoals = goals?.filter(goal => goal.status === 'completed') || [];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">Development Goals</h1>
            <p className="text-gray-500">Track and manage your personal development goals</p>
          </div>
          <Button 
            className="bg-red-600 hover:bg-red-700"
            onClick={() => setShowNewGoalForm(true)}
          >
            Add New Goal
          </Button>
        </div>

        {/* New Goal Form */}
        {showNewGoalForm && (
          <Card className="mb-6">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Create New Goal</h2>
                <Button 
                  variant="ghost"
                  onClick={() => setShowNewGoalForm(false)}
                >
                  Cancel
                </Button>
              </div>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Goal Title</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter goal title"
                    value={newGoal.name}
                    onChange={(e) => setNewGoal({...newGoal, name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={3}
                    placeholder="Describe your goal and what you want to achieve"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={newGoal.category}
                      onChange={(e) => setNewGoal({...newGoal, category: e.target.value})}
                    >
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Target Date</label>
                    <input
                      type="date"
                      className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={newGoal.dueDate}
                      onChange={(e) => setNewGoal({...newGoal, dueDate: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Action Steps</label>
                  <div className="space-y-2">
                    {newGoal.steps.map((step, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="Add an action step"
                          value={step}
                          onChange={(e) => {
                            const updatedSteps = [...newGoal.steps];
                            updatedSteps[index] = e.target.value;
                            setNewGoal({...newGoal, steps: updatedSteps});
                          }}
                        />
                        {index === newGoal.steps.length - 1 && (
                          <Button
                            variant="outline"
                            onClick={() => setNewGoal({...newGoal, steps: [...newGoal.steps, '']})}
                          >
                            Add Step
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowNewGoalForm(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-red-600 hover:bg-red-700">
                    Create Goal
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        )}

        {/* Active Goals */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Active Goals</h2>
          <div className="space-y-4">
            {activeGoals.map((goal) => (
              <Card key={goal.id}>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium">{goal.name}</h3>
                      <p className="text-gray-500">{goal.description}</p>
                    </div>
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                      {goal.category}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium">{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full" 
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {goal.steps?.map((step, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={step.completed}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          onChange={() => {}}
                        />
                        <span className={step.completed ? 'text-gray-500 line-through' : ''}>
                          {step.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      Due {new Date(goal.dueDate).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Update Progress</Button>
                      <Button variant="outline" size="sm">Mark Complete</Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Completed Goals */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Completed Goals</h2>
          <div className="space-y-4">
            {completedGoals.map((goal) => (
              <Card key={goal.id}>
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium">{goal.name}</h3>
                      <p className="text-gray-500">{goal.description}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        Completed
                      </span>
                      <span className="text-sm text-gray-500 mt-2">
                        {new Date(goal.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 