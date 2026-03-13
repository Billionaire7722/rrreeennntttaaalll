import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  stack?: string;
  componentStack?: string;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Optionally send to an error tracking service
    console.error('Uncaught error in component tree:', error, info);
    this.setState({
      stack: error.stack ?? undefined,
      componentStack: info.componentStack ?? undefined,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            color: '#fff',
            background: '#0a0a0d',
          }}
        >
          <h1 style={{ marginBottom: 12 }}>Something went wrong</h1>
          <pre style={{ maxWidth: 680, whiteSpace: 'pre-wrap', textAlign: 'left' }}>
            {this.state.error?.message || 'An unknown error occurred.'}
            {this.state.stack ? `\n\n${this.state.stack}` : ''}
            {this.state.componentStack ? `\n\nComponent stack:\n${this.state.componentStack}` : ''}
          </pre>
          <p style={{ marginTop: 16, opacity: 0.8 }}>Check the browser console for more details.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
