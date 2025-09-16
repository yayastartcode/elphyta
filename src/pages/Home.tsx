import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, BookOpen, Trophy, Settings, User, LogOut, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

export default function Home() {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleCardClick = (cardType: string) => {
    setSelectedCard(cardType);
    
    if (cardType === 'elcard') {
      // Navigate to game mode selection
      navigate('/game-mode');
    } else if (cardType === 'tutorial') {
      // Navigate to tutorial page
      navigate('/tutorial');
    }
  };

  const handleUserIconClick = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleLogout = () => {
    // Use AuthContext logout method to properly clear all auth data
    logout();
    
    // Navigate to login page
    navigate('/login', { replace: true });
  };

  const handleResetProgress = async () => {
    const confirmed = window.confirm(
      'Apakah Anda yakin ingin mereset semua progress? \n\nSemua data permainan, level yang telah diselesaikan, dan skor akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.'
    );
    
    if (!confirmed) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/game/reset-progress`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Progress berhasil direset! Semua data permainan telah dihapus.');
        // Optionally refresh the page or update UI
        window.location.reload();
      } else {
        alert('Gagal mereset progress: ' + data.message);
      }
    } catch (error) {
      console.error('Error resetting progress:', error);
      alert('Terjadi kesalahan saat mereset progress. Silakan coba lagi.');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 via-blue-500 to-blue-600 relative overflow-hidden">
      {/* Pixel Art Clouds */}
      <div className="absolute top-10 left-10 w-16 h-8 bg-white rounded-full opacity-80"></div>
      <div className="absolute top-20 right-20 w-12 h-6 bg-white rounded-full opacity-70"></div>
      <div className="absolute top-32 left-1/3 w-20 h-10 bg-white rounded-full opacity-60"></div>
      
      {/* Mario-style Ground */}
      <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-green-600 to-green-500"></div>
      <div className="absolute bottom-32 w-full h-4 bg-yellow-600"></div>
      
      {/* Pixel Art Pipes */}
      <div className="absolute bottom-32 left-10 w-12 h-24 bg-green-700 border-4 border-green-800 rounded-t-lg"></div>
      <div className="absolute bottom-32 right-10 w-12 h-24 bg-green-700 border-4 border-green-800 rounded-t-lg"></div>
      
      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4 pixel-text shadow-lg">
            ELPHYTA
          </h1>
          <p className="text-xl text-yellow-200 font-semibold pixel-text">
            Petualangan Matematika Pythagoras
          </p>
        </div>

        {/* Game Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {/* ELcard - Game Mode Selection */}
          <div 
            className={`bg-gradient-to-br from-red-500 to-red-700 rounded-lg p-6 border-4 border-red-800 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-2xl ${
              selectedCard === 'elcard' ? 'scale-105 shadow-2xl' : ''
            }`}
            onClick={() => handleCardClick('elcard')}
          >
            <div className="text-center">
              <div className="bg-white rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Play className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2 pixel-text">ELCARD</h2>
              <p className="text-red-100 font-semibold mb-4">Permainan Utama</p>
              <p className="text-sm text-red-200 mb-4">
                Pilih mode permainan dan mulai petualangan matematika Pythagoras!
              </p>
              <div className="bg-red-800 rounded-lg p-3 mb-4">
                <p className="text-white text-sm font-bold">2 Mode • 5 Level • Seru!</p>
              </div>
              <button className="bg-white text-red-600 px-6 py-2 rounded-lg font-bold hover:bg-red-50 transition-colors pixel-button">
                MULAI BERMAIN
              </button>
            </div>
          </div>

          {/* Tutorial Card - How to Play */}
          <div 
            className={`bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg p-6 border-4 border-purple-800 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-2xl ${
              selectedCard === 'tutorial' ? 'scale-105 shadow-2xl' : ''
            }`}
            onClick={() => handleCardClick('tutorial')}
          >
            <div className="text-center">
              <div className="bg-white rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2 pixel-text">TUTORIAL</h2>
              <p className="text-purple-100 font-semibold mb-4">Cara Bermain</p>
              <p className="text-sm text-purple-200 mb-4">
                Pelajari cara bermain dan rumus Pythagoras sebelum memulai!
              </p>
              <div className="bg-purple-800 rounded-lg p-3 mb-4">
                <p className="text-white text-sm font-bold">Panduan Lengkap • Tips & Trik</p>
              </div>
              <button className="bg-white text-purple-600 px-6 py-2 rounded-lg font-bold hover:bg-purple-50 transition-colors pixel-button">
                PELAJARI SEKARANG
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="flex justify-center space-x-6 relative">
          <button className="bg-yellow-500 hover:bg-yellow-400 text-yellow-900 p-4 rounded-lg border-4 border-yellow-600 transition-colors pixel-button">
            <Trophy className="w-6 h-6" />
          </button>
          <div className="relative" ref={userMenuRef}>
            <button 
              onClick={handleUserIconClick}
              className="bg-green-500 hover:bg-green-400 text-green-900 p-4 rounded-lg border-4 border-green-600 transition-colors pixel-button"
            >
              <User className="w-6 h-6" />
            </button>
            
            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border-2 border-gray-300 min-w-[120px] z-50">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left hover:bg-red-50 rounded-lg transition-colors flex items-center space-x-2 text-red-600 font-semibold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
          <button 
            onClick={handleResetProgress}
            className="bg-red-500 hover:bg-red-400 text-red-900 p-4 rounded-lg border-4 border-red-600 transition-colors pixel-button"
            title="Reset Progress"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
          <button className="bg-gray-500 hover:bg-gray-400 text-gray-900 p-4 rounded-lg border-4 border-gray-600 transition-colors pixel-button">
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Floating Coins Animation */}
      <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-yellow-400 rounded-full border-2 border-yellow-600 animate-bounce"></div>
      <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-yellow-400 rounded-full border-2 border-yellow-600 animate-bounce" style={{animationDelay: '0.5s'}}></div>
      <div className="absolute top-1/2 left-1/6 w-7 h-7 bg-yellow-400 rounded-full border-2 border-yellow-600 animate-bounce" style={{animationDelay: '1s'}}></div>
    </div>
  );
}