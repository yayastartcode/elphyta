import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Heart, Star, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

interface Question {
  _id: string;
  question_text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: string;
  explanation: string;
}

interface GameProps {
  mode: 'truth' | 'dare';
  level: number;
}

export default function Game({ mode = 'truth', level = 1 }: GameProps) {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [gameStatus, setGameStatus] = useState<'playing' | 'completed' | 'failed'>('playing');
  const [isLoading, setIsLoading] = useState(true);
  const [isValidatingAnswer, setIsValidatingAnswer] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string>('');

  const modeConfig = {
    truth: {
      title: 'ELCARD',
      color: 'red',
      bgGradient: 'from-red-400 via-red-500 to-red-600'
    },
    dare: {
      title: 'TUTORIAL',
      color: 'purple',
      bgGradient: 'from-purple-400 via-purple-500 to-purple-600'
    }
  };

  const config = modeConfig[mode];

  // Fetch questions for the level
  useEffect(() => {
    fetchQuestions();
  }, [mode, level]);

  // Timer effect
  useEffect(() => {
    if (gameStatus === 'playing' && !isAnswered && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered) {
      handleTimeUp();
    }
  }, [timeLeft, isAnswered, gameStatus]);

  const fetchQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/game/questions/${mode}/${level}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.data.questions);
      } else {
        console.error('Failed to fetch questions');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      // Fallback questions for demo
      setQuestions([
        {
          _id: '1',
          question_text: 'Berapa hasil dari 2 + 2?',
          options: { A: '3', B: '4', C: '5', D: '6' },
          correct_answer: 'B',
          explanation: 'Hasil dari 2 + 2 adalah 4'
        },
        {
          _id: '2',
          question_text: 'Apa ibu kota Indonesia?',
          options: { A: 'Bandung', B: 'Jakarta', C: 'Surabaya', D: 'Medan' },
          correct_answer: 'B',
          explanation: 'Jakarta adalah ibu kota Indonesia'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeUp = () => {
    setLives(lives - 1);
    setIsAnswered(true);
    if (lives <= 1) {
      setGameStatus('failed');
    } else {
      setTimeout(() => {
        nextQuestion();
      }, 2000);
    }
  };

  // Get current question and convert options to array
  const currentQuestion = questions[currentQuestionIndex] || { _id: '', question_text: '', options: {}, correct_answer: 'A', explanation: '' };
  const safeOptions = currentQuestion.options && typeof currentQuestion.options === 'object' 
    ? Object.entries(currentQuestion.options).map(([key, value]) => ({ key, value }))
    : [];

  const handleAnswerSelect = async (answerKey: string) => {
    if (isAnswered || isValidatingAnswer) return;
    
    setSelectedAnswer(answerKey);
    setIsValidatingAnswer(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/game/validate-answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          questionId: currentQuestion._id,
          userAnswer: answerKey
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const isCorrect = data.data.isCorrect;
        
        setCorrectAnswer(data.data.correctAnswer);
        setExplanation(data.data.explanation);
        setIsAnswered(true);
        
        if (isCorrect) {
          const timeBonus = Math.floor(timeLeft / 5) * 10;
          setScore(score + 100 + timeBonus);
        } else {
          setLives(lives - 1);
          if (lives <= 1) {
            setGameStatus('failed');
            setIsValidatingAnswer(false);
            return;
          }
        }
        
        setShowExplanation(true);
        
        setTimeout(() => {
          if (currentQuestionIndex >= questions.length - 1) {
            setGameStatus('completed');
            submitScore();
          } else {
            nextQuestion();
          }
        }, 3000);
      } else {
        console.error('Failed to validate answer');
        // Fallback: treat as incorrect
        setIsAnswered(true);
        setLives(lives - 1);
        if (lives <= 1) {
          setGameStatus('failed');
        }
      }
    } catch (error) {
      console.error('Error validating answer:', error);
      // Fallback: treat as incorrect
      setIsAnswered(true);
      setLives(lives - 1);
      if (lives <= 1) {
        setGameStatus('failed');
      }
    } finally {
      setIsValidatingAnswer(false);
    }
  };

  const nextQuestion = () => {
    setCurrentQuestionIndex(currentQuestionIndex + 1);
    setSelectedAnswer('');
    setIsAnswered(false);
    setShowExplanation(false);
    setTimeLeft(30);
    setCorrectAnswer(null);
    setExplanation('');
    setIsValidatingAnswer(false);
  };

  const submitScore = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/game/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          level,
          mode,
          score,
          questionsAnswered: currentQuestionIndex + 1,
          correctAnswers: score > 0 ? Math.floor(score / 100) : 0
        })
      });
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  };

  const restartGame = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setLives(3);
    setTimeLeft(30);
    setIsAnswered(false);
    setShowExplanation(false);
    setGameStatus('playing');
  };

  const handleBackClick = () => {
    navigate('/levels', { state: { mode } });
  };

  const handleSelectLevel = () => {
    navigate('/levels', { state: { mode } });
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gradient-to-b ${config.bgGradient} flex items-center justify-center`}>
        <div className="text-white pixel-text text-xl">MEMUAT SOAL...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className={`min-h-screen bg-gradient-to-b ${config.bgGradient} flex items-center justify-center`}>
        <div className="text-white pixel-text text-xl">TIDAK ADA SOAL TERSEDIA</div>
      </div>
    );
  }



  if (gameStatus === 'completed') {
    const stars = score >= 400 ? 3 : score >= 250 ? 2 : score >= 100 ? 1 : 0;
    
    return (
      <div className={`min-h-screen bg-gradient-to-b ${config.bgGradient} flex items-center justify-center`}>
        <div className="bg-white rounded-lg p-8 border-4 border-gray-800 max-w-md w-full retro-card text-center">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2 pixel-text">SELAMAT!</h2>
            <p className="text-gray-600 pixel-text text-sm">Level {level} Selesai</p>
          </div>
          
          <div className="mb-6">
            <div className="text-4xl font-bold text-gray-800 mb-2 pixel-text">{score}</div>
            <div className="text-sm text-gray-600 pixel-text">SKOR AKHIR</div>
            
            <div className="flex justify-center space-x-1 mt-4">
              {[1, 2, 3].map((star) => (
                <Star
                  key={star}
                  className={`w-8 h-8 ${
                    star <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'
                  }`}
                />
              ))}
            </div>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={restartGame}
              className={`w-full bg-${config.color}-600 hover:bg-${config.color}-700 text-white py-3 px-4 rounded-lg pixel-button transition-colors`}
            >
              MAIN LAGI
            </button>
            <button 
              onClick={handleSelectLevel}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg pixel-button transition-colors"
            >
              PILIH LEVEL
            </button>
            <button 
              onClick={handleBackToHome}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg pixel-button transition-colors"
            >
              KEMBALI KE BERANDA
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameStatus === 'failed') {
    return (
      <div className={`min-h-screen bg-gradient-to-b ${config.bgGradient} flex items-center justify-center`}>
        <div className="bg-white rounded-lg p-8 border-4 border-gray-800 max-w-md w-full retro-card text-center">
          <div className="mb-6">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2 pixel-text">GAME OVER</h2>
            <p className="text-gray-600 pixel-text text-sm">Nyawa Habis!</p>
          </div>
          
          <div className="mb-6">
            <div className="text-4xl font-bold text-gray-800 mb-2 pixel-text">{score}</div>
            <div className="text-sm text-gray-600 pixel-text">SKOR AKHIR</div>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={restartGame}
              className={`w-full bg-${config.color}-600 hover:bg-${config.color}-700 text-white py-3 px-4 rounded-lg pixel-button transition-colors`}
            >
              COBA LAGI
            </button>
            <button 
              onClick={handleSelectLevel}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg pixel-button transition-colors"
            >
              PILIH LEVEL
            </button>
            <button 
              onClick={handleBackToHome}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg pixel-button transition-colors"
            >
              KEMBALI KE BERANDA
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-b ${config.bgGradient} relative overflow-hidden`}>
      {/* Background Elements */}
      <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-green-600 to-green-500"></div>
      <div className="absolute bottom-32 w-full h-4 bg-yellow-600"></div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={handleBackClick}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-lg border-2 border-white pixel-button transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white pixel-text">{config.title} - LEVEL {level}</h1>
          </div>
          
          <div className="text-right">
            <div className="text-white pixel-text text-sm">SKOR: {score}</div>
          </div>
        </div>

        {/* Game Stats */}
        <div className="flex justify-between items-center mb-8 bg-white bg-opacity-20 rounded-lg p-4 border-2 border-white">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-white" />
            <span className="text-white pixel-text text-lg">{timeLeft}s</span>
          </div>
          
          <div className="text-center">
            <span className="text-white pixel-text text-sm">
              {currentQuestionIndex + 1} / {questions.length}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            {[...Array(3)].map((_, i) => (
              <Heart
                key={i}
                className={`w-5 h-5 ${
                  i < lives ? 'text-red-500 fill-red-500' : 'text-gray-400'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg p-8 border-4 border-gray-800 max-w-4xl mx-auto retro-card">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 pixel-text leading-relaxed">
              {currentQuestion.question_text || 'Loading question...'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {safeOptions.length === 0 && (
                <div className="col-span-full p-4 bg-yellow-100 border border-yellow-400 rounded">
                  <p className="text-yellow-800 text-sm">
                    Tidak ada pilihan jawaban tersedia untuk soal ini.
                  </p>
                </div>
              )}
              {safeOptions.map((option, index) => {
                const isCorrect = correctAnswer ? option.key === correctAnswer : false;
                const isSelected = selectedAnswer === option.key;
                const isUnanswered = !isAnswered;
                
                let buttonClass = `w-full p-4 rounded-lg border-4 transition-all duration-200 pixel-button text-left relative`;
                
                if (isAnswered) {
                  if (option.key === correctAnswer) {
                    buttonClass += ' bg-green-500 border-green-700 text-white';
                  } else if (option.key === selectedAnswer) {
                    buttonClass += ' bg-red-500 border-red-700 text-white';
                  } else {
                    buttonClass += ' bg-gray-300 border-gray-500 text-gray-600';
                  }
                } else {
                  buttonClass += ` bg-${config.color}-100 border-${config.color}-400 text-${config.color}-800 hover:bg-${config.color}-200`;
                }
                
                if (isValidatingAnswer && isSelected) {
                  buttonClass += ' opacity-75';
                }
                
                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(option.key)}
                    disabled={isAnswered || isValidatingAnswer}
                    className={buttonClass}
                  >
                    <span className="font-bold mr-2">{option.key}.</span>
                    {option.value}
                    {isValidatingAnswer && isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Explanation */}
          {showExplanation && explanation && (
            <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-2 pixel-text text-sm">PENJELASAN:</h3>
              <p className="text-blue-700 pixel-text text-xs leading-relaxed">
                {explanation}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Coins */}
      <div className="absolute top-1/4 left-1/4 w-6 h-6 bg-yellow-400 rounded-full border-2 border-yellow-600 animate-bounce"></div>
      <div className="absolute top-1/3 right-1/3 w-5 h-5 bg-yellow-400 rounded-full border-2 border-yellow-600 animate-bounce" style={{animationDelay: '0.5s'}}></div>
    </div>
  );
}