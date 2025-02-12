import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  Home,
  ChefHat,
  CheckSquare,
  ClipboardList,
  GraduationCap
} from 'lucide-react';

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleNavigation = (href: string) => {
    navigate(href);
  };

  const navItems = [
    {
      icon: Home,
      label: 'Home',
      href: '/',
      show: true
    },
    {
      icon: ChefHat,
      label: 'Kitchen',
      href: '/kitchen',
      show: user?.departments?.includes('Kitchen') || ['Director', 'Leader'].includes(user?.position || '')
    },
    {
      icon: CheckSquare,
      label: 'Tasks',
      href: '/tasks',
      show: true
    },
    {
      icon: ClipboardList,
      label: user?.position === 'Team Member' ? 'My Evals' : 'Evals',
      href: '/evaluations',
      show: true
    },
    {
      icon: GraduationCap,
      label: 'Training',
      href: '/training',
      show: true
    }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50 safe-area-bottom">
      <div className="flex items-center justify-around">
        {navItems
          .filter(item => item.show)
          .map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/' 
              ? location.pathname === '/'
              : location.pathname.startsWith(item.href);

            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 min-w-[64px] min-h-[64px] touch-manipulation",
                  "transition-colors duration-200",
                  isActive ? "text-red-600" : "text-gray-500 hover:text-gray-900"
                )}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
      </div>
    </nav>
  );
} 