import React, { ReactNode } from 'react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  showBackButton?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions, showBackButton = true }) => {
  const navigate = useNavigate();
  
  return (
    <div className="bg-[#E51636] rounded-[20px] p-6 text-white">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && (
              <p className="text-white/80 mt-1">{subtitle}</p>
            )}
          </div>
          {showBackButton && (
            <Button 
              className="bg-white/10 text-white hover:bg-white/20 h-10 px-4 rounded-xl"
              onClick={() => navigate('/dashboard')}
            >
              Back
            </Button>
          )}
        </div>
        {actions && (
          <div className="w-full">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader; 