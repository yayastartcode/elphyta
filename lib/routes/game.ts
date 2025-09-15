import { Router, type Request, type Response } from 'express';
import Question from '../../api/models/Question';
import UserProgress from '../../api/models/UserProgress.js';
import GameSession from '../../api/models/GameSession.js';
import LevelScore from '../../api/models/LevelScore.js';
import { authenticateToken } from '../../api/middleware/auth.js';

const router = Router();

// Apply authentication to all game routes
router.use(authenticateToken);

/**
 * Get user progress for both game modes
 * GET /api/game/progress
 */
router.get('/progress', async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user._id;
    
    const progress = await UserProgress.find({ user_id: userId });
    
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

/**
 * Get questions for a specific level and game mode
 * GET /api/game/questions/:gameMode/:level
 */
router.get('/questions/:gameMode/:level', async (req: any, res: Response): Promise<void> => {
  try {
    const { gameMode, level } = req.params;
    const userId = req.user._id;
    
    // Validate game mode
    if (!['truth', 'dare'].includes(gameMode)) {
      res.status(400).json({
        success: false,
        message: 'Mode permainan tidak valid'
      });
      return;
    }
    
    // Validate level
    const levelNum = parseInt(level);
    if (isNaN(levelNum) || levelNum < 1 || levelNum > 5) {
      res.status(400).json({
        success: false,
        message: 'Level tidak valid'
      });
      return;
    }
    
    // Check if user has access to this level
    const userProgress = await UserProgress.findOne({
      user_id: userId,
      game_mode: gameMode
    });
    
    if (!userProgress || !userProgress.unlocked_levels.includes(levelNum)) {
      res.status(403).json({
        success: false,
        message: 'Level belum terbuka'
      });
      return;
    }
    
    // Get questions for this level
    const questions = await Question.find({
      level: levelNum,
      game_mode: gameMode
    }).sort({ question_order: 1 }).limit(5);
    
    if (questions.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Soal tidak ditemukan untuk level ini'
      });
      return;
    }
    
    // Remove correct answers from response for security
    const questionsForClient = questions.map(q => ({
      _id: q._id,
      question_text: q.question_text,
      options: q.options,
      question_order: q.question_order,
      level: q.level,
      game_mode: q.game_mode
    }));
    
    res.json({
      success: true,
      data: {
        questions: questionsForClient,
        level: levelNum,
        gameMode: gameMode
      }
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

/**
 * Validate a single answer
 * POST /api/game/validate-answer
 */
router.post('/validate-answer', async (req: any, res: Response): Promise<void> => {
  try {
    const { questionId, userAnswer } = req.body;
    const userId = req.user._id;
    
    // Validation
    if (!questionId || !userAnswer) {
      res.status(400).json({
        success: false,
        message: 'Data tidak lengkap'
      });
      return;
    }
    
    // Get the question
    const question = await Question.findById(questionId);
    
    if (!question) {
      res.status(404).json({
        success: false,
        message: 'Soal tidak ditemukan'
      });
      return;
    }
    
    // Check if answer is correct
    const isCorrect = question.correct_answer === userAnswer;
    
    res.json({
      success: true,
      data: {
        isCorrect,
        correctAnswer: question.correct_answer,
        explanation: question.explanation
      }
    });
  } catch (error) {
    console.error('Validate answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

/**
 * Submit answers for a game session
 * POST /api/game/submit
 */
router.post('/submit', async (req: any, res: Response): Promise<void> => {
  try {
    const { gameMode, level, answers, totalTime } = req.body;
    const userId = req.user._id;
    
    // Validation
    if (!gameMode || !level || !answers || !Array.isArray(answers)) {
      res.status(400).json({
        success: false,
        message: 'Data tidak lengkap'
      });
      return;
    }
    
    // Get questions to check answers
    const questions = await Question.find({
      level: parseInt(level),
      game_mode: gameMode
    }).sort({ question_order: 1 }).limit(5);
    
    if (questions.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Soal tidak ditemukan'
      });
      return;
    }
    
    // Calculate score
    let correctAnswers = 0;
    let totalScore = 0;
    const questionResults = [];
    
    for (let i = 0; i < Math.min(answers.length, questions.length); i++) {
      const question = questions[i];
      const userAnswer = answers[i];
      const isCorrect = question.correct_answer === userAnswer;
      
      if (isCorrect) {
        correctAnswers++;
        totalScore += question.points || 10; // Default 10 points per question
      }
      
      questionResults.push({
        question_id: question._id,
        user_answer: userAnswer,
        correct_answer: question.correct_answer,
        is_correct: isCorrect,
        points_earned: isCorrect ? (question.points || 10) : 0
      });
    }
    
    // Create game session records for each question
    const gameSessionPromises = questionResults.map((result, index) => {
      const gameSession = new GameSession({
        user_id: userId,
        question_id: result.question_id,
        game_mode: gameMode,
        level: parseInt(level),
        question_number: index + 1,
        user_answer: result.user_answer,
        is_correct: result.is_correct,
        time_spent: Math.round((totalTime || 0) / questionResults.length), // Distribute time evenly
        score: result.points_earned
      });
      return gameSession.save();
    });
    
    await Promise.all(gameSessionPromises);
    
    // Update or create level score
    const existingLevelScore = await LevelScore.findOne({
      user_id: userId,
      game_mode: gameMode,
      level: parseInt(level)
    });
    
    if (existingLevelScore) {
      // Update if this is a better score
      if (totalScore > existingLevelScore.total_score) {
        existingLevelScore.total_score = totalScore;
        existingLevelScore.questions_correct = correctAnswers;
        existingLevelScore.total_time = totalTime || 0;
        existingLevelScore.is_completed = true;
        existingLevelScore.completed_at = new Date();
        existingLevelScore.attempts += 1;
        await existingLevelScore.save();
      } else {
        existingLevelScore.attempts += 1;
        await existingLevelScore.save();
      }
    } else {
      // Create new level score
      const levelScore = new LevelScore({
        user_id: userId,
        game_mode: gameMode,
        level: parseInt(level),
        total_score: totalScore,
        questions_correct: correctAnswers,
        total_time: totalTime || 0,
        is_completed: true,
        attempts: 1
      });
      await levelScore.save();
    }
    
    // Update user progress - unlock next level if current level is completed with good score
    const userProgress = await UserProgress.findOne({
      user_id: userId,
      game_mode: gameMode
    });
    
    if (userProgress) {
      // Update level completion
      const levelKey = `level_${level}` as keyof typeof userProgress.level_completion;
      userProgress.level_completion[levelKey] = {
        completed: true,
        score: totalScore,
        completed_at: new Date()
      };
      
      // Unlock next level if score is good enough (e.g., 60% correct)
      const scorePercentage = (correctAnswers / questions.length) * 100;
      if (scorePercentage >= 60 && parseInt(level) < 5) {
        const nextLevel = parseInt(level) + 1;
        if (!userProgress.unlocked_levels.includes(nextLevel)) {
          userProgress.unlocked_levels.push(nextLevel);
        }
        if (nextLevel > userProgress.current_level) {
          userProgress.current_level = nextLevel;
        }
      }
      
      await userProgress.save();
    }
    
    // Emit score update via Socket.io
    const io = req.app.get('io');
    io.emit('score-update', {
      userId,
      gameMode,
      level: parseInt(level),
      score: totalScore,
      correctAnswers,
      totalQuestions: questions.length
    });
    
    res.json({
      success: true,
      message: 'Jawaban berhasil disimpan',
      data: {
        score: totalScore,
        correctAnswers,
        totalQuestions: questions.length,
        percentage: Math.round((correctAnswers / questions.length) * 100),
        results: questionResults,
        nextLevelUnlocked: userProgress?.unlocked_levels.includes(parseInt(level) + 1) || false
      }
    });
  } catch (error) {
    console.error('Submit answers error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

/**
 * Get leaderboard for a specific game mode and level
 * GET /api/game/leaderboard/:gameMode/:level
 */
router.get('/leaderboard/:gameMode/:level', async (req: Request, res: Response): Promise<void> => {
  try {
    const { gameMode, level } = req.params;
    
    const leaderboard = await LevelScore.find({
      game_mode: gameMode,
      level: parseInt(level),
      is_completed: true
    })
    .populate('user_id', 'username')
    .sort({ total_score: -1, total_time: 1 })
    .limit(10);
    
    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

export default router;