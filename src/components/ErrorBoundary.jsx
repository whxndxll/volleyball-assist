import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-md mx-auto min-h-screen flex flex-col items-center justify-center gap-3 p-4 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
          <h1 className="text-xl font-bold">Algo deu errado</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Recarregue a página para continuar.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
