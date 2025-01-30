import React from 'react';
import { Link } from 'react-router-dom';
import { Home, CheckSquare, Users, ClipboardCheck, BarChart3, GraduationCap } from 'lucide-react';
import { cn } from '../lib/utils';

const SideNav = () => {
  const pathname = window.location.pathname;

  return (
    <div className="flex flex-col h-screen">
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t py-2 px-4 z-50">
        <div className="flex justify-between items-center">
          <Link 
            to="/" 
            className={cn(
              "flex flex-col items-center text-[#27251F]/60 hover:text-[#E51636]",
              pathname === '/' && "text-[#E51636]"
            )}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link 
            to="/tasks" 
            className={cn(
              "flex flex-col items-center text-[#27251F]/60 hover:text-[#E51636]",
              pathname === '/tasks' && "text-[#E51636]"
            )}
          >
            <CheckSquare className="h-5 w-5" />
            <span className="text-xs mt-1">Tasks</span>
          </Link>
          <Link 
            to="/team" 
            className={cn(
              "flex flex-col items-center text-[#27251F]/60 hover:text-[#E51636]",
              pathname === '/team' && "text-[#E51636]"
            )}
          >
            <Users className="h-5 w-5" />
            <span className="text-xs mt-1">Team</span>
          </Link>
          <Link 
            to="/evaluations" 
            className={cn(
              "flex flex-col items-center text-[#27251F]/60 hover:text-[#E51636]",
              pathname === '/evaluations' && "text-[#E51636]"
            )}
          >
            <ClipboardCheck className="h-5 w-5" />
            <span className="text-xs mt-1">Evaluations</span>
          </Link>
          <Link 
            to="/analytics" 
            className={cn(
              "flex flex-col items-center text-[#27251F]/60 hover:text-[#E51636]",
              pathname === '/analytics' && "text-[#E51636]"
            )}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs mt-1">Analytics</span>
          </Link>
          <Link 
            to="/training" 
            className={cn(
              "flex flex-col items-center text-[#27251F]/60 hover:text-[#E51636]",
              pathname === '/training' && "text-[#E51636]"
            )}
          >
            <GraduationCap className="h-5 w-5" />
            <span className="text-xs mt-1">Training</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SideNav; 