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
  BarChart,
  User2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileNav } from './MobileNav';

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
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

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
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b z-50">
        <div className="h-16 px-4 flex items-center justify-between">
          {/* Logo and Store Info */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity touch-manipulation"
          >
            <TrendingUp className="h-6 w-6 text-red-600" />
            <div className="flex flex-col">
              <span className="font-bold">Growth Hub</span>
              <span className="text-xs text-gray-500">#{user?.store?.storeNumber || '00000'}</span>
            </div>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 hover:bg-gray-50 rounded-xl touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <MenuIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Desktop Navigation Bar */}
      <div className="hidden md:block fixed top-0 left-0 right-0 bg-white border-b z-50">
        <div className="h-16 mx-auto max-w-7xl px-4 flex items-center justify-between gap-8">
          {/* Left Section: Logo and Store Info */}
          <div className="flex items-center gap-8">
            {/* Logo and Store Info */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <TrendingUp className="h-6 w-6 text-red-600" />
              <div className="flex flex-col">
                <span className="font-bold">Growth Hub</span>
                <span className="text-xs text-gray-500">#{user?.store?.storeNumber || '00000'}</span>
              </div>
            </button>

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
                              "px-4 py-2 flex items-center gap-2 rounded-xl min-h-[44px]",
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
                        <DropdownMenuContent align="start" className="w-56">
                          {item.submenu.map(subItem => {
                            const SubIcon = subItem.icon;
                            const isSubActive = location.pathname.startsWith(subItem.href);
                            return (
                              <DropdownMenuItem
                                key={subItem.href}
                                onClick={() => navigate(subItem.href)}
                                className={cn(
                                  "flex items-center gap-2 min-h-[44px] cursor-pointer",
                                  isSubActive ? "bg-red-50" : ""
                                )}
                              >
                                <SubIcon className={cn(
                                  "w-4 h-4",
                                  subItem.color || (isSubActive ? "text-red-600" : "text-gray-400")
                                )} />
                                <span className={cn(
                                  subItem.color || (isSubActive ? "text-red-600" : "text-gray-700")
                                )}>
                                  {subItem.label}
                                </span>
                                {subItem.badge && (
                                  <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
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

                  // Regular menu item without submenu
                  return (
                    <button
                      key={item.href}
                      onClick={() => navigate(item.href)}
                      className={cn(
                        "px-4 py-2 flex items-center gap-2 rounded-xl min-h-[44px]",
                        isActive ? "bg-red-50 text-red-600" : "hover:bg-gray-50 text-gray-600"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Right Section: Search and Actions */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative w-48">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#27251F]/40" />
              <Input 
                type="search"
                placeholder="Search"
                className="pl-10 h-12 text-base rounded-xl border-gray-200 focus:ring-2 focus:ring-[#E51636] focus:border-transparent"
              />
            </div>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button 
                className="relative p-2 hover:bg-gray-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="w-5 h-5 text-[#27251F]" />
                {hasNotifications && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-[#E51636] rounded-full"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-[20px] shadow-md border py-2 z-50">
                  <div className="px-4 py-2 border-b">
                    <h3 className="font-medium text-[#27251F]">Notifications</h3>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto momentum-scroll custom-scrollbar">
                    {upcomingEvaluations.length > 0 ? (
                      upcomingEvaluations.map((evaluation: any) => (
                        <button
                          key={evaluation._id}
                          onClick={() => {
                            navigate(`/evaluations/${evaluation._id}`);
                            setShowNotifications(false);
                          }}
                          className="w-full px-4 py-2 hover:bg-gray-50 text-left flex items-start gap-3 min-h-[44px]"
                        >
                          <div className="w-8 h-8 rounded-full bg-[#E51636]/10 flex items-center justify-center flex-shrink-0">
                            <ClipboardList className="w-4 h-4 text-[#E51636]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#27251F]">
                              Upcoming Evaluation: {evaluation.employee?.name || 'Unknown Employee'}
                            </p>
                            <p className="text-xs text-[#27251F]/60">
                              Scheduled for {new Date(evaluation.scheduledDate).toLocaleDateString()}
                            </p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-[#27251F]/60">
                        No new notifications
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity min-h-[44px]">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <User2 className="w-4 h-4 text-gray-600" />
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onClick={() => navigate('/settings')}
                  className="flex items-center gap-2 min-h-[44px] cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={logout}
                  className="flex items-center gap-2 min-h-[44px] cursor-pointer text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
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
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-gray-500 min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-2 overflow-y-auto momentum-scroll custom-scrollbar h-[calc(100vh-64px)]">
              {menuItems
                .filter(item => item.show)
                .map(item => {
                  const Icon = item.icon;
                  const isActive = item.href === '/' 
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.href);

                  if (item.submenu) {
                    return (
                      <div key={item.href}>
                        <button
                          onClick={() => {
                            setActiveSubmenu(activeSubmenu === item.href ? null : item.href);
                          }}
                          className={cn(
                            "w-full px-4 py-3 flex items-center justify-between min-h-[44px]",
                            activeSubmenu === item.href ? "bg-red-50" : "hover:bg-gray-50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className={cn(
                              "w-5 h-5",
                              activeSubmenu === item.href ? "text-red-600" : "text-gray-500"
                            )} />
                            <span className={cn(
                              "text-base",
                              activeSubmenu === item.href ? "text-red-600" : "text-gray-900"
                            )}>
                              {item.label}
                            </span>
                          </div>
                          <ChevronDown className={cn(
                            "w-5 h-5 transition-transform",
                            activeSubmenu === item.href ? "rotate-180" : ""
                          )} />
                        </button>
                        {activeSubmenu === item.href && (
                          <div className="bg-gray-50 py-2">
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
                                    "w-full px-4 py-2 flex items-center justify-between min-h-[44px]",
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
                                    <span className="px-2.5 py-0.5 rounded-full text-sm font-medium bg-red-50 text-red-600">
                                      {subItem.badge}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
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
                        "w-full px-4 py-3 flex items-center justify-between min-h-[44px]",
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
              
              {/* Logout Button */}
              <div className="border-t mt-4 pt-4">
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 text-red-600 hover:bg-red-50 min-h-[44px]"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-base">Log Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-16 pb-16 md:pb-0 min-h-screen">
        {children}
      </main>

      {/* Mobile Navigation */}
      <MobileNav />
    </div>
  );
}