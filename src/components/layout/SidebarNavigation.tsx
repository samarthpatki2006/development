import React from 'react';
import { LucideIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
}

interface SidebarNavigationProps {
  items: SidebarItem[];
  activeItem: string;
  onItemClick: (itemId: string) => void;
  userType: 'student' | 'faculty' | 'parent' | 'alumni' | 'admin';
  collapsed?: boolean;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

const SidebarNavigation = ({
  items,
  activeItem,
  onItemClick,
  userType,
  collapsed = false,
  mobileOpen = false,
  onMobileClose
}: SidebarNavigationProps) => {
  const getRoleColor = (userType: string) => {
    switch (userType) {
      case 'student': return 'role-student';
      case 'faculty': return 'role-teacher';
      case 'parent': return 'role-parent';
      case 'alumni': return 'role-alumni';
      case 'admin': return 'role-admin';
      default: return 'primary';
    }
  };

  const roleColor = getRoleColor(userType);

  const handleItemClick = (itemId: string) => {
    onItemClick(itemId);
    // Close mobile menu after selection
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ease-in-out"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "bg-card border-r border-white/10 fixed inset-y-0 left-0 z-50 w-64 md:relative md:h-auto h-full",
          "bg-black flex md:flex-col overflow-hidden",
          "translate-x-0 opacity-100 -translate-x-full md:translate-x-0 opacity-0 md:opacity-100",
          "transition-all duration-300 ease-in-out",
          collapsed ? "md:w-16" : "md:w-64",
          mobileOpen
          ? "translate-x-0 opacity-100"
            : "-translate-x-full md:translate-x-0 opacity-0 md:opacity-100"
        )}
      >
        {/* Mobile Close Button */}
        {/* <div className="md:hidden flex justify-start p-4 border-b border-white/10">
          <button
            onClick={onMobileClose}
            className="text-muted-foreground hover:text-card-foreground transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div> */}

        {/* Navigation Items */}
        <div className="p-4 space-y-2 overflow-y-auto flex-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 text-left",
                  isActive
                    ? `bg-${roleColor}/20 text-${roleColor} border border-${roleColor}/30`
                    : "text-muted-foreground hover:bg-white/5 hover:text-card-foreground",
                  collapsed && "md:justify-center"
                )}
              >
                <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && `text-${roleColor}`)} />
                <span className={cn(
                  "font-medium text-sm",
                  collapsed && "md:hidden"
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default SidebarNavigation;