import { Router } from 'express';
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import Question from '../../api/models/Question';
import DareInstruction from '../../api/models/DareInstruction.js';
import User from '../../api/models/User.js';
import GameSession from '../../api/models/GameSession.js';
import UserProgress from '../../api/models/UserProgress.js';
import LevelScore from '../../api/models/LevelScore.js';
import { authenticateToken, requireAdmin } from '../../api/middleware/auth.js';

interface AuthRequest extends Request {
  user?: any;
}

const router = Router();

// Apply authentication middleware to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Test endpoint to verify authentication status
router.get('/auth-test', (req: AuthRequest, res: Response) => {
  console.log('🔍 [AUTH TEST] Test endpoint called');
  console.log('🔍 [AUTH TEST] User object:', req.user ? {
    id: req.user._id,
    email: req.user.email,
    role: req.user.role,
    name: req.user.name
  } : 'null');
  
  res.json({
    success: true,
    message: 'Authentication test successful',
    user: req.user ? {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      name: req.user.name
    } : null,
    timestamp: new Date().toISOString()
  });
});

/**
 * Get all questions with pagination
 * GET /api/admin/questions
 */
router.get('/questions', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const gameMode = req.query.gameMode as string;
    const level = req.query.level as string;
    
    const filter: any = { is_active: { $ne: false } };
    if (gameMode) filter.game_mode = gameMode;
    if (level) filter.level = parseInt(level);
    
    const skip = (page - 1) * limit;
    
    const questions = await Question.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Question.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: limit
        }
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
 * Create new question
 * POST /api/admin/questions
 */
router.post('/questions', async (req: any, res: Response): Promise<void> => {
  try {
    const {
      question_text,
      options,
      correct_answer,
      level,
      game_mode,
      question_order,
      points,
      explanation,
      question_type
    } = req.body;
    
    // Validation
    if (!question_text || !correct_answer || !level || !game_mode || !explanation || !question_type) {
      res.status(400).json({
        success: false,
        message: 'Data tidak lengkap'
      });
      return;
    }
    
    // For multiple choice questions, options are required
    if (question_type === 'multiple_choice' && !options) {
      res.status(400).json({
        success: false,
        message: 'Options diperlukan untuk soal pilihan ganda'
      });
      return;
    }
    
    // Convert array options to object format for the model (only for multiple choice)
    let optionsObj;
    if (question_type === 'multiple_choice') {
      if (Array.isArray(options)) {
        if (options.length < 2) {
          res.status(400).json({
            success: false,
            message: 'Minimal 2 pilihan jawaban diperlukan'
          });
          return;
        }
        optionsObj = {
          A: options[0] || '',
          B: options[1] || '',
          C: options[2] || '',
          D: options[3] || ''
        };
      } else {
        optionsObj = options;
      }
    } else {
      // For essay questions, set empty options
      optionsObj = {
        A: '',
        B: '',
        C: '',
        D: ''
      };
    }
    
    if (!['truth', 'dare'].includes(game_mode)) {
      res.status(400).json({
        success: false,
        message: 'Mode permainan tidak valid'
      });
      return;
    }
    
    if (level < 1 || level > 5) {
      res.status(400).json({
        success: false,
        message: 'Level harus antara 1-5'
      });
      return;
    }
    
    // Check if question order already exists for this level and game mode
    if (question_order) {
      const existingQuestion = await Question.findOne({
        level,
        game_mode,
        question_order,
        is_active: true
      });
      
      if (existingQuestion) {
        res.status(400).json({
          success: false,
          message: 'Urutan soal sudah ada untuk level dan mode ini'
        });
        return;
      }
    }
    
    const question = new Question({
      question_text,
      options: optionsObj,
      correct_answer,
      level,
      game_mode,
      question_order: question_order || 1,
      points: points || 10,
      explanation,
      question_type: question_type || 'multiple_choice'
    });
    
    await question.save();
    
    res.status(201).json({
      success: true,
      message: 'Soal berhasil dibuat',
      data: question
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

/**
 * Update question
 * PUT /api/admin/questions/:id
 */
router.put('/questions/:id', async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove admin_id from update data for security
    delete updateData.admin_id;
    
    const question = await Question.findByIdAndUpdate(
      id,
      { ...updateData, updated_at: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!question) {
      res.status(404).json({
        success: false,
        message: 'Soal tidak ditemukan'
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Soal berhasil diperbarui',
      data: question
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

/**
 * Delete question
 * DELETE /api/admin/questions/:id
 */
router.delete('/questions/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const question = await Question.findByIdAndUpdate(
      id,
      { is_active: false },
      { new: true }
    );
    
    if (!question) {
      res.status(404).json({
        success: false,
        message: 'Soal tidak ditemukan'
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Soal berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

/**
 * Get all dare instructions
 * GET /api/admin/dare-instructions
 */
router.get('/dare-instructions', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const level = req.query.level as string;
    
    const filter: any = {};
    if (level) filter.level = parseInt(level);
    
    const skip = (page - 1) * limit;
    
    const instructions = await DareInstruction.find(filter)
      .populate('admin_id', 'username')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await DareInstruction.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        instructions,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: limit
        }
      }
    });
  } catch (error) {
    console.error('Get dare instructions error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

/**
 * Create new dare instruction
 * POST /api/admin/dare-instructions
 */
router.post('/dare-instructions', async (req: any, res: Response): Promise<void> => {
  try {
    const { instruction_text, level, options, correct_answer } = req.body;
    
    // Validation
    if (!instruction_text || !level) {
      res.status(400).json({
        success: false,
        message: 'Teks instruksi dan level diperlukan'
      });
      return;
    }
    
    if (level < 1 || level > 5) {
      res.status(400).json({
        success: false,
        message: 'Level harus antara 1-5'
      });
      return;
    }
    
    // If options are provided, validate them
    if (options && (!options.A || !options.B || !options.C || !options.D)) {
      res.status(400).json({
        success: false,
        message: 'Semua pilihan (A, B, C, D) harus diisi jika menggunakan pilihan ganda'
      });
      return;
    }
    
    if (options && !correct_answer) {
      res.status(400).json({
        success: false,
        message: 'Jawaban benar diperlukan jika menggunakan pilihan ganda'
      });
      return;
    }
    
    const instructionData: any = {
      admin_id: req.user._id,
      instruction_text,
      level
    };
    
    if (options) {
      instructionData.options = options;
      instructionData.correct_answer = correct_answer;
    }
    
    const instruction = new DareInstruction(instructionData);
    
    await instruction.save();
    
    res.status(201).json({
      success: true,
      message: 'Instruksi dare berhasil dibuat',
      data: instruction
    });
  } catch (error) {
    console.error('Create dare instruction error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

/**
 * Update dare instruction
 * PUT /api/admin/dare-instructions/:id
 */
router.put('/dare-instructions/:id', async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove admin_id from update data for security
    delete updateData.admin_id;
    
    const instruction = await DareInstruction.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!instruction) {
      res.status(404).json({
        success: false,
        message: 'Instruksi tidak ditemukan'
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Instruksi berhasil diperbarui',
      data: instruction
    });
  } catch (error) {
    console.error('Update dare instruction error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

/**
 * Delete dare instruction
 * DELETE /api/admin/dare-instructions/:id
 */
router.delete('/dare-instructions/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const instruction = await DareInstruction.findByIdAndUpdate(
      id,
      { is_active: false },
      { new: true }
    );
    
    if (!instruction) {
      res.status(404).json({
        success: false,
        message: 'Instruksi tidak ditemukan'
      });
      return;
    }
    
    res.json({
      success: true,
      message: 'Instruksi berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete dare instruction error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

/**
 * Get dashboard statistics
 * GET /api/admin/stats
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalQuestions = await Question.countDocuments({ is_active: true });
    const totalDareInstructions = await DareInstruction.countDocuments({ is_active: true });
    
    const questionsByMode = await Question.aggregate([
      { $match: { is_active: true } },
      { $group: { _id: '$game_mode', count: { $sum: 1 } } }
    ]);
    
    const questionsByLevel = await Question.aggregate([
      { $match: { is_active: true } },
      { $group: { _id: '$level', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalUsers,
        totalQuestions,
        totalDareInstructions,
        questionsByMode,
        questionsByLevel
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

/**
 * User Analytics - Overview
 * GET /api/admin/analytics/overview
 */
router.get('/analytics/overview', async (req: Request, res: Response): Promise<void> => {
  try {
    const [totalSessions, totalUsers, avgScore, totalPlayTime] = await Promise.all([
      GameSession.countDocuments(),
      GameSession.distinct('user_id').then(users => users.length),
      GameSession.aggregate([{ $group: { _id: null, avgScore: { $avg: '$score' } } }]),
      GameSession.aggregate([{ $group: { _id: null, totalTime: { $sum: '$time_spent' } } }])
    ]);

    // Get daily active users for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailyActiveUsers = await GameSession.aggregate([
      { $match: { played_at: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$played_at' } },
          uniqueUsers: { $addToSet: '$user_id' }
        }
      },
      {
        $project: {
          date: '$_id',
          activeUsers: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalSessions,
        totalUsers,
        averageScore: avgScore[0]?.avgScore || 0,
        totalPlayTime: totalPlayTime[0]?.totalTime || 0,
        dailyActiveUsers
      }
    });
  } catch (error) {
    console.error('Error fetching analytics overview:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

/**
 * User Analytics - Performance by Level
 * GET /api/admin/analytics/performance
 */
router.get('/analytics/performance', async (req: Request, res: Response): Promise<void> => {
  try {
    const performanceByLevel = await GameSession.aggregate([
      {
        $group: {
          _id: { level: '$level', game_mode: '$game_mode' },
          totalSessions: { $sum: 1 },
          averageScore: { $avg: '$score' },
          averageTime: { $avg: '$time_spent' },
          correctAnswers: { $sum: { $cond: ['$is_correct', 1, 0] } },
          totalQuestions: { $sum: 1 }
        }
      },
      {
        $project: {
          level: '$_id.level',
          gameMode: '$_id.game_mode',
          totalSessions: 1,
          averageScore: { $round: ['$averageScore', 2] },
          averageTime: { $round: ['$averageTime', 2] },
          accuracyRate: { 
            $round: [{ $multiply: [{ $divide: ['$correctAnswers', '$totalQuestions'] }, 100] }, 2] 
          }
        }
      },
      { $sort: { level: 1, gameMode: 1 } }
    ]);

    res.json({
      success: true,
      data: { performanceByLevel }
    });
  } catch (error) {
    console.error('Error fetching performance analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

/**
 * User Analytics - Top Performers
 * GET /api/admin/analytics/top-performers
 */
router.get('/analytics/top-performers', async (req: Request, res: Response): Promise<void> => {
  try {
    const topPerformers = await GameSession.aggregate([
      {
        $group: {
          _id: '$user_id',
          totalScore: { $sum: '$score' },
          totalSessions: { $sum: 1 },
          totalTime: { $sum: '$time_spent' },
          correctAnswers: { $sum: { $cond: ['$is_correct', 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          username: '$user.username',
          email: '$user.email',
          totalScore: 1,
          totalSessions: 1,
          totalTime: 1,
          averageScore: { $round: [{ $divide: ['$totalScore', '$totalSessions'] }, 2] },
          accuracyRate: { 
            $round: [{ $multiply: [{ $divide: ['$correctAnswers', '$totalSessions'] }, 100] }, 2] 
          }
        }
      },
      { $sort: { totalScore: -1 } },
      { $limit: 20 }
    ]);

    res.json({
      success: true,
      data: { topPerformers }
    });
  } catch (error) {
    console.error('Error fetching top performers:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

/**
 * User Analytics - Individual User Details
 * GET /api/admin/analytics/user/:userId
 */
router.get('/analytics/user/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
      return;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get user basic info
    const user = await User.findById(userObjectId).select('username email created_at');
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Get user's game sessions
    const sessions = await GameSession.find({ user_id: userObjectId })
      .populate('question_id', 'question_text level game_mode')
      .sort({ played_at: -1 })
      .limit(50);

    // Get user progress
    const progress = await UserProgress.find({ user_id: userObjectId });

    // Get level scores
    const levelScores = await LevelScore.find({ user_id: userObjectId });

    // Calculate statistics
    const stats = await GameSession.aggregate([
      { $match: { user_id: userObjectId } },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalScore: { $sum: '$score' },
          totalTime: { $sum: '$time_spent' },
          correctAnswers: { $sum: { $cond: ['$is_correct', 1, 0] } },
          averageScore: { $avg: '$score' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        user,
        sessions,
        progress,
        levelScores,
        statistics: stats[0] || {
          totalSessions: 0,
          totalScore: 0,
          totalTime: 0,
          correctAnswers: 0,
          averageScore: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

/**
 * Get all users with pagination
 * GET /api/admin/users
 */
router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const role = req.query.role as string;
    
    const filter: any = {};
    if (role) filter.role = role;
    
    const skip = (page - 1) * limit;
    
    const users = await User.find(filter)
      .select('-password')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: limit
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

/**
 * Create admin user
 * POST /api/admin/create-admin
 */
router.post('/create-admin', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;
    
    // Validation
    if (!username || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Username, email, dan password diperlukan'
      });
      return;
    }
    
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password minimal 6 karakter'
      });
      return;
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Username atau email sudah digunakan'
      });
      return;
    }
    
    // Create admin user
    const adminUser = new User({
      username,
      email,
      password,
      role: 'admin'
    });
    
    await adminUser.save();
    
    // Remove password from response
    const userResponse = adminUser.toObject();
    delete userResponse.password_hash;
    
    res.status(201).json({
      success: true,
      message: 'Admin berhasil dibuat',
      data: userResponse
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

export default router;