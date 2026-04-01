import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';
import { Button } from '@/components/ui/button';

interface GlobalErrorBoundaryProps {
  children: ReactNode;
  title: string;
  body: string;
  retryLabel: string;
}

interface GlobalErrorBoundaryState {
  hasError: boolean;
}

export class GlobalErrorBoundary extends Component<GlobalErrorBoundaryProps, GlobalErrorBoundaryState> {
  state: GlobalErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Scientific Color Lab runtime error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <div className="w-full max-w-xl rounded-[1.75rem] border border-border/70 bg-panel px-6 py-6 shadow-panel">
            <div className="eyebrow">Scientific Color Lab</div>
            <h1 className="mt-3 font-editorial text-3xl tracking-tight text-foreground">{this.props.title}</h1>
            <p className="mt-3 text-sm text-foreground/68">{this.props.body}</p>
            <div className="mt-5 flex gap-3">
              <Button onClick={() => window.location.reload()}>{this.props.retryLabel}</Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
