import { Component } from 'react';
import { RefreshCcw, AlertTriangle } from 'lucide-react';
import Button from './ui/Button';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Unhandled render error:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.assign('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-ink-50 px-6">
          <div className="surface p-8 max-w-md text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-rose-50 text-rose-500">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-display font-bold text-ink-900">Something went wrong</h1>
            <p className="text-sm text-ink-500 mt-2">
              An unexpected error occurred. Reloading usually fixes it — if it keeps happening, please
              let us know.
            </p>
            <Button className="mt-6" icon={RefreshCcw} onClick={this.handleReload}>
              Reload app
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
