import React, { useState } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  WifiOff, 
  AlertTriangle, 
  Lock, 
  Database, 
  AlertCircle, 
  XCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  Clock
} from 'lucide-react';
import { ErrorState } from './types';
import { getErrorSeverity, shouldShowRetry } from './utils/errorHandler';

interface ErrorDisplayProps {
  error: ErrorState;
  onDismiss?: () => void;
  className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onDismiss, className = "" }) => {
  const [showDetails, setShowDetails] = useState(false);
  const severity = getErrorSeverity(error);

  const getIcon = () => {
    switch (error.type) {
      case 'network':
        return <WifiOff className="h-4 w-4" />;
      case 'browser':
        return <AlertTriangle className="h-4 w-4" />;
      case 'permission':
        return <Lock className="h-4 w-4" />;
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'validation':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <XCircle className="h-4 w-4" />;
    }
  };

  const getVariant = () => {
    switch (severity) {
      case 'high':
        return 'destructive' as const;
      case 'medium':
        return 'default' as const;
      case 'low':
      default:
        return 'default' as const;
    }
  };

  const getSeverityBadge = () => {
    const variants = {
      high: 'destructive' as const,
      medium: 'secondary' as const,
      low: 'outline' as const
    };

    const labels = {
      high: 'Critical',
      medium: 'Warning',
      low: 'Info'
    };

    return (
      <Badge variant={variants[severity]} className="text-xs">
        {labels[severity]}
      </Badge>
    );
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Alert variant={getVariant()} className={className}>
      <div className="flex items-start justify-between w-full">
        <div className="flex items-start space-x-3 flex-1">
          {getIcon()}
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <AlertDescription className="font-medium">
                {error.message}
              </AlertDescription>
              {getSeverityBadge()}
            </div>

            <div className="flex items-center space-x-2">
              {shouldShowRetry(error) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={error.retryAction}
                  className="h-7"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}

              {error.details && (
                <Collapsible open={showDetails} onOpenChange={setShowDetails}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      {showDetails ? (
                        <>
                          <ChevronUp className="h-3 w-3 mr-1" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3 mr-1" />
                          Show Details
                        </>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded border">
                      <div className="space-y-1">
                        <div><strong>Details:</strong> {error.details}</div>
                        {error.timestamp && (
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span><strong>Time:</strong> {formatTimestamp(error.timestamp)}</span>
                          </div>
                        )}
                        <div><strong>Type:</strong> {error.type}</div>
                        <div><strong>Recoverable:</strong> {error.recoverable ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </div>
        </div>

        {onDismiss && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onDismiss}
            className="h-6 w-6 p-0 ml-2"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </Alert>
  );
};

export default ErrorDisplay;