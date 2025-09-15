import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-b from-red-400 via-red-500 to-red-600 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 border-4 border-gray-800 max-w-md w-full retro-card text-center">
            <div className="mb-6">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-gray-800 mb-2 pixel-text">OOPS!</h2>
              <p className="text-gray-600 pixel-text text-sm">Terjadi kesalahan tak terduga</p>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 pixel-text text-xs leading-relaxed">
                Mohon maaf, terjadi kesalahan saat memuat halaman ini. Silakan coba lagi atau kembali ke halaman utama.
              </p>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg pixel-button transition-colors"
              >
                MUAT ULANG
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg pixel-button transition-colors"
              >
                KEMBALI KE BERANDA
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;