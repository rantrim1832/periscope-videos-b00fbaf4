import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props { children: ReactNode }
interface State { hasError: boolean; message?: string }

// App-wide error boundary so a render error never shows a blank white screen.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown) {
    console.error('Unhandled UI error:', error);
    // Fire-and-forget: send to a log sink if one is wired up in the future.
    try {
      const detail = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        route: typeof window !== 'undefined' ? window.location.pathname : undefined,
        ua: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = globalThis as any;
      if (typeof g.__periscope_error_sink === 'function') g.__periscope_error_sink(detail);
    } catch { /* ignore */ }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh flex items-center justify-center bg-background p-6">
          <div className="text-center max-w-md space-y-4">
            <h1 className="text-2xl font-bold">Something went wrong</h1>
            <p className="text-muted-foreground">An unexpected error occurred. Try reloading the page.</p>
            {this.state.message && (
              <p className="text-xs text-muted-foreground font-mono bg-muted/50 rounded px-2 py-1 inline-block max-w-full break-all">
                {this.state.message}
              </p>
            )}
            <div className="flex gap-2 justify-center pt-2">
              <Button variant="hero" onClick={() => window.location.assign('/')}>Back to home</Button>
              <Button variant="outline" onClick={() => window.location.assign('/contact')}>Report this</Button>
            </div>
          </div>
          </div>
      );
    }
    return this.props.children;
  }
}
