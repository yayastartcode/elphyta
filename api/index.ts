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
import connectDatabase from './config/database.js';
import User from './models/User.js';
import Question from './models/Question.js';
import GameSession from './models/GameSession.js';
import UserProgress from './models/UserProgress.js';
import LevelScore from './models/LevelScore.js';
import DareInstruction from './models/DareInstruction.js';
import { authenticateToken } from './middleware/auth.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDatabase();

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// AUTH ROUTES
// Register
app.post('/auth/register', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
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
      name,
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
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    });
  }
});

// Login
app.post('/auth/login', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
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
    const user = await User.findById(req.user.userId).select('-password_hash');
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
    const progress = await UserProgress.find({ user_id: req.user.userId });
    const levelScores = await LevelScore.find({ user_id: req.user.userId });
    
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
    const { gameMode, level } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const questions = await Question.find({
      game_mode: gameMode,
      level: parseInt(level)
    }).limit(limit);
    
    if (questions.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Tidak ada pertanyaan untuk level ini'
      });
      return;
    }
    
    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    console.error('Get questions error:', error);
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

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}