import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Database, Save, Trash2, Plus } from 'lucide-react';
import { LoadingState } from './types';

interface LoadingOverlayProps {
  loadingState: LoadingState;
  className?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ loadingState, className = "" }) => {
  if (!loadingState || !loadingState.isLoading) return null;

  const getIcon = () => {
    switch (loadingState.operation) {
      case 'fetching':
        return <Database className="h-6 w-6 text-primary animate-pulse" />;
      case 'saving':
        return <Save className="h-6 w-6 text-primary animate-pulse" />;
      case 'deleting':
        return <Trash2 className="h-6 w-6 text-primary animate-pulse" />;
      case 'inserting':
        return <Plus className="h-6 w-6 text-primary animate-pulse" />;
      default:
        return <Loader2 className="h-6 w-6 text-primary animate-spin" />;
    }
  };

  const getMessage = () => {
    if (loadingState.message) return loadingState.message;
<<<<<<< HEAD
    
=======

>>>>>>> samarth-pr
    switch (loadingState.operation) {
      case 'fetching':
        return 'Loading students...';
      case 'saving':
        return 'Saving attendance...';
      case 'deleting':
        return 'Removing data...';
      case 'inserting':
        return 'Adding demo data...';
      default:
        return 'Processing...';
    }
  };

  return (
<<<<<<< HEAD
    <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}>
      <Card className="w-80">
        <CardContent className="text-center py-8">
          <div className="flex flex-col items-center space-y-4">
            {getIcon()}
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                {getMessage()}
              </h3>
              <p className="text-sm text-muted-foreground">
=======
    <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${className}`}>
      <Card className="w-full max-w-[20rem] sm:max-w-sm">
        <CardContent className="text-center py-6 sm:py-8 px-4 sm:px-6">
          <div className="flex flex-col items-center space-y-3 sm:space-y-4">
            {getIcon()}

            <div className="space-y-1 sm:space-y-2">
              <h3 className="text-base sm:text-lg font-semibold text-foreground">
                {getMessage()}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
>>>>>>> samarth-pr
                Please wait while we process your request...
              </p>
            </div>

            <div className="w-full max-w-xs">
              <Progress value={undefined} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoadingOverlay;