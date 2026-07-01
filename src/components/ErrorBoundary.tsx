import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props { children: ReactNode }
interface State { hasError: boolean }

// App-wide error boundary so a render error never shows a blank white screen.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error('Unhandled UI error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="text-center max-w-md space-y-4">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground">An unexpected error occurred. Try reloading the page.</p>
            <Button variant="hero" onClick={() => window.location.assign('/')}>Back to home</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
