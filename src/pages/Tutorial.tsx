import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Target, Trophy, Zap } from 'lucide-react';

export default function Tutorial() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  const handleStartGame = () => {
    navigate('/game-mode');
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
      
      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <button 
            onClick={handleBack}
            className="absolute top-8 left-8 bg-white text-blue-600 p-3 rounded-lg border-4 border-blue-300 hover:bg-blue-50 transition-colors pixel-button"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <h1 className="text-5xl font-bold text-white mb-4 pixel-text shadow-lg">
            CARA BERMAIN
          </h1>
          <p className="text-xl text-yellow-200 font-semibold pixel-text">
            Pelajari cara bermain Elphyta!
          </p>
        </div>

        {/* Tutorial Content */}
        <div className="bg-white rounded-lg p-6 border-4 border-blue-300 mb-8 shadow-2xl">
          <div className="space-y-6">
            {/* Game Overview */}
            <div className="text-center mb-6">
              <div className="bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-blue-800 mb-2 pixel-text">TENTANG ELPHYTA</h2>
              <p className="text-gray-700">
                Elphyta adalah game matematika yang mengajarkan teorema Pythagoras dengan cara yang menyenangkan!
              </p>
            </div>

            {/* Game Modes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-red-50 rounded-lg p-4 border-2 border-red-200">
                <div className="flex items-center mb-3">
                  <BookOpen className="w-6 h-6 text-red-600 mr-2" />
                  <h3 className="text-lg font-bold text-red-800 pixel-text">MODE KEBENARAN</h3>
                </div>
                <p className="text-sm text-red-700 mb-2">
                  Jawab pertanyaan tentang teorema Pythagoras dengan benar.
                </p>
                <ul className="text-xs text-red-600 space-y-1">
                  <li>• 5 level dengan tingkat kesulitan berbeda</li>
                  <li>• 5 soal per level</li>
                  <li>• Dapatkan poin untuk jawaban benar</li>
                </ul>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                <div className="flex items-center mb-3">
                  <Zap className="w-6 h-6 text-purple-600 mr-2" />
                  <h3 className="text-lg font-bold text-purple-800 pixel-text">MODE TANTANGAN</h3>
                </div>
                <p className="text-sm text-purple-700 mb-2">
                  Selesaikan tantangan matematika untuk membuka level berikutnya.
                </p>
                <ul className="text-xs text-purple-600 space-y-1">
                  <li>• 5 level progresif</li>
                  <li>• Tantangan unik di setiap level</li>
                  <li>• Buka level baru dengan menyelesaikan tantangan</li>
                </ul>
              </div>
            </div>

            {/* How to Play */}
            <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
              <div className="flex items-center mb-3">
                <Target className="w-6 h-6 text-green-600 mr-2" />
                <h3 className="text-lg font-bold text-green-800 pixel-text">CARA BERMAIN</h3>
              </div>
              <ol className="text-sm text-green-700 space-y-2">
                <li><strong>1.</strong> Pilih mode permainan (Kebenaran atau Tantangan)</li>
                <li><strong>2.</strong> Pilih level yang ingin dimainkan</li>
                <li><strong>3.</strong> Baca soal dengan teliti</li>
                <li><strong>4.</strong> Hitung menggunakan rumus Pythagoras: a² + b² = c²</li>
                <li><strong>5.</strong> Masukkan jawaban dan klik "Kirim"</li>
                <li><strong>6.</strong> Dapatkan poin dan lanjut ke soal berikutnya!</li>
              </ol>
            </div>

            {/* Pythagoras Formula */}
            <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
              <div className="flex items-center mb-3">
                <Trophy className="w-6 h-6 text-yellow-600 mr-2" />
                <h3 className="text-lg font-bold text-yellow-800 pixel-text">RUMUS PYTHAGORAS</h3>
              </div>
              <div className="text-center">
                <div className="bg-yellow-100 rounded-lg p-4 mb-3">
                  <p className="text-2xl font-bold text-yellow-800 pixel-text">a² + b² = c²</p>
                </div>
                <p className="text-sm text-yellow-700">
                  <strong>a</strong> dan <strong>b</strong> = sisi tegak lurus<br/>
                  <strong>c</strong> = sisi miring (hipotenusa)
                </p>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <h3 className="text-lg font-bold text-blue-800 mb-3 pixel-text">TIPS BERMAIN</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Pastikan kamu memahami rumus Pythagoras sebelum bermain</li>
                <li>• Hitung dengan teliti untuk mendapatkan jawaban yang benar</li>
                <li>• Gunakan kalkulator jika diperlukan</li>
                <li>• Jangan terburu-buru, baca soal dengan baik</li>
                <li>• Berlatih secara rutin untuk meningkatkan kemampuan</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <button 
            onClick={handleStartGame}
            className="bg-green-500 hover:bg-green-400 text-white px-8 py-3 rounded-lg border-4 border-green-600 font-bold text-lg transition-colors pixel-button"
          >
            MULAI BERMAIN SEKARANG!
          </button>
          <p className="text-white text-sm">
            Siap untuk menguji kemampuan matematikamu?
          </p>
        </div>
      </div>

      {/* Floating Coins Animation */}
      <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-yellow-400 rounded-full border-2 border-yellow-600 animate-bounce"></div>
      <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-yellow-400 rounded-full border-2 border-yellow-600 animate-bounce" style={{animationDelay: '0.5s'}}></div>
      <div className="absolute top-1/2 left-1/6 w-7 h-7 bg-yellow-400 rounded-full border-2 border-yellow-600 animate-bounce" style={{animationDelay: '1s'}}></div>
    </div>
  );
}