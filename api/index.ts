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
import { authenticateToken, requireAdmin } from './middleware/auth.js';
import authRoutes from '../lib/routes/auth.ts';
import gameRoutes from '../lib/routes/game.ts';
import adminRoutes from '../lib/routes/admin.ts';

// Load environment variables
dotenv.config();


// Create Express app
const app = express();

// Middleware
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  process.env.PRODUCTION_URL || "https://www.elphyta.online",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:3000",
  "https://www.elphyta.online",
  "https://elphyta.online",
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

// Mount routes
app.use('/auth', authRoutes);
app.use('/game', gameRoutes);
app.use('/admin', adminRoutes);

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
  
  // Connect to database before starting server
  connectToDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }).catch((error) => {
    console.error('Failed to connect to database:', error);
    process.exit(1);
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