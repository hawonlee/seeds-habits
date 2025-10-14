/**
 * Error Boundary for Knowledge Graph
 * 
 * Catches and handles React errors, WebGL errors, and data loading failures
 * with user-friendly fallback UI.
 * 
 * @module ErrorBoundary
 */

import React, { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;
  /** Fallback component to show on error */
  fallback?: (error: Error, reset: () => void) => ReactNode;
  /** Callback when error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  /** The error object */
  error: Error | null;
  /** Additional error information */
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error boundary component that catches React errors
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.handleReset);
      }

      return (
        <ErrorFallback
          error={this.state.error!}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI
 */
function ErrorFallback({
  error,
  errorInfo,
  onReset,
}: {
  error: Error;
  errorInfo: React.ErrorInfo | null;
  onReset: () => void;
}) {
  const isWebGLError = error.message.toLowerCase().includes('webgl') ||
    error.message.toLowerCase().includes('context');

  return (
    <div className="flex items-center justify-center h-full kg-neural-bg p-4">
      <div className="kg-glass-card p-8 max-w-2xl w-full space-y-6">
        {/* Error icon and title */}
        <div className="text-center space-y-3">
          <AlertCircle
            className="h-16 w-16 mx-auto"
            style={{ color: 'var(--kg-accent-pink)' }}
          />
          <h2 className="text-2xl font-bold text-kg-text-primary">
            {isWebGLError ? 'Graphics Not Supported' : 'Something Went Wrong'}
          </h2>
        </div>

        {/* Error details */}
        <Alert className="bg-kg-bg-tertiary border-kg-accent-pink">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Details</AlertTitle>
          <AlertDescription className="mt-2">
            <code className="text-xs block p-2 bg-kg-bg-primary rounded overflow-auto">
              {error.message}
            </code>
          </AlertDescription>
        </Alert>

        {/* Context-specific help */}
        {isWebGLError ? (
          <Alert className="bg-kg-bg-tertiary border-kg-accent-blue">
            <Info className="h-4 w-4" />
            <AlertTitle>WebGL Not Available</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <p>
                The 3D visualization requires WebGL support. Your browser or device
                may not support WebGL, or it may be disabled.
              </p>
              <p className="font-semibold">Try these solutions:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Update your browser to the latest version</li>
                <li>Enable hardware acceleration in browser settings</li>
                <li>Try a different browser (Chrome, Firefox, Edge)</li>
                <li>Use the 2D view as a fallback</li>
              </ul>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-kg-bg-tertiary border-kg-accent-amber">
            <Info className="h-4 w-4" />
            <AlertTitle>What You Can Do</AlertTitle>
            <AlertDescription className="mt-2">
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Try refreshing the page</li>
                <li>Check your internet connection</li>
                <li>Clear your browser cache</li>
                <li>Report this issue if it persists</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 justify-center">
          <Button onClick={onReset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            Reload Page
          </Button>
        </div>

        {/* Technical details (collapsible) */}
        {errorInfo && (
          <details className="text-xs text-kg-text-tertiary">
            <summary className="cursor-pointer hover:text-kg-text-secondary">
              Show technical details
            </summary>
            <pre className="mt-2 p-2 bg-kg-bg-primary rounded overflow-auto max-h-48">
              {errorInfo.componentStack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

/**
 * Check if WebGL is supported
 */
export function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch (e) {
    return false;
  }
}

/**
 * Error fallback specifically for data loading failures
 */
export function DataLoadError({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center justify-center h-full kg-neural-bg">
      <div className="kg-glass-card p-8 max-w-lg w-full mx-4 text-center space-y-4">
        <AlertCircle
          className="h-12 w-12 mx-auto"
          style={{ color: 'var(--kg-accent-pink)' }}
        />
        <h2 className="text-xl font-bold text-kg-text-primary">
          Failed to Load Graph Data
        </h2>
        <p className="text-kg-text-secondary">
          {message || 'There was an error loading the knowledge graph data.'}
        </p>
        {onRetry && (
          <Button onClick={onRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
}

