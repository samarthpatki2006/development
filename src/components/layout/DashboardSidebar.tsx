
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  MessageSquare, 
  Calendar, 
  CheckSquare, 
  Bell, 
  BarChart3, 
  Users, 
  FileText, 
  Brain, 
  Search,
  Settings,
  LogOut,
  GraduationCap,
  User,
  CreditCard,
  Building,
  HelpCircle,
  Shield,
  Cog
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarItem {
  id: string;
  label: string;
  icon: any;
  path?: string;
  userTypes?: string[];
}

const sidebarItems: SidebarItem[] = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: BarChart3, 
    path: '/dashboard' 
  },
  { 
    id: 'courses', 
    label: 'Courses', 
    icon: BookOpen, 
    path: '/courses', 
    userTypes: ['student', 'teacher', 'faculty'] 
  },
  { 
    id: 'chat', 
    label: 'Chat', 
    icon: MessageSquare, 
    path: '/chat' 
  },
  { 
    id: 'attendance', 
    label: 'Attendance', 
    icon: Calendar, 
    path: '/attendance' 
  },
  { 
    id: 'tasks', 
    label: 'Tasks', 
    icon: CheckSquare, 
    path: '/tasks', 
    userTypes: ['student', 'teacher', 'faculty'] 
  },
  { 
    id: 'notifications', 
    label: 'Notifications', 
    icon: Bell, 
    path: '/notifications' 
  },
  { 
    id: 'analytics', 
    label: 'Analytics', 
    icon: BarChart3, 
    path: '/analytics',
    userTypes: ['admin', 'super_admin', 'teacher', 'faculty']
  },
  { 
    id: 'study-assistant', 
    label: 'Study Assistant', 
    icon: Brain, 
    path: '/study-assistant', 
    userTypes: ['student'] 
  },
  { 
    id: 'collaborative-docs', 
    label: 'Collaborative Docs', 
    icon: FileText, 
    path: '/docs', 
    userTypes: ['student', 'teacher', 'faculty'] 
  },
  { 
    id: 'study-rooms', 
    label: 'Study Rooms', 
    icon: Users, 
    path: '/study-rooms', 
    userTypes: ['student'] 
  },
  { 
    id: 'plagiarism-checker', 
    label: 'Plagiarism Checker', 
    icon: Search, 
    path: '/plagiarism', 
    userTypes: ['student', 'teacher', 'faculty'] 
  },
  { 
    id: 'resource-library', 
    label: 'Resource Library', 
    icon: FileText, 
    path: '/resources' 
  },
  { 
    id: 'payments', 
    label: 'Payments', 
    icon: CreditCard, 
    path: '/payments', 
    userTypes: ['student', 'parent'] 
  },
  { 
    id: 'hostel', 
    label: 'Hostel', 
    icon: Building, 
    path: '/hostel', 
    userTypes: ['student'] 
  },
  { 
    id: 'user-management', 
    label: 'User Management', 
    icon: Users, 
    path: '/admin/users', 
    userTypes: ['admin', 'super_admin'] 
  },
  { 
    id: 'system-settings', 
    label: 'System Settings', 
    icon: Cog, 
    path: '/admin/settings', 
    userTypes: ['admin', 'super_admin'] 
  },
  { 
    id: 'alumni-network', 
    label: 'Alumni Network', 
    icon: GraduationCap, 
    path: '/alumni-network', 
    userTypes: ['alumni'] 
  },
  { 
    id: 'contributions', 
    label: 'Contributions', 
    icon: CreditCard, 
    path: '/contributions', 
    userTypes: ['alumni'] 
  },
  { 
    id: 'support', 
    label: 'Support', 
    icon: HelpCircle, 
    path: '/support' 
  }
];

interface DashboardSidebarProps {
  userType: string;
  currentPath: string;
}

const DashboardSidebar = ({ userType, currentPath }: DashboardSidebarProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('colcord_user');
    navigate('/');
  };

  // Normalize user type for filtering (handle 'faculty' -> 'teacher')
  const normalizedUserType = userType === 'faculty' ? 'teacher' : userType;

  const filteredItems = sidebarItems.filter(item => 
    !item.userTypes || item.userTypes.includes(normalizedUserType) || item.userTypes.includes(userType)
  );

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'student':
        return 'bg-role-student';
      case 'teacher':
      case 'faculty':
        return 'bg-role-teacher';
      case 'admin':
      case 'super_admin':
        return 'bg-role-admin';
      case 'parent':
        return 'bg-role-parent';
      case 'alumni':
        return 'bg-role-alumni';
      default:
        return 'bg-role-student';
    }
  };

  const getUserTypeColorForActive = (type: string) => {
    switch (type) {
      case 'student':
        return 'text-role-student border-role-student/20 bg-role-student/10';
      case 'teacher':
      case 'faculty':
        return 'text-role-teacher border-role-teacher/20 bg-role-teacher/10';
      case 'admin':
      case 'super_admin':
        return 'text-role-admin border-role-admin/20 bg-role-admin/10';
      case 'parent':
        return 'text-role-parent border-role-parent/20 bg-role-parent/10';
      case 'alumni':
        return 'text-role-alumni border-role-alumni/20 bg-role-alumni/10';
      default:
        return 'text-role-student border-role-student/20 bg-role-student/10';
    }
  };

  return (
    <div className="w-64 bg-card border-r border-white/10 h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <div className={`w-8 h-8 ${getUserTypeColor(userType)} rounded-lg flex items-center justify-center`}>
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-card-foreground">ColCord</span>
        </div>
      </div>

      {/* Academic Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="text-xs font-medium text-muted-foreground mb-4 uppercase tracking-wider">
            {userType === 'admin' || userType === 'super_admin' ? 'Administration' : 'Academic'}
          </div>
          <nav className="space-y-1">
            {filteredItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath.includes(item.id) || 
                             (item.id === 'dashboard' && (
                               currentPath === '/student' || 
                               currentPath === '/teacher' || 
                               currentPath === '/admin' || 
                               currentPath === '/parent' || 
                               currentPath === '/alumni'
                             ));
              
              return (
                <NavLink
                  key={item.id}
                  to={item.path || '#'}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? `${getUserTypeColorForActive(userType)} border` 
                      : 'text-muted-foreground hover:text-card-foreground hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-white/10">
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-card-foreground"
          >
            <Settings className="h-5 w-5 mr-3" />
            Settings
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-card-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DashboardSidebar;
