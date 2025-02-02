import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const Kitchen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active tab based on current path
  const getCurrentTab = () => {
    if (location.pathname.includes('/food-safety')) return 0;
    return 0; // Default to food safety
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    switch (newValue) {
      case 0:
        navigate('/kitchen/food-safety');
        break;
      default:
        navigate('/kitchen/food-safety');
    }
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#E51636] to-[#DD0031] rounded-[20px] p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10" />
          <div className="relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">Kitchen Management</h1>
                <p className="text-white/80 mt-2 text-lg">Manage and track kitchen operations</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleBackToDashboard}
                  className="bg-white text-[#E51636] hover:bg-white/90 h-12 px-6"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <Outlet />
      </div>
    </div>
  );
};

export default Kitchen; 