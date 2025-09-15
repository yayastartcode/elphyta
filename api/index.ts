/**
 * Single consolidated API handler for Vercel deployment
 * All routes are defined in this single file to avoid function limits
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import connectToDatabase from './config/vercel-database.js';
import User from './models/User.js';
import Question from './models/Question.js';
import GameSession from './models/GameSession.js';
import UserProgress from './models/UserProgress.js';
import LevelScore from './models/LevelScore.js';
import DareInstruction from './models/DareInstruction.js';
import { authenticateToken } from './middleware/auth.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  process.env.PRODUCTION_URL || "https://www.elphyta.online",
  "http://localhost:5173",
  "http://localhost:3000",
  "https://www.elphyta.online",
  // Vercel preview and production domains will be added automatically
];

// Add Vercel domains if in production
if (process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
}
if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or is a Vercel preview URL
    if (allowedOrigins.includes(origin) || origin.includes('.vercel.app')) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// AUTH ROUTES
// Register
app.post('/auth/register', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    await connectToDatabase();
    console.log('Registration request body:', req.body);
    const { name, username, email, password } = req.body;
    const actualName = name || username; // Handle both field names
    
    console.log('Extracted fields:', { actualName, email, password: password ? '[HIDDEN]' : 'undefined' });
    
    if (!actualName || !email || !password) {
      console.log('Missing required fields:', { name: !actualName, email: !email, password: !password });
      res.status(400).json({
        success: false,
        message: 'Nama, email, dan password diperlukan'
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
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar'
      });
      return;
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = new User({
      name: actualName,
      email,
      password_hash: hashedPassword,
      role: 'player'
    });
    
    await user.save();
    
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Register error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// Login
app.post('/auth/login', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    await connectToDatabase();
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email dan password diperlukan'
      });
      return;
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
      return;
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
      return;
    }
    
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

// Get current user
app.get('/auth/me', authenticateToken, async (req: any, res: express.Response): Promise<void> => {
  try {
    const user = await User.findById(req.user._id).select('-password_hash');
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
      return;
    }
    
    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

// Logout
app.post('/auth/logout', async (req: express.Request, res: express.Response): Promise<void> => {
  res.json({
    success: true,
    message: 'Logout berhasil'
  });
});

// GAME ROUTES
// Get user progress
app.get('/game/progress', authenticateToken, async (req: any, res: express.Response): Promise<void> => {
  try {
    const progress = await UserProgress.find({ user_id: req.user._id });
    const levelScores = await LevelScore.find({ user_id: req.user._id });
    
    res.json({
      success: true,
      data: {
        progress,
        levelScores
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

// Get questions
app.get('/game/questions/:gameMode/:level', authenticateToken, async (req: any, res: express.Response): Promise<void> => {
  try {
    await connectToDatabase();
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

// Validate answer
app.post('/game/validate-answer', authenticateToken, async (req: any, res: express.Response): Promise<void> => {
  try {
    await connectToDatabase();
    const { questionId, selectedAnswer } = req.body;
    
    // Enhanced validation
    if (!questionId || typeof questionId !== 'string' || questionId.trim() === '') {
      res.status(400).json({
        success: false,
        message: 'Question ID is required and must be a valid string'
      });
      return;
    }
    
    if (selectedAnswer === undefined || selectedAnswer === null || selectedAnswer === '') {
      res.status(400).json({
        success: false,
        message: 'Selected answer is required'
      });
      return;
    }
    
    // Validate selectedAnswer is a valid option (A, B, C, D)
    if (!['A', 'B', 'C', 'D'].includes(selectedAnswer)) {
      res.status(400).json({
        success: false,
        message: 'Selected answer must be A, B, C, or D'
      });
      return;
    }
    
    const question = await Question.findById(questionId);
    if (!question) {
      res.status(404).json({
        success: false,
        message: 'Pertanyaan tidak ditemukan'
      });
      return;
    }
    
    const isCorrect = question.correct_answer === selectedAnswer;
    
    res.json({
      success: true,
      data: {
        isCorrect,
        correctAnswer: question.correct_answer,
        explanation: question.explanation || null
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

// Submit game score
app.post('/game/submit', authenticateToken, async (req: any, res: express.Response): Promise<void> => {
  try {
    await connectToDatabase();
    const { gameMode, level, score, totalQuestions, correctAnswers } = req.body;
    const userId = req.user.userId;
    
    if (!gameMode || !level || score === undefined) {
      res.status(400).json({
        success: false,
        message: 'Data permainan tidak lengkap'
      });
      return;
    }
    
    // Save level score
    const levelScore = await LevelScore.create({
      user_id: userId,
      game_mode: gameMode,
      level: parseInt(level),
      score: score,
      total_questions: totalQuestions || 5,
      correct_answers: correctAnswers || 0,
      completed_at: new Date()
    });
    
    // Update user progress
    let userProgress = await UserProgress.findOne({
      user_id: userId,
      game_mode: gameMode
    });
    
    if (!userProgress) {
      userProgress = await UserProgress.create({
        user_id: userId,
        game_mode: gameMode,
        unlocked_levels: [1],
        current_level: 1,
        total_score: score,
        completed_levels: []
      });
    }
    
    // Update progress
    const levelNum = parseInt(level);
    if (!userProgress.completed_levels.includes(levelNum)) {
      userProgress.completed_levels.push(levelNum);
    }
    
    // Unlock next level if score is good enough (70% or higher)
    const percentage = (correctAnswers / totalQuestions) * 100;
    if (percentage >= 70 && levelNum < 5) {
      const nextLevel = levelNum + 1;
      if (!userProgress.unlocked_levels.includes(nextLevel)) {
        userProgress.unlocked_levels.push(nextLevel);
      }
    }
    
    userProgress.total_score += score;
    userProgress.current_level = Math.max(userProgress.current_level, levelNum);
    
    await userProgress.save();
    
    res.json({
      success: true,
      data: {
        levelScore,
        userProgress,
        nextLevelUnlocked: percentage >= 70 && levelNum < 5
      }
    });
  } catch (error) {
    console.error('Submit score error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

// Health check
app.get('/health', (req: express.Request, res: express.Response) => {
  res.status(200).json({
    success: true,
    message: 'API is running'
  });
});

// 404 handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found'
  });
});

// Error handler
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// For local development
if (process.env.NODE_ENV === 'development') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// For Vercel deployment
export default function handler(req: VercelRequest, res: VercelResponse) {
  // Strip /api prefix for Vercel routing
  if (req.url?.startsWith('/api')) {
    req.url = req.url.substring(4);
  }
  return app(req, res);
}