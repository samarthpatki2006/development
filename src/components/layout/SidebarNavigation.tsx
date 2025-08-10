
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
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
}

const SidebarNavigation = ({ 
  items, 
  activeItem, 
  onItemClick, 
  userType, 
  collapsed = false 
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

  return (
    <div className={cn(
      "bg-card border-r border-white/10 transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="p-4 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={cn(
                "w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 text-left",
                isActive 
                  ? `bg-${roleColor}/20 text-${roleColor} border border-${roleColor}/30`
                  : "text-muted-foreground hover:bg-white/5 hover:text-card-foreground",
                collapsed && "justify-center"
              )}
            >
              <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && `text-${roleColor}`)} />
              {!collapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SidebarNavigation;
