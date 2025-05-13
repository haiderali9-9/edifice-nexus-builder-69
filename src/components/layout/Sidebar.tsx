
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, ClipboardList, Settings, Home, Users, Building, Calendar, Menu, X, LifeBuoy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const Sidebar: React.FC = () => {
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => setExpanded(!expanded);
  const toggleMobileSidebar = () => setMobileOpen(!mobileOpen);

  const navItems = [
    { name: 'Dashboard', icon: Home, href: '/' },
    { name: 'Tasks', icon: ClipboardList, href: '/tasks' },
    { name: 'Resources', icon: Users, href: '/resources' },
    { name: 'Facilities', icon: Building, href: '/facilities' },
    { name: 'Calendar', icon: Calendar, href: '/calendar' },
    { name: 'Analytics', icon: BarChart3, href: '/analytics' },
    { name: 'Settings', icon: Settings, href: '/settings' },
  ];

  const NavItem = ({ item }: { item: typeof navItems[0] }) => (
    <Link
      to={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent group transition-all",
        item.href === window.location.pathname && "bg-sidebar-accent"
      )}
    >
      <item.icon className="h-5 w-5 flex-shrink-0" />
      <span className={cn(
        "transition-opacity",
        expanded ? "opacity-100" : "opacity-0 w-0 hidden lg:block lg:group-hover:opacity-100 lg:group-hover:w-auto lg:group-hover:inline"
      )}>
        {item.name}
      </span>
    </Link>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile menu button */}
      <Button
        variant="outline" 
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={toggleMobileSidebar}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 z-40 h-full bg-sidebar transition-all duration-300 flex flex-col",
        expanded ? "w-64" : "w-16",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="h-8 w-8 rounded-md flex items-center justify-center bg-edifice-600 text-white font-bold">
              E
            </div>
            <span className={cn(
              "font-bold text-white transition-opacity",
              expanded ? "opacity-100" : "opacity-0 w-0"
            )}>
              Edifice Ops
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-sidebar-foreground hidden lg:flex"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex flex-col gap-1 p-2 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </div>

        <div className="p-4 border-t border-sidebar-border">
          <div className={cn(
            "flex items-center gap-3 text-sidebar-foreground",
            expanded ? "" : "justify-center"
          )}>
            <div className="h-8 w-8 rounded-full bg-edifice-800 flex items-center justify-center text-white">
              JD
            </div>
            {expanded && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">John Doe</p>
                <p className="text-xs text-sidebar-foreground/70 truncate">Facility Manager</p>
              </div>
            )}
          </div>

          <div className={cn(
            "mt-4 flex items-center text-xs text-sidebar-foreground/70 gap-2",
            expanded ? "" : "justify-center"
          )}>
            <LifeBuoy className="h-4 w-4" />
            {expanded && <span>Help & Support</span>}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
