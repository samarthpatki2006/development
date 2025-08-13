import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  WifiOff, 
  AlertTriangle, 
  Lock, 
  Database, 
  AlertCircle, 
  XCircle,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { FallbackUIState } from './types';

interface FallbackUIProps {
  state: FallbackUIState;
  className?: string;
}

const FallbackUI: React.FC<FallbackUIProps> = ({ state, className = "" }) => {
  const getIcon = () => {
    switch (state.type) {
      case 'network_error':
        return <WifiOff className="h-12 w-12 text-muted-foreground" />;
      case 'browser_incompatible':
        return <AlertTriangle className="h-12 w-12 text-yellow-500" />;
      case 'permission_denied':
        return <Lock className="h-12 w-12 text-red-500" />;
      case 'no_data':
        return <Database className="h-12 w-12 text-muted-foreground" />;
      default:
        return <AlertCircle className="h-12 w-12 text-muted-foreground" />;
    }
  };

  const getVariant = () => {
    switch (state.type) {
      case 'network_error':
        return 'destructive' as const;
      case 'browser_incompatible':
        return 'default' as const;
      case 'permission_denied':
        return 'destructive' as const;
      case 'no_data':
        return 'default' as const;
      default:
        return 'default' as const;
    }
  };

  return (
    <Card className={className}>
      <CardContent className="text-center py-12">
        <div className="flex flex-col items-center space-y-4">
          {getIcon()}
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {state.title}
            </h3>
            <p className="text-muted-foreground max-w-md">
              {state.message}
            </p>
          </div>

          {state.actionHandler && state.actionLabel && (
            <Button 
              onClick={state.actionHandler}
              variant={state.type === 'network_error' ? 'default' : 'outline'}
              className="mt-4"
            >
              {state.type === 'network_error' && <RefreshCw className="h-4 w-4 mr-2" />}
              {state.actionLabel}
            </Button>
          )}

          {state.type === 'browser_incompatible' && (
            <Alert className="mt-4 max-w-md">
              <HelpCircle className="h-4 w-4" />
              <AlertDescription>
                Text-to-speech and some keyboard shortcuts may not work. 
                Manual attendance marking will still function normally.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FallbackUI;