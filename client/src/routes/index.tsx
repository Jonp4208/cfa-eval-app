import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import TaskManagement from '../pages/TaskManagement';
import Evaluations from '../pages/Evaluations/index';
import NewEvaluation from '../pages/Evaluations/NewEvaluation';
import { EmployeeReview } from '../pages/Evaluations/EmployeeReview';
import EnhancedEvaluationForm from '../pages/Evaluations/EnhancedEvaluationForm';
import { EvaluationHistory } from '../pages/Evaluations/EvaluationHistory';
import EvaluationsList from '../pages/Evaluations/EvaluationsList';
import Templates from '@/pages/Templates/index';
import TemplateBuilder from '../pages/Templates/TemplateBuilder';
import Settings from '../pages/Settings/index';
import Users from '../pages/users/index';
import UserProfile from '../pages/users/[id]/index';
import EditUser from '../pages/users/[id]/edit';
import ViewEvaluation from '@/pages/Evaluations/ViewEvaluation';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AnalyticsHub from '@/pages/Analytics';
import HeartsAndHands from '@/pages/Analytics/HeartsAndHands';
import DayVsNight from '@/pages/Analytics/DayVsNight';
import DisciplinaryPage from '@/pages/Disciplinary';
import NewIncident from '@/pages/Disciplinary/NewIncident';
import IncidentDetail from '@/pages/Disciplinary/[id]';
import TeamScores from '@/pages/Analytics/TeamScores';
import Kitchen from '@/pages/Kitchen';
import FoodSafety from '@/pages/Kitchen/FoodSafety';
import CompleteChecklist from '@/pages/Kitchen/FoodSafety/CompleteChecklist';
import History from '@/pages/Kitchen/FoodSafety/History';
import FuturePage from '@/pages/FuturePage';
import AssignManagers from '../pages/users/AssignManagers';
import ViewCompletion from '@/pages/Kitchen/FoodSafety/ViewCompletion';

interface PrivateRouteProps {
  children: React.ReactNode;
}

function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, isLoading } = useAuth();
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Layout>{children}</Layout>;
}

export const publicRoutes = [
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/register',
    element: <Register />
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />
  },
  {
    path: '/reset-password',
    element: <ResetPassword />
  }
];

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/tasks" element={<PrivateRoute><TaskManagement /></PrivateRoute>} />
      <Route path="/evaluations" element={<PrivateRoute><Evaluations /></PrivateRoute>} />
      <Route path="/evaluations/new" element={<PrivateRoute><NewEvaluation /></PrivateRoute>} />
      <Route path="/evaluations/:id/review" element={<PrivateRoute><EmployeeReview /></PrivateRoute>} />
      <Route path="/evaluations/:id/acknowledge" element={<PrivateRoute><EnhancedEvaluationForm /></PrivateRoute>} />
      <Route path="/evaluations/:id/history" element={<PrivateRoute><EvaluationHistory employeeId={''} /></PrivateRoute>} />
      <Route path="/evaluations/:id/list" element={<PrivateRoute><EvaluationsList /></PrivateRoute>} />
      <Route path="/evaluations/:id" element={<PrivateRoute><ViewEvaluation /></PrivateRoute>} />
      
      <Route path="/goals" element={<PrivateRoute><FuturePage /></PrivateRoute>} />
      
      <Route path="/kitchen" element={<PrivateRoute><Kitchen /></PrivateRoute>}>
        <Route index element={<Navigate to="/kitchen/food-safety" replace />} />
        <Route path="food-safety" element={<FoodSafety />} />
        <Route path="food-safety/complete/:id" element={<CompleteChecklist />} />
        <Route path="food-safety/history/:id" element={<History />} />
        <Route path="food-safety/checklist/:id/completion/:completionId" element={<ViewCompletion />} />
      </Route>
      
      <Route path="/templates" element={<PrivateRoute><Templates /></PrivateRoute>} />
      <Route path="/templates/new" element={<PrivateRoute><TemplateBuilder /></PrivateRoute>} />
      <Route path="/templates/:id/edit" element={<PrivateRoute><TemplateBuilder /></PrivateRoute>} />
      <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
      <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
      <Route path="/users/assign-managers" element={<PrivateRoute><AssignManagers /></PrivateRoute>} />
      <Route path="/users/:id" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
      <Route path="/users/:id/edit" element={<PrivateRoute><EditUser /></PrivateRoute>} />
      <Route path="/disciplinary" element={<PrivateRoute><DisciplinaryPage /></PrivateRoute>} />
      <Route path="/disciplinary/new" element={<PrivateRoute><NewIncident /></PrivateRoute>} />
      <Route path="/disciplinary/:id" element={<PrivateRoute><IncidentDetail /></PrivateRoute>} />
      <Route path="/analytics" element={<PrivateRoute><AnalyticsHub /></PrivateRoute>}>
        <Route path="hearts-and-hands" element={<HeartsAndHands />} />
        <Route path="team-scores" element={<TeamScores />} />
        <Route path="day-vs-night" element={<DayVsNight />} />
      </Route>
      <Route path="/future" element={<PrivateRoute><FuturePage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// client/src/components/Layout.tsx
