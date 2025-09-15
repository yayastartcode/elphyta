import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, BookOpen, ArrowLeft } from 'lucide-react';

export default function GameModeSelect() {
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleModeSelect = (mode: string) => {
    setSelectedMode(mode);
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    // Navigate to level selection with the selected mode
    navigate('/levels', { state: { mode: mode.toLowerCase() } });
  };

  const handleBack = () => {
    navigate('/');
  };

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
          <button 
            onClick={handleBack}
            className="absolute top-8 left-8 bg-white text-blue-600 p-3 rounded-lg border-4 border-blue-300 hover:bg-blue-50 transition-colors pixel-button"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <h1 className="text-5xl font-bold text-white mb-4 pixel-text shadow-lg">
            PILIH MODE PERMAINAN
          </h1>
          <p className="text-xl text-yellow-200 font-semibold pixel-text">
            Pilih cara bermain yang kamu suka!
          </p>
        </div>

        {/* Game Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
          {/* Truth Mode */}
          <div 
            className={`bg-gradient-to-br from-red-500 to-red-700 rounded-lg p-6 border-4 border-red-800 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-2xl ${
              selectedMode === 'truth' ? 'scale-105 shadow-2xl' : ''
            }`}
            onClick={() => handleModeSelect('truth')}
          >
            <div className="text-center">
              <div className="bg-white rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2 pixel-text">MODE KEBENARAN</h2>
              <p className="text-red-100 font-semibold mb-4">Truth Mode</p>
              <p className="text-sm text-red-200 mb-4">
                Jawab pertanyaan Pythagoras dengan benar untuk mendapatkan poin!
              </p>
              <div className="bg-red-800 rounded-lg p-3 mb-4">
                <p className="text-white text-sm font-bold">5 Level • 5 Soal per Level</p>
              </div>
              <button className="bg-white text-red-600 px-6 py-2 rounded-lg font-bold hover:bg-red-50 transition-colors pixel-button">
                PILIH MODE INI
              </button>
            </div>
          </div>

          {/* Dare Mode */}
          <div 
            className={`bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg p-6 border-4 border-purple-800 cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-2xl ${
              selectedMode === 'dare' ? 'scale-105 shadow-2xl' : ''
            }`}
            onClick={() => handleModeSelect('dare')}
          >
            <div className="text-center">
              <div className="bg-white rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Play className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2 pixel-text">MODE TANTANGAN</h2>
              <p className="text-purple-100 font-semibold mb-4">Dare Mode</p>
              <p className="text-sm text-purple-200 mb-4">
                Selesaikan tantangan matematika untuk membuka level berikutnya!
              </p>
              <div className="bg-purple-800 rounded-lg p-3 mb-4">
                <p className="text-white text-sm font-bold">5 Level • Tantangan Seru</p>
              </div>
              <button className="bg-white text-purple-600 px-6 py-2 rounded-lg font-bold hover:bg-purple-50 transition-colors pixel-button">
                PILIH MODE INI
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Coins Animation */}
      <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-yellow-400 rounded-full border-2 border-yellow-600 animate-bounce"></div>
      <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-yellow-400 rounded-full border-2 border-yellow-600 animate-bounce" style={{animationDelay: '0.5s'}}></div>
      <div className="absolute top-1/2 left-1/6 w-7 h-7 bg-yellow-400 rounded-full border-2 border-yellow-600 animate-bounce" style={{animationDelay: '1s'}}></div>
    </div>
  );
}