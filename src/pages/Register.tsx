import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, Mail, ArrowRight } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Password tidak cocok');
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: name, email, password }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        navigate('/');
      } else {
        setError(data.message || 'Registrasi gagal');
      }
    } catch (error) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-400 via-purple-500 to-purple-600 relative overflow-hidden">
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
            <h1 className="text-3xl font-bold text-gray-800 mb-2 pixel-text">DAFTAR</h1>
            <p className="text-gray-600 pixel-text text-sm">Buat akun Elphyta baru</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded mb-4 pixel-text text-xs">
              {error}
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-gray-700 pixel-text text-xs mb-2" htmlFor="username">
                NAMA PENGGUNA
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border-2 border-gray-400 rounded-lg focus:outline-none focus:border-purple-500 pixel-text text-sm"
                  placeholder="nama pengguna"
                  required
                  minLength={3}
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-gray-700 pixel-text text-xs mb-2" htmlFor="email">
                EMAIL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border-2 border-gray-400 rounded-lg focus:outline-none focus:border-purple-500 pixel-text text-sm"
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
                  className="w-full pl-10 pr-10 py-3 border-2 border-gray-400 rounded-lg focus:outline-none focus:border-purple-500 pixel-text text-sm"
                  placeholder="masukkan password"
                  required
                  minLength={6}
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

            {/* Confirm Password Field */}
            <div>
              <label className="block text-gray-700 pixel-text text-xs mb-2" htmlFor="confirmPassword">
                KONFIRMASI PASSWORD
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border-2 border-gray-400 rounded-lg focus:outline-none focus:border-purple-500 pixel-text text-sm"
                  placeholder="konfirmasi password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
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
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white py-3 px-4 rounded-lg pixel-button transition-colors"
            >
              {isLoading ? 'MEMUAT...' : 'DAFTAR'}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center mt-6">
            <p className="text-gray-600 pixel-text text-xs">
                Sudah punya akun?{' '}
                <Link to="/login" className="text-purple-600 hover:text-purple-800 underline">
                  MASUK SEKARANG
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