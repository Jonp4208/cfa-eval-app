import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  ClipboardList,
  Settings,
  LogOut,
  Menu as MenuIcon,
  Home,
  ChevronDown,
  TrendingUp,
  AlertTriangle,
  X,
  Bell,
  Search as SearchIcon,
  Clock,
  Target,
  BarChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(false);
  const [pendingEvaluations, setPendingEvaluations] = useState(0);
  const [newDisciplinaryItems, setNewDisciplinaryItems] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [upcomingEvaluations, setUpcomingEvaluations] = useState<any[]>([]);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close notifications when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch initial counts and notification status
  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboardResponse = await api.get('/api/dashboard/stats');
        const pendingCount = dashboardResponse.data.pendingEvaluations || 0;
        setPendingEvaluations(pendingCount);
        setHasNotifications(pendingCount > 0);
        setUpcomingEvaluations(dashboardResponse.data.upcomingEvaluations || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (user?.store?._id) {
      fetchData();
      // Refresh every 5 minutes
      const interval = setInterval(fetchData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user?.store?._id]);

  const menuItems = [
    {
      icon: Home,
      label: 'Dashboard',
      href: '/',
      show: true,
      badge: null
    },
    {
      icon: Users,
      label: 'Team Members',
      href: '/users',
      show: true,
      badge: null,
      submenu: [
        {
          icon: Users,
          label: 'View All',
          href: '/users',
          badge: null
        },
        {
          icon: ClipboardList,
          label: 'Evaluations',
          href: '/evaluations',
          badge: pendingEvaluations > 0 ? pendingEvaluations.toString() : null,
          color: pendingEvaluations > 0 ? 'text-red-600' : undefined
        },
        {
          icon: AlertTriangle,
          label: 'Disciplinary',
          href: '/disciplinary',
          badge: newDisciplinaryItems > 0 ? newDisciplinaryItems.toString() : null,
          color: newDisciplinaryItems > 0 ? 'text-red-600' : undefined
        },
        {
          icon: ClipboardList,
          label: 'Training',
          href: '/future',
          badge: null
        }
      ]
    },
    {
      icon: Target,
      label: 'Goals',
      href: '/goals',
      show: true,
      badge: null
    },
    {
      icon: TrendingUp,
      label: 'Developmental',
      href: '/future',
      show: true,
      badge: null
    },
    {
      icon: BarChart,
      label: 'Analytics',
      href: '/analytics',
      show: true,
      badge: null
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b z-50">
        <div className="h-16 mx-auto max-w-7xl px-4 flex items-center justify-between gap-8">
          {/* Left Section: Logo and Store Info */}
          <div className="flex items-center gap-8">
            {/* Logo and Store Info */}
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-red-600" />
              <div className="flex flex-col">
                <span className="font-bold">Growth Hub</span>
                <span className="text-xs text-gray-500">#{user?.store?.storeNumber || '00000'}</span>
              </div>
            </div>

            {/* Desktop Navigation Items */}
            <div className="hidden md:flex items-center gap-1">
              {menuItems
                .filter(item => item.show)
                .map(item => {
                  const Icon = item.icon;
                  const isActive = item.href === '/' 
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.href);

                  if (item.submenu) {
                    return (
                      <DropdownMenu key={item.href}>
                        <DropdownMenuTrigger asChild>
                          <button
                            className={cn(
                              "px-4 py-2 flex items-center gap-2 rounded-xl",
                              (isActive || item.submenu.some(sub => location.pathname.startsWith(sub.href)))
                                ? "bg-red-50 text-red-600" 
                                : "hover:bg-gray-50 text-gray-600"
                            )}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{item.label}</span>
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 py-2 bg-white">
                          {item.submenu.map(subItem => {
                            const SubIcon = subItem.icon;
                            const isSubActive = location.pathname.startsWith(subItem.href);
                            return (
                              <DropdownMenuItem
                                key={subItem.href}
                                onClick={() => navigate(subItem.href)}
                                className={cn(
                                  "cursor-pointer px-3 py-2 text-sm hover:bg-gray-50",
                                  isSubActive && "bg-red-50 text-red-600"
                                )}
                              >
                                <SubIcon className="w-4 h-4 mr-3" />
                                <span className="flex-1">{subItem.label}</span>
                                {subItem.badge && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                                    {subItem.badge}
                                  </span>
                                )}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  }

                  return (
                    <button
                      key={item.href}
                      onClick={() => navigate(item.href)}
                      className={cn(
                        "px-4 py-2 flex items-center gap-2 rounded-xl",
                        isActive 
                          ? "bg-red-50 text-red-600" 
                          : "hover:bg-gray-50 text-gray-600"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Right Section: Search and Actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative w-48">
              <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                type="search"
                placeholder="Search"
                className="pl-8 h-8 text-sm"
              />
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden flex flex-col items-center"
            >
              <MenuIcon className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button 
                className="relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-5 h-5" />
                {hasNotifications && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-600 rounded-full"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold">Notifications</h3>
                  </div>
                  
                  {pendingEvaluations > 0 ? (
                    <div className="p-4">
                      <div className="space-y-4">
                        {upcomingEvaluations.map((evaluation) => (
                          <div 
                            key={evaluation.id}
                            className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                            onClick={() => {
                              navigate(`/evaluations/${evaluation.id}`);
                              setShowNotifications(false);
                            }}
                          >
                            <div className="mt-1">
                              <Clock className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{evaluation.employeeName}</p>
                              <p className="text-sm text-gray-500">{evaluation.templateName}</p>
                              <p className="text-xs text-gray-400">
                                Due {new Date(evaluation.scheduledDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-4 border-t">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            navigate('/evaluations');
                            setShowNotifications(false);
                          }}
                        >
                          View All Evaluations
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>No new notifications</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-gray-50 rounded-xl px-3 py-2">
                  <span className="text-sm font-medium">{user?.name?.split(' ')[0]}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 py-2 bg-white">
                <DropdownMenuItem
                  onClick={() => navigate(`/users/${user?._id}`)}
                  className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <Users className="w-4 h-4 mr-3" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => navigate('/settings')}
                  className="cursor-pointer px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer px-3 py-2 text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-gray-800 bg-opacity-50 z-40">
          <div className="fixed top-0 right-0 bottom-0 w-64 bg-white shadow-lg">
            <div className="p-4 border-b flex justify-between items-center">
              <span className="font-bold">Menu</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-2">
              {menuItems
                .filter(item => item.show)
                .map(item => {
                  const Icon = item.icon;
                  const isActive = item.href === '/' 
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.href);

                  // If item has submenu, render it and its subitems
                  if (item.submenu) {
                    const isSubActive = item.submenu.some(sub => 
                      location.pathname.startsWith(sub.href)
                    );
                    return (
                      <div key={item.href}>
                        <button
                          className={cn(
                            "w-full px-4 py-3 flex items-center justify-between",
                            (isActive || isSubActive) ? "bg-red-50" : "hover:bg-gray-50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={cn(
                              "w-5 h-5",
                              (isActive || isSubActive) ? "text-red-600" : "text-gray-500"
                            )} />
                            <span className={cn(
                              "text-base",
                              (isActive || isSubActive) ? "text-red-600" : "text-gray-900"
                            )}>
                              {item.label}
                            </span>
                          </div>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </button>
                        <div className="pl-4 py-1 bg-gray-50">
                          {item.submenu.map(subItem => {
                            const SubIcon = subItem.icon;
                            const isSubItemActive = location.pathname.startsWith(subItem.href);
                            return (
                              <button
                                key={subItem.href}
                                onClick={() => {
                                  navigate(subItem.href);
                                  setIsMobileMenuOpen(false);
                                }}
                                className={cn(
                                  "w-full px-4 py-2 flex items-center justify-between",
                                  isSubItemActive ? "bg-red-50" : "hover:bg-gray-100"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <SubIcon className={cn(
                                    "w-4 h-4",
                                    subItem.color || (isSubItemActive ? "text-red-600" : "text-gray-500")
                                  )} />
                                  <span className={cn(
                                    "text-sm",
                                    subItem.color || (isSubItemActive ? "text-red-600" : "text-gray-900")
                                  )}>
                                    {subItem.label}
                                  </span>
                                </div>
                                {subItem.badge && (
                                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600">
                                    {subItem.badge}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  // Regular menu item without submenu
                  return (
                    <button
                      key={item.href}
                      onClick={() => {
                        navigate(item.href);
                        setIsMobileMenuOpen(false);
                      }}
                      className={cn(
                        "w-full px-4 py-3 flex items-center justify-between",
                        isActive ? "bg-red-50" : "hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={cn(
                          "w-5 h-5",
                          item.color || (isActive ? "text-red-600" : "text-gray-500")
                        )} />
                        <span className={cn(
                          "text-base",
                          item.color || (isActive ? "text-red-600" : "text-gray-900")
                        )}>
                          {item.label}
                        </span>
                      </div>
                      {item.badge && (
                        <span className="px-2.5 py-0.5 rounded-full text-sm font-medium bg-red-50 text-red-600">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-sm text-gray-500">{user?.role}</p>
                </div>
                <button 
                  onClick={logout}
                  className="text-gray-500 hover:text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4">
          {children}
        </div>
      </div>
    </div>
  );
}