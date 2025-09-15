import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Star, Play, ArrowLeft } from 'lucide-react';

interface LevelData {
  level: number;
  isUnlocked: boolean;
  stars: number;
  bestScore: number;
  isCompleted: boolean;
}

interface LevelSelectProps {
  mode: 'truth' | 'dare';
}

export default function LevelSelect({ mode = 'truth' }: LevelSelectProps) {
  const [levels, setLevels] = useState<LevelData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const modeConfig = {
    truth: {
      title: 'ELCARD',
      subtitle: 'Mode Kebenaran',
      color: 'red',
      bgGradient: 'from-red-400 via-red-500 to-red-600'
    },
    dare: {
      title: 'TUTORIAL',
      subtitle: 'Mode Tantangan',
      color: 'purple',
      bgGradient: 'from-purple-400 via-purple-500 to-purple-600'
    }
  };

  const config = modeConfig[mode];

  useEffect(() => {
    fetchUserProgress();
  }, [mode]);

  const fetchUserProgress = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/game/progress', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const userProgress = data.data.progress || [];
          const levelScores = data.data.levelScores || [];
          
          // Find progress for current mode
          const modeProgress = userProgress.find((p: any) => p.game_mode === mode);
          
          // Generate level data based on user progress
          const levelData: LevelData[] = [];
          for (let i = 1; i <= 5; i++) {
            // Check if level is unlocked (level 1 always unlocked, others based on progress)
            const isUnlocked = i === 1 || (modeProgress && modeProgress.unlocked_levels.includes(i));
            
            // Check if level is completed
            const isCompleted = modeProgress && modeProgress.completed_levels.includes(i);
            
            // Get level score from levelScores
            const levelScore = levelScores.find((ls: any) => 
              ls.game_mode === mode && ls.level === i
            );
            
            // Calculate stars based on score (example logic)
            let stars = 0;
            if (levelScore) {
              if (levelScore.total_score >= 80) stars = 3;
              else if (levelScore.total_score >= 60) stars = 2;
              else if (levelScore.total_score >= 40) stars = 1;
            }
            
            levelData.push({
              level: i,
              isUnlocked,
              stars,
              bestScore: levelScore ? levelScore.total_score : 0,
              isCompleted: !!isCompleted
            });
          }
          
          // Unlock next level if previous is completed
          for (let i = 0; i < levelData.length - 1; i++) {
            if (levelData[i].isCompleted) {
              levelData[i + 1].isUnlocked = true;
            }
          }
          
          setLevels(levelData);
        } else {
          console.error('API Error:', data.message);
          throw new Error(data.message);
        }
      } else {
        console.error('HTTP Error:', response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
      // Default levels if error
      const defaultLevels: LevelData[] = [];
      for (let i = 1; i <= 5; i++) {
        defaultLevels.push({
          level: i,
          isUnlocked: i === 1,
          stars: 0,
          bestScore: 0,
          isCompleted: false
        });
      }
      setLevels(defaultLevels);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLevelSelect = (level: number) => {
    const levelData = levels.find(l => l.level === level);
    if (levelData && levelData.isUnlocked) {
      navigate(`/game/${mode}/${level}`);
    }
  };

  const handleBack = () => {
    navigate('/game-mode');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const renderStars = (stars: number) => {
    return (
      <div className="flex justify-center space-x-1 mt-2">
        {[1, 2, 3].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gradient-to-b ${config.bgGradient} flex items-center justify-center`}>
        <div className="text-white pixel-text text-xl">MEMUAT...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${config.bgGradient} relative overflow-hidden`}>
      {/* Background Elements */}
      <div className="absolute top-10 left-10 w-16 h-8 bg-white rounded-full opacity-80"></div>
      <div className="absolute top-20 right-20 w-12 h-6 bg-white rounded-full opacity-70"></div>
      <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-green-600 to-green-500"></div>
      <div className="absolute bottom-32 w-full h-4 bg-yellow-600"></div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={handleBack}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-lg border-2 border-white pixel-button transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2 pixel-text">{config.title}</h1>
            <p className="text-xl text-yellow-200 pixel-text">{config.subtitle}</p>
          </div>
          <div className="w-12"></div> {/* Spacer */}
        </div>

        {/* Level Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
          {levels.map((levelData) => (
            <div
              key={levelData.level}
              className={`relative bg-white rounded-lg p-6 border-4 transition-all duration-200 cursor-pointer ${
                levelData.isUnlocked
                  ? `${mode === 'truth' ? 'border-blue-800' : 'border-red-800'} hover:scale-105 hover:shadow-2xl retro-card`
                  : 'border-gray-400 opacity-50 cursor-not-allowed'
              } ${
                selectedLevel === levelData.level ? 'scale-105 shadow-2xl' : ''
              }`}
              onClick={() => handleLevelSelect(levelData.level)}
            >
              {/* Lock Overlay */}
              {!levelData.isUnlocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-90 rounded-lg">
                  <Lock className="w-8 h-8 text-gray-500" />
                </div>
              )}

              {/* Level Content */}
              <div className="text-center">
                <div className={`${mode === 'truth' ? 'bg-blue-500 border-blue-700' : 'bg-red-500 border-red-700'} text-white rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center border-4`}>
                  <span className="text-2xl font-bold pixel-text">{levelData.level}</span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-800 mb-2 pixel-text">
                  LEVEL {levelData.level}
                </h3>
                
                {levelData.isCompleted && (
                  <div className="mb-2">
                    <div className="text-xs text-gray-600 pixel-text mb-1">SKOR TERBAIK</div>
                    <div className="text-sm font-bold text-gray-800 pixel-text">{levelData.bestScore}</div>
                  </div>
                )}
                
                {renderStars(levelData.stars)}
                
                {levelData.isUnlocked && (
                  <button className={`mt-4 ${mode === 'truth' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'} text-white px-4 py-2 rounded-lg pixel-button transition-colors w-full`}>
                    <Play className="w-4 h-4 inline mr-2" />
                    {levelData.isCompleted ? 'MAIN LAGI' : 'MULAI'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Progress Summary */}
        <div className="mt-12 bg-white bg-opacity-20 rounded-lg p-6 border-2 border-white max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-white mb-4 pixel-text text-center">PROGRESS ANDA</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-yellow-300 pixel-text">
                {levels.filter(l => l.isCompleted).length}/5
              </div>
              <div className="text-sm text-white pixel-text">LEVEL SELESAI</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-300 pixel-text">
                {levels.reduce((total, l) => total + l.stars, 0)}/15
              </div>
              <div className="text-sm text-white pixel-text">TOTAL BINTANG</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-300 pixel-text">
                {Math.max(...levels.map(l => l.bestScore), 0)}
              </div>
              <div className="text-sm text-white pixel-text">SKOR TERTINGGI</div>
            </div>
          </div>
        </div>

        {/* Navigation Button */}
        <div className="mt-8 text-center">
          <button 
            onClick={handleBackToHome}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-3 rounded-lg border-2 border-white pixel-button transition-colors"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>

      {/* Floating Coins */}
      <div className="absolute top-1/4 left-1/4 w-6 h-6 bg-yellow-400 rounded-full border-2 border-yellow-600 animate-bounce"></div>
      <div className="absolute top-1/3 right-1/3 w-5 h-5 bg-yellow-400 rounded-full border-2 border-yellow-600 animate-bounce" style={{animationDelay: '0.5s'}}></div>
      <div className="absolute top-1/2 left-1/6 w-7 h-7 bg-yellow-400 rounded-full border-2 border-yellow-600 animate-bounce" style={{animationDelay: '1s'}}></div>
    </div>
  );
}