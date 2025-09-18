import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Heart, Star, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

interface Question {
  _id: string;
  question_text: string;
  question_type?: 'multiple_choice' | 'essay';
  options?: {
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
  const [essayAnswer, setEssayAnswer] = useState<string>('');
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0); // Score from backend
  const [finalCorrectAnswers, setFinalCorrectAnswers] = useState(0); // Correct answers from backend
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(mode === 'truth' ? 120 : 300);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [gameStatus, setGameStatus] = useState<'playing' | 'completed' | 'failed'>('playing');
  const [isLoading, setIsLoading] = useState(true);
  const [isValidatingAnswer, setIsValidatingAnswer] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string>('');
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [gameStartTime, setGameStartTime] = useState<number>(Date.now());

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
    setGameStartTime(Date.now());
    setUserAnswers([]);
    setScore(0);
    setCurrentQuestionIndex(0);
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

  const fallbackQuestions: Question[] = [
    {
      _id: '1',
      question_text: 'Berapa hasil dari 2 + 2?',
      question_type: 'multiple_choice',
      options: { A: '3', B: '4', C: '5', D: '6' },
      correct_answer: 'B',
      explanation: 'Hasil dari 2 + 2 adalah 4'
    },
    {
      _id: '2',
      question_text: 'Apa ibu kota Indonesia?',
      question_type: 'multiple_choice',
      options: { A: 'Bandung', B: 'Jakarta', C: 'Surabaya', D: 'Medan' },
      correct_answer: 'B',
      explanation: 'Jakarta adalah ibu kota Indonesia'
    }
  ];

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Validate mode and level before making request
      if (!mode || !['truth', 'dare'].includes(mode)) {
        throw new Error('Invalid game mode. Please select Truth or Dare.');
      }
      
      const levelNum = parseInt(level.toString());
      if (!level || isNaN(levelNum) || levelNum < 1 || levelNum > 5) {
        throw new Error('Invalid level. Please select a level between 1 and 5.');
      }

      console.debug('Fetching questions for:', { mode, level, hasToken: !!token });
      
      const response = await fetch(`${API_BASE_URL}/game/questions/${mode}/${level}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        let errorMessage = `Server error (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        
        if (response.status === 404) {
          errorMessage = 'Questions not found for this level. Please try a different level or contact support.';
        } else if (response.status === 403) {
          errorMessage = 'This level is not unlocked yet. Complete previous levels first.';
        } else if (response.status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
          navigate('/login');
          return;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.debug('API response:', data);
      
      if (data.success && data.data && data.data.questions && Array.isArray(data.data.questions)) {
        if (data.data.questions.length === 0) {
          throw new Error('No questions available for this level. Please try a different level.');
        }
        
        console.debug('Setting questions from API:', data.data.questions.length, 'questions');
        setQuestions(data.data.questions);
      } else {
        throw new Error('Invalid response format from server. Please try again.');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.warn('Using fallback questions due to error:', errorMessage);
      setQuestions(fallbackQuestions);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeUp = () => {
    setLives(lives - 1);
    setIsAnswered(true);
    setUserAnswers(prev => [...prev, 'TIMEOUT']); // Track unanswered question with valid enum value
    
    if (lives <= 1) {
      setGameStatus('failed');
    } else {
      setTimeout(() => {
        nextQuestion();
      }, 2000);
    }
  };

  // Get current question and convert options to array
  const currentQuestion = questions && questions.length > 0 && questions[currentQuestionIndex] 
    ? questions[currentQuestionIndex] 
    : { _id: '', question_text: '', question_type: 'multiple_choice' as const, options: {}, correct_answer: 'A', explanation: '' };
  const safeOptions = currentQuestion.options && typeof currentQuestion.options === 'object' 
    ? Object.entries(currentQuestion.options).map(([key, value]) => ({ key, value }))
    : [];

  const handleAnswerSelect = async (answerKey: string) => {
    if (isAnswered || isValidatingAnswer) return;
    
    // Validate input data before sending
    if (!answerKey || !currentQuestion._id) {
      console.error('Invalid answer data:', { answerKey, questionId: currentQuestion._id });
      setIsValidatingAnswer(false);
      return;
    }
    
    setSelectedAnswer(answerKey);
    setIsValidatingAnswer(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        navigate('/login');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/game/validate-answer`, {
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
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to validate answer');
        }
        
        const isCorrect = data.data.isCorrect;
        
        setCorrectAnswer(data.data.correctAnswer);
        setExplanation(data.data.explanation);
        setIsAnswered(true);
        
        if (isCorrect) {
          const timeBonus = Math.floor(timeLeft / 5) * 10;
          setScore(prevScore => prevScore + 100 + timeBonus);
        } else {
          setLives(lives - 1);
          if (lives <= 1) {
            setGameStatus('failed');
            setIsValidatingAnswer(false);
            return;
          }
        }
        
        setShowExplanation(true);
        
        // Track user answer and handle game completion
        setUserAnswers(prev => {
          const newAnswers = [...prev, answerKey];
          
          // Check if this is the last question
          if (currentQuestionIndex >= questions.length - 1) {
            setTimeout(() => {
              setGameStatus('completed');
              submitScore();
            }, 3000);
          } else {
            setTimeout(() => {
              nextQuestion();
            }, 3000);
          }
          
          return newAnswers;
        });
      } else {
        if (response.status === 401) {
          console.error('Authentication failed');
          navigate('/login');
          return;
        } else if (response.status === 400) {
          const errorData = await response.json().catch(() => ({ message: 'Invalid request data' }));
          console.error('Validation error:', errorData.message);
          throw new Error(`Validation error: ${errorData.message}`);
        } else if (response.status === 404) {
          console.error('Question not found');
          throw new Error('Question not found. Please try again.');
        }
        throw new Error(`Server error: ${response.status}`);
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

  const handleEssaySubmit = async () => {
    if (isAnswered || isValidatingAnswer || !essayAnswer.trim()) return;
    
    setIsValidatingAnswer(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        navigate('/login');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/game/validate-answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          questionId: currentQuestion._id,
          userAnswer: essayAnswer.trim()
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to validate answer');
        }
        
        const isCorrect = data.data.isCorrect;
        
        setCorrectAnswer(data.data.correctAnswer);
        setExplanation(data.data.explanation);
        setIsAnswered(true);
        
        if (isCorrect) {
          const timeBonus = Math.floor(timeLeft / 5) * 10;
          setScore(prevScore => prevScore + 100 + timeBonus);
        } else {
          setLives(lives - 1);
          if (lives <= 1) {
            setGameStatus('failed');
            setIsValidatingAnswer(false);
            return;
          }
        }
        
        setShowExplanation(true);
        
        // Track user answer and handle game completion
        setUserAnswers(prev => {
          const newAnswers = [...prev, essayAnswer.trim()];
          
          // Check if this is the last question
          if (currentQuestionIndex >= questions.length - 1) {
            setTimeout(() => {
              setGameStatus('completed');
              submitScore();
            }, 3000);
          } else {
            setTimeout(() => {
              nextQuestion();
            }, 3000);
          }
          
          return newAnswers;
        });
      } else {
        if (response.status === 401) {
          console.error('Authentication failed');
          navigate('/login');
          return;
        } else if (response.status === 400) {
          const errorData = await response.json().catch(() => ({ message: 'Invalid request data' }));
          console.error('Validation error:', errorData.message);
          throw new Error(`Validation error: ${errorData.message}`);
        } else if (response.status === 404) {
          console.error('Question not found');
          throw new Error('Question not found. Please try again.');
        }
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (error) {
      console.error('Error validating essay answer:', error);
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
    setEssayAnswer('');
    setIsAnswered(false);
    setShowExplanation(false);
    setTimeLeft(mode === 'truth' ? 120 : 300);
    setCorrectAnswer(null);
    setExplanation('');
    setIsValidatingAnswer(false);
  };

  const submitScore = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        navigate('/login');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/game/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gameMode: mode,
          level,
          answers: userAnswers,
          timeSpent: Math.floor((Date.now() - gameStartTime) / 1000)
        })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.error('Authentication failed');
          navigate('/login');
          return;
        }
        throw new Error(`Failed to submit score: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to submit score');
      }
      
      console.log('=== FRONTEND SCORE RECEIVED ===')
      console.log('Backend response data:', data)
      console.log('Score from backend:', data.data?.score)
      console.log('Correct answers from backend:', data.data?.correctAnswers)
      console.log('Total questions from backend:', data.data?.totalQuestions)
      console.log('Percentage from backend:', data.data?.percentage)
      console.log('Current frontend score state:', score)
      console.log('=== END FRONTEND SCORE DEBUG ===')
      
      // Store backend score data
      if (data.data?.score !== undefined) {
        setFinalScore(data.data.score);
      }
      if (data.data?.correctAnswers !== undefined) {
        setFinalCorrectAnswers(data.data.correctAnswers);
      }
      
      console.log('Score submitted successfully:', data);
    } catch (error) {
      console.error('Error submitting score:', error);
    }
  };

  const restartGame = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setFinalScore(0);
    setFinalCorrectAnswers(0);
    setUserAnswers([]);
    setLives(3);
    setTimeLeft(mode === 'truth' ? 120 : 300);
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
    const displayScore = finalScore || score;
    const stars = displayScore >= 400 ? 3 : displayScore >= 250 ? 2 : displayScore >= 100 ? 1 : 0;
    
    return (
      <div className={`min-h-screen bg-gradient-to-b ${config.bgGradient} flex items-center justify-center`}>
        <div className="bg-white rounded-lg p-8 border-4 border-gray-800 max-w-md w-full retro-card text-center">
          <div className="mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-800 mb-2 pixel-text">SELAMAT!</h2>
            <p className="text-gray-600 pixel-text text-sm">Level {level} Selesai</p>
          </div>
          
          <div className="mb-6">
            <div className="text-4xl font-bold text-gray-800 mb-2 pixel-text">{displayScore}</div>
            <div className="text-sm text-gray-600 pixel-text">SKOR AKHIR</div>
            {finalCorrectAnswers > 0 && (
              <div className="text-sm text-gray-600 pixel-text mt-2">
                {finalCorrectAnswers} / {questions.length} BENAR
              </div>
            )}
            
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
            <div className="text-4xl font-bold text-gray-800 mb-2 pixel-text">{finalScore || score}</div>
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
            <h2 className="text-sm font-bold text-gray-800 mb-4 pixel-text leading-relaxed whitespace-pre-line">
              {currentQuestion.question_text || 'Loading question...'}
            </h2>
            
            {/* Conditional rendering based on question type */}
            {currentQuestion?.question_type === 'essay' ? (
              <div className="space-y-4">
                <textarea
                  value={essayAnswer}
                  onChange={(e) => setEssayAnswer(e.target.value)}
                  placeholder="Tulis jawaban Anda di sini..."
                  disabled={isAnswered || isValidatingAnswer}
                  className={`w-full p-4 rounded-lg border-4 transition-all duration-200 pixel-button resize-none h-32 ${
                    isAnswered
                      ? 'bg-gray-100 border-gray-400 text-gray-600'
                      : `bg-${config.color}-50 border-${config.color}-400 text-${config.color}-800 focus:bg-${config.color}-100`
                  }`}
                />
                <button
                  onClick={handleEssaySubmit}
                  disabled={isAnswered || isValidatingAnswer || !essayAnswer.trim()}
                  className={`w-full p-4 rounded-lg border-4 transition-all duration-200 pixel-button font-bold ${
                    isAnswered || !essayAnswer.trim()
                      ? 'bg-gray-300 border-gray-500 text-gray-600 cursor-not-allowed'
                      : `bg-${config.color}-500 border-${config.color}-700 text-white hover:bg-${config.color}-600`
                  }`}
                >
                  {isValidatingAnswer ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      MEMVALIDASI...
                    </div>
                  ) : (
                    'KIRIM JAWABAN'
                  )}
                </button>
                {isAnswered && (
                  <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                    <h4 className="font-bold text-blue-800 mb-2 pixel-text text-sm">JAWABAN ANDA:</h4>
                    <p className="text-blue-700 pixel-text text-xs mb-2">{essayAnswer}</p>
                    <h4 className="font-bold text-blue-800 mb-2 pixel-text text-sm">JAWABAN YANG BENAR:</h4>
                    <p className="text-blue-700 pixel-text text-xs">{correctAnswer}</p>
                  </div>
                )}
              </div>
            ) : (
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
            )}
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