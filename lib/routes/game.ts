import { Router } from 'express';
import type { Request, Response } from 'express';
import Question from '../../api/models/Question.js';
import DareInstruction from '../../api/models/DareInstruction.js';
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
    
    // Get user progress for both game modes
    const progress = await UserProgress.find({ user_id: userId });
    
    // Get level scores for this user
    const levelScores = await LevelScore.find({ user_id: userId });
    
    res.json({
      success: true,
      data: {
        progress: progress,
        levelScores: levelScores
      }
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
    let userProgress = await UserProgress.findOne({
      user_id: userId,
      game_mode: gameMode
    });
    
    // Create user progress if it doesn't exist (for new users)
    if (!userProgress) {
      userProgress = await UserProgress.create({
        user_id: userId,
        game_mode: gameMode,
        unlocked_levels: [1], // Level 1 unlocked by default
        current_level: 1,
        total_score: 0,
        completed_levels: []
      });
    }
    
    // Check if user has access to this level
    if (!userProgress.unlocked_levels.includes(levelNum)) {
      res.status(403).json({
        success: false,
        message: 'Level belum terbuka'
      });
      return;
    }
    

    
    // Get questions for this level with adaptive limits
    let questionLimit = 10; // Default limit to get all available questions
    
    // For dare mode, use a higher limit to get all available questions for any level
    if (gameMode === 'dare') {
      questionLimit = 15; // Set higher limit to get all available dare questions
    }
    
    let questionsForClient: any[] = [];
    
    if (gameMode === 'truth') {
      // Fetch from Question model for truth mode
      const questions = await Question.find({
        level: levelNum,
        game_mode: gameMode,
        is_active: true
      }).sort({ question_order: 1 }).limit(questionLimit);
      
      if (questions.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Soal tidak ditemukan untuk level ini'
        });
        return;
      }
      
      // Remove correct answers from response for security
      questionsForClient = questions.map(q => ({
        _id: q._id,
        question_text: q.question_text,
        options: q.options,
        question_order: q.question_order,
        level: q.level,
        game_mode: q.game_mode,
        question_type: q.question_type
      }));
    } else if (gameMode === 'dare') {
      // Fetch from DareInstruction model for dare mode
      const dareInstructions = await DareInstruction.find({
        level: levelNum,
        is_active: true
      }).sort({ created_at: 1 }).limit(questionLimit);
      
      if (dareInstructions.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Instruksi dare tidak ditemukan untuk level ini'
        });
        return;
      }
      
      // Transform dare instructions to match question format and remove correct answers
      questionsForClient = dareInstructions.map((dare, index) => ({
        _id: dare._id,
        question_text: dare.instruction_text,
        options: dare.options || { A: '', B: '', C: '', D: '' },
        question_order: index + 1,
        level: dare.level,
        game_mode: 'dare'
      }));
    }
    
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
    
    // Validate questionId format
    if (!questionId.match(/^[0-9a-fA-F]{24}$/)) {
      res.status(400).json({
        success: false,
        message: 'Invalid question ID format'
      });
      return;
    }

    // Try to find the question in Question model first
    let question = await Question.findById(questionId);
    let dareInstruction = null;
    let isCorrect = false;
    let correctAnswer = '';
    let explanation = '';
    
    if (question) {
      // Found in Question model (truth mode)
      if (question.question_type === 'essay') {
        // For essay questions, do case-insensitive comparison after trimming whitespace
        const userAnswerNormalized = userAnswer.toString().trim().toLowerCase();
        const correctAnswerNormalized = question.correct_answer.toString().trim().toLowerCase();
        isCorrect = userAnswerNormalized === correctAnswerNormalized;
      } else {
        // For multiple choice questions, exact match
        isCorrect = question.correct_answer === userAnswer;
      }
      correctAnswer = question.correct_answer;
      explanation = question.explanation;
    } else {
      // Try to find in DareInstruction model (dare mode)
      dareInstruction = await DareInstruction.findById(questionId);
      
      if (!dareInstruction) {
        res.status(404).json({
          success: false,
          message: 'Soal atau instruksi dare tidak ditemukan'
        });
        return;
      }
      
      // For dare instructions with multiple choice options
      if (dareInstruction.options && dareInstruction.correct_answer) {
        isCorrect = dareInstruction.correct_answer === userAnswer;
        correctAnswer = dareInstruction.correct_answer;
      } else {
        // For simple dare instructions without options, always consider correct
        isCorrect = true;
        correctAnswer = userAnswer;
      }
      explanation = ''; // Dare instructions don't have explanations
    }
    
    res.json({
      success: true,
      data: {
        isCorrect,
        correctAnswer,
        explanation
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
    const { gameMode, level, answers, timeSpent } = req.body;
    const userId = req.user._id;
    
    console.log('\n=== SUBMIT ENDPOINT DEBUG ===');
    console.log('req.user:', req.user);
    console.log('userId from req.user._id:', userId);
    console.log('gameMode:', gameMode);
    console.log('level:', level);
    
    // Validation
    if (!gameMode || !level || !answers || !Array.isArray(answers)) {
      res.status(400).json({
        success: false,
        message: 'Data tidak lengkap'
      });
      return;
    }
    
    // Get questions/dare instructions to check answers
    let questionsOrDares: any[] = [];
    
    if (gameMode === 'truth') {
      questionsOrDares = await Question.find({
        level: parseInt(level),
        game_mode: gameMode,
        is_active: true
      }).sort({ question_order: 1 }).limit(5);
    } else if (gameMode === 'dare') {
      questionsOrDares = await DareInstruction.find({
        level: parseInt(level),
        is_active: true
      }).sort({ created_at: 1 }).limit(5);
    }
    
    if (questionsOrDares.length === 0) {
      res.status(404).json({
        success: false,
        message: gameMode === 'truth' ? 'Soal tidak ditemukan' : 'Instruksi dare tidak ditemukan'
      });
      return;
    }
    
    // Calculate score
    let correctAnswers = 0;
    let totalScore = 0;
    const questionResults = [];
    
    console.log('=== SCORING DEBUG ===');
    console.log('Total questions/dares fetched:', questionsOrDares.length);
    console.log('Total answers received:', answers.length);
    console.log('Answers array:', answers);
    console.log('Array length difference:', questionsOrDares.length - answers.length);
    
    // Process all questions, not just the ones with answers
    for (let i = 0; i < questionsOrDares.length; i++) {
      const item = questionsOrDares[i];
      const userAnswer = answers[i] || 'NO_ANSWER'; // Handle missing answers
      
      console.log(`\n--- Processing Question/Dare ${i + 1} ---`);
      console.log('Item ID:', item._id);
      console.log('User Answer:', userAnswer);
      console.log('Answer exists:', i < answers.length);
      console.log('Item type:', gameMode === 'truth' ? 'Question' : 'DareInstruction');
      
      // Check if answer is correct based on item type
      let isCorrect = false;
      let correctAnswer = '';
      
      if (userAnswer !== undefined && userAnswer !== null && userAnswer !== 'TIMEOUT' && userAnswer !== 'NO_ANSWER') {
        if (gameMode === 'truth') {
          // Truth mode - Question model
          const question = item;
          if (question.question_type === 'essay') {
            // For essay questions, do case-insensitive comparison after trimming whitespace
            const userAnswerNormalized = userAnswer.toString().trim().toLowerCase();
            const correctAnswerNormalized = question.correct_answer.toString().trim().toLowerCase();
            isCorrect = userAnswerNormalized === correctAnswerNormalized;
          } else {
            // For multiple choice questions, exact match
            isCorrect = question.correct_answer === userAnswer;
          }
          correctAnswer = question.correct_answer;
        } else if (gameMode === 'dare') {
          // Dare mode - DareInstruction model
          const dareInstruction = item;
          if (dareInstruction.options && dareInstruction.correct_answer) {
            // Multiple choice dare
            isCorrect = dareInstruction.correct_answer === userAnswer;
            correctAnswer = dareInstruction.correct_answer;
          } else {
            // Simple dare - always correct if not timeout or no answer
            if (userAnswer !== 'TIMEOUT' && userAnswer !== 'NO_ANSWER') {
              isCorrect = true;
            }
            correctAnswer = userAnswer;
          }
        }
      }
      // TIMEOUT and NO_ANSWER are always incorrect for all question types
      
      const pointsForThisQuestion = gameMode === 'truth' ? (item.points || 10) : 10;
      
      if (isCorrect) {
        correctAnswers++;
        totalScore += pointsForThisQuestion;
      }
      
      console.log('Correct Answer Expected:', correctAnswer);
      console.log('Is Answer Correct:', isCorrect);
      console.log('Points for this question:', pointsForThisQuestion);
      console.log('Running total - Correct answers:', correctAnswers, 'Total score:', totalScore);
      console.log('Points earned:', isCorrect ? pointsForThisQuestion : 0);
      console.log('Running total - Correct Answers:', correctAnswers);
      console.log('Running total - Total Score:', totalScore);
      
      questionResults.push({
        question_id: item._id,
        user_answer: userAnswer,
        correct_answer: correctAnswer,
        is_correct: isCorrect,
        points_earned: isCorrect ? pointsForThisQuestion : 0
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
        time_spent: Math.round((timeSpent || 0) / questionResults.length), // Distribute time evenly
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
        existingLevelScore.total_time = timeSpent || 0;
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
        total_time: timeSpent || 0,
        is_completed: true,
        attempts: 1
      });
      await levelScore.save();
    }
    
    // Update user progress - unlock next level if current level is completed with good score
    console.log('=== LEVEL UNLOCKING DEBUG ===');
    console.log('Looking for UserProgress with userId:', userId, 'gameMode:', gameMode);
    console.log('Current level being completed:', level);
    
    let userProgress = await UserProgress.findOne({
      user_id: userId,
      game_mode: gameMode
    });
    
    console.log('Found userProgress:', userProgress ? 'Yes' : 'No');
    if (userProgress) {
      console.log('UserProgress ID:', userProgress._id);
      console.log('UserProgress user_id:', userProgress.user_id);
      console.log('UserProgress game_mode:', userProgress.game_mode);
    } else {
      console.log('No UserProgress found, creating new one...');
      // Create new UserProgress if it doesn't exist
      const newUserProgress = new UserProgress({
        user_id: userId,
        game_mode: gameMode,
        current_level: 1,
        unlocked_levels: [1],
        completed_levels: [],
        total_score: 0
      });
      await newUserProgress.save();
      console.log('Created new UserProgress:', newUserProgress._id);
      
      // Re-fetch the created record
      const createdProgress = await UserProgress.findById(newUserProgress._id);
      console.log('Re-fetched UserProgress:', createdProgress ? 'Yes' : 'No');
      
      // Use the created progress for the rest of the logic
      if (createdProgress) {
        userProgress = createdProgress;
      }
    }
    
    if (userProgress) {
      console.log('Before update - completed_levels:', userProgress.completed_levels);
      
      // Update level completion
      const levelKey = `level_${level}` as keyof typeof userProgress.level_completion;
      userProgress.level_completion[levelKey] = {
        completed: true,
        score: totalScore,
        completed_at: new Date()
      };
      
      // Add to completed_levels array if not already there
      const currentLevel = parseInt(level);
      if (!userProgress.completed_levels.includes(currentLevel)) {
        userProgress.completed_levels.push(currentLevel);
        console.log('Added level to completed_levels:', currentLevel);
      }
      
      // Unlock next level with adaptive scoring based on game mode
      const scorePercentage = (correctAnswers / questionsOrDares.length) * 100;
      console.log('Score percentage:', scorePercentage);
      
      // Different unlocking rules for different game modes
      console.log('Game mode:', gameMode);
      console.log('Current level:', currentLevel);
      console.log('Current unlocked_levels before update:', userProgress.unlocked_levels);
      
      if (gameMode === 'dare') {
        // For dare mode, always unlock next level after completion (regardless of score)
        console.log('Processing dare mode unlocking...');
        if (currentLevel < 5) {
          const nextLevel = currentLevel + 1;
          console.log('Next level to unlock:', nextLevel);
          if (!userProgress.unlocked_levels.includes(nextLevel)) {
            userProgress.unlocked_levels.push(nextLevel);
            console.log('✅ Unlocked next level for dare mode:', nextLevel);
          } else {
            console.log('⚠️ Next level already unlocked:', nextLevel);
          }
          if (nextLevel > userProgress.current_level) {
            userProgress.current_level = nextLevel;
            console.log('Updated current_level to:', nextLevel);
          }
        } else {
          console.log('Already at max level (5), no more levels to unlock');
        }
        console.log('Dare mode level', currentLevel, 'completed with score:', scorePercentage + '%');
      } else {
        // For truth mode, use score-based unlocking (60% threshold)
        const unlockThreshold = 60;
        if (scorePercentage >= unlockThreshold && currentLevel < 5) {
          const nextLevel = currentLevel + 1;
          if (!userProgress.unlocked_levels.includes(nextLevel)) {
            userProgress.unlocked_levels.push(nextLevel);
            console.log('Unlocked next level:', nextLevel);
          }
          if (nextLevel > userProgress.current_level) {
            userProgress.current_level = nextLevel;
          }
        }
      }
      
      console.log('After update - completed_levels:', userProgress.completed_levels);
      console.log('After update - unlocked_levels:', userProgress.unlocked_levels);
      
      await userProgress.save();
      console.log('✅ UserProgress saved successfully');
      
      // Verify the save by re-fetching
      const verifyProgress = await UserProgress.findOne({
        user_id: userId,
        game_mode: gameMode
      });
      console.log('🔍 Verification - unlocked_levels after save:', verifyProgress?.unlocked_levels);
      console.log('🔍 Verification - current_level after save:', verifyProgress?.current_level);
      console.log('🔍 Verification - completed_levels after save:', verifyProgress?.completed_levels);
      console.log('=== END LEVEL UNLOCKING DEBUG ===');
    } else {
      console.log('No userProgress found for userId:', userId, 'gameMode:', gameMode);
    }
    
    // Emit score update via Socket.io (if available)
    try {
      const io = req.app.get('io');
      if (io) {
        io.emit('score-update', {
          userId,
          gameMode,
          level: parseInt(level),
          score: totalScore,
          correctAnswers,
          totalQuestions: questionsOrDares.length
        });
      }
    } catch (socketError) {
      // Socket.io not configured, continue without real-time updates
      console.log('Socket.io not available for real-time updates');
    }
    
    console.log('\n=== FINAL SCORING SUMMARY ===');
    console.log('Final Total Score:', totalScore);
    console.log('Final Correct Answers:', correctAnswers);
    console.log('Total Questions:', questionsOrDares.length);
    console.log('Percentage:', Math.round((correctAnswers / questionsOrDares.length) * 100));
    console.log('Question Results:', questionResults);
    console.log('=== END SCORING DEBUG ===\n');
    
    res.json({
      success: true,
      message: 'Jawaban berhasil disimpan',
      data: {
        score: totalScore,
        correctAnswers,
        totalQuestions: questionsOrDares.length,
        percentage: Math.round((correctAnswers / questionsOrDares.length) * 100),
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
    
    // Get top scores for this level
    const topScores = await LevelScore.find({
      game_mode: gameMode,
      level: parseInt(level),
      is_completed: true
    })
    .populate('user_id', 'email')
    .sort({ total_score: -1, total_time: 1 })
    .limit(10);
    
    res.json({
      success: true,
      data: topScores
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

/**
 * Reset all user progress and level scores
 * DELETE /api/game/reset-progress
 */
router.delete('/reset-progress', async (req: any, res: Response): Promise<void> => {
  try {
    const userId = req.user._id;
    
    // Delete all user progress records
    await UserProgress.deleteMany({ user_id: userId });
    
    // Delete all level scores
    await LevelScore.deleteMany({ user_id: userId });
    
    // Delete all game sessions
    await GameSession.deleteMany({ user_id: userId });
    
    res.json({
      success: true,
      message: 'Progress berhasil direset. Semua data permainan telah dihapus.'
    });
  } catch (error) {
    console.error('Reset progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mereset progress'
    });
  }
});

export default router;