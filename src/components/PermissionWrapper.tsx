
import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent } from '@/components/ui/card';
import { Lock } from 'lucide-react';

interface PermissionWrapperProps {
  children: React.ReactNode;
  permission: keyof import('@/hooks/usePermissions').UserPermissions;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

const PermissionWrapper = ({ 
  children, 
  permission, 
  fallback,
  showFallback = false 
}: PermissionWrapperProps) => {
  const { permissions, loading } = usePermissions();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!permissions[permission]) {
    if (showFallback && fallback) {
      return <>{fallback}</>;
    }
    
    if (showFallback) {
      return (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center p-6 text-gray-500">
            <Lock className="w-4 h-4 mr-2" />
            <span>Access restricted</span>
          </CardContent>
        </Card>
      );
    }
    
    return null;
  }

  return <>{children}</>;
};

export default PermissionWrapper;
