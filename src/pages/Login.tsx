import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  // Get the intended destination from location state
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('🔍 [LOGIN DEBUG] Starting login process');
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      console.log('🔍 [LOGIN DEBUG] Login response:', data);
      
      if (data.success) {
        console.log('🔍 [LOGIN DEBUG] Login successful, calling login function');
        console.log('🔍 [LOGIN DEBUG] User data:', data.data.user);
        console.log('🔍 [LOGIN DEBUG] Token:', data.data.token.substring(0, 20) + '...');
        
        // Call login function to update AuthContext
        login(data.data.token, data.data.user);
        
        // Get the intended destination from location state or redirect admin to admin dashboard
        let from = location.state?.from?.pathname || '/';
        
        // If user is admin and no specific destination, redirect to admin dashboard
        if (data.data.user.role === 'admin' && from === '/') {
          from = '/admin';
        }
        
        console.log('🔍 [LOGIN DEBUG] User role:', data.data.user.role);
        console.log('🔍 [LOGIN DEBUG] Intended destination:', from);
        
        // Wait for AuthContext to be properly updated by checking localStorage and state
        const waitForAuthUpdate = () => {
          return new Promise<void>((resolve) => {
            const checkAuth = () => {
              const tokenInStorage = localStorage.getItem('token');
              const userInStorage = localStorage.getItem('user');
              
              console.log('🔍 [LOGIN DEBUG] Checking auth state...');
              console.log('🔍 [LOGIN DEBUG] Token in localStorage:', tokenInStorage ? 'SET' : 'NULL');
              console.log('🔍 [LOGIN DEBUG] User in localStorage:', userInStorage ? 'SET' : 'NULL');
              
              if (tokenInStorage && userInStorage) {
                console.log('🔍 [LOGIN DEBUG] Auth state ready, resolving promise');
                resolve();
              } else {
                console.log('🔍 [LOGIN DEBUG] Auth state not ready, checking again in 50ms');
                setTimeout(checkAuth, 50);
              }
            };
            checkAuth();
          });
        };
        
        // Wait for auth state to be ready, then navigate
        waitForAuthUpdate().then(() => {
          console.log('🔍 [LOGIN DEBUG] Navigating to:', from);
          navigate(from, { replace: true });
        });
      } else {
        console.log('🔍 [LOGIN DEBUG] Login failed:', data.message);
        setError(data.message || 'Login gagal');
      }
    } catch (error) {
      console.error('🔍 [LOGIN DEBUG] Login error:', error);
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const quickAdminLogin = async () => {
    console.log('🔍 [QUICK ADMIN] Starting quick admin login');
    setIsLoading(true);
    setError('');
    
    // Set admin credentials
    const adminEmail = 'testadmin@example.com';
    const adminPassword = 'testadmin123';
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });
      
      const data = await response.json();
      console.log('🔍 [QUICK ADMIN] Login response:', data);
      
      if (data.success) {
        console.log('🔍 [QUICK ADMIN] Admin login successful');
        
        // Call login function to update AuthContext
        login(data.data.token, data.data.user);
        
        // Wait for auth state to be ready, then navigate to admin dashboard
        const waitForAuthUpdate = () => {
          return new Promise<void>((resolve) => {
            const checkAuth = () => {
              const tokenInStorage = localStorage.getItem('token');
              const userInStorage = localStorage.getItem('user');
              
              if (tokenInStorage && userInStorage) {
                resolve();
              } else {
                setTimeout(checkAuth, 50);
              }
            };
            checkAuth();
          });
        };
        
        waitForAuthUpdate().then(() => {
          console.log('🔍 [QUICK ADMIN] Navigating to admin dashboard');
          navigate('/admin', { replace: true });
        });
      } else {
        console.log('🔍 [QUICK ADMIN] Login failed:', data.message);
        setError(data.message || 'Quick admin login gagal');
      }
    } catch (error) {
      console.error('🔍 [QUICK ADMIN] Login error:', error);
      setError('Terjadi kesalahan saat quick admin login.');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-10 left-10 w-16 h-8 bg-white rounded-full opacity-80"></div>
      <div className="absolute top-20 right-20 w-12 h-6 bg-white rounded-full opacity-70"></div>
      <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-green-600 to-green-500"></div>
      <div className="absolute bottom-32 w-full h-4 bg-yellow-600"></div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-lg p-8 border-4 border-gray-800 max-w-md w-full retro-card">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2 pixel-text">MASUK</h1>
            <p className="text-gray-600 pixel-text text-sm">Masuk ke akun Elphyta Anda</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded mb-4 pixel-text text-xs">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-gray-700 pixel-text text-xs mb-2" htmlFor="email">
                EMAIL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border-2 border-gray-400 rounded-lg focus:outline-none focus:border-blue-500 pixel-text text-sm"
                  placeholder="masukkan@email.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-gray-700 pixel-text text-xs mb-2" htmlFor="password">
                PASSWORD
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border-2 border-gray-400 rounded-lg focus:outline-none focus:border-blue-500 pixel-text text-sm"
                  placeholder="masukkan password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-lg pixel-button transition-colors"
            >
              {isLoading ? 'MEMUAT...' : 'MASUK'}
            </button>
            
            {/* Quick Admin Login Button */}
            <button
              type="button"
              onClick={quickAdminLogin}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg pixel-button transition-colors text-xs"
            >
              QUICK ADMIN LOGIN & REDIRECT
            </button>
            
            {/* Debug Button */}
            <button
              type="button"
              onClick={() => {
                console.log('🔍 [DEBUG] Current state:');
                console.log('🔍 [DEBUG] localStorage token:', localStorage.getItem('token'));
                console.log('🔍 [DEBUG] localStorage user:', localStorage.getItem('user'));
                console.log('🔍 [DEBUG] Current location:', window.location.href);
              }}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg pixel-button transition-colors text-xs"
            >
              DEBUG INFO
            </button>
          </form>

          {/* Register Link */}
          <div className="text-center mt-6">
            <p className="text-gray-600 pixel-text text-xs">
              Belum punya akun?{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-800 underline">
                DAFTAR SEKARANG
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-4">
            <Link to="/" className="text-gray-500 hover:text-gray-700 pixel-text text-xs underline">
              KEMBALI KE BERANDA
            </Link>
          </div>
        </div>
      </div>

      {/* Floating Coins */}
      <div className="absolute top-1/4 left-1/4 w-6 h-6 bg-yellow-400 rounded-full border-2 border-yellow-600 animate-bounce"></div>
      <div className="absolute top-1/3 right-1/3 w-5 h-5 bg-yellow-400 rounded-full border-2 border-yellow-600 animate-bounce" style={{animationDelay: '0.5s'}}></div>
    </div>
  );
}