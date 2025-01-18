import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, TrendingUp, ClipboardList, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const navItems = [
    {
      icon: Home,
      label: 'Home',
      href: '/',
    },
    {
      icon: Users,
      label: user?.position === 'Team Member' ? 'ME' : 'Team',
      href: user?.position === 'Team Member' ? `/users/${user?._id}` : '/users',
    },
    {
      icon: ClipboardList,
      label: user?.position === 'Team Member' ? 'My Evaluations' : 'Evaluations',
      href: '/evaluations',
    },
    {
      icon: Settings,
      label: 'Settings',
      href: '/settings',
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50 safe-area-bottom">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/' 
            ? location.pathname === '/'
            : location.pathname.startsWith(item.href);

          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
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