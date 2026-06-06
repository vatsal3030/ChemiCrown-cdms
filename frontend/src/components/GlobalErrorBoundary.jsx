import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-lg border border-red-100 dark:border-red-900/30 max-w-lg w-full">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 dark:text-red-500">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-3">
              Oops! Something went wrong.
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              An unexpected error occurred in the application. Our team has been notified. Please try refreshing the page or navigating back home.
            </p>
            
            {import.meta.env.DEV && this.state.error && (
              <div className="text-left bg-slate-100 dark:bg-slate-800 p-4 rounded-lg mb-8 overflow-auto max-h-48 text-xs font-mono text-slate-700 dark:text-slate-300">
                <p className="font-bold mb-2">{this.state.error.toString()}</p>
                <p className="whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button onClick={() => window.location.reload()} className="flex items-center justify-center gap-2">
                <RefreshCcw size={16} />
                Refresh Page
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
