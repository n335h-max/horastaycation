import { Component } from 'react';

const initialState = { hasError: false, error: null };

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = initialState;
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState(initialState);
  };

  render() {
    if (this.state.hasError) {
      const fallback = this.props.fallback;

      if (fallback) {
        return typeof fallback === 'function'
          ? fallback({ error: this.state.error, resetError: this.handleReset })
          : fallback;
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center px-4">
          <div className="w-full max-w-md rounded-3xl border border-brand-100 bg-white p-8 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
              <span className="text-3xl" role="img" aria-label="error">
                ⚠️
              </span>
            </div>
            <h2 className="mb-2 text-xl font-bold text-slate-800">Something went wrong</h2>
            <p className="mb-6 text-sm text-slate-500">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={this.handleReset}
              className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}