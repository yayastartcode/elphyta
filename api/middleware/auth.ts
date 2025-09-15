import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../models/User.js';
import mongoose from 'mongoose';
import connectToDatabase from '../config/vercel-database.js';

interface AuthRequest extends Request {
  user?: any;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    // Ensure database connection
    await connectToDatabase();
    
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token akses diperlukan'
      });
    }

    console.log('JWT_SECRET:', process.env.JWT_SECRET);
    console.log('Token:', token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    console.log('Decoded token:', decoded);
    console.log('Looking for user with ID:', decoded.userId);
    console.log('Database connection state:', mongoose.connection.readyState);
    
    try {
      const user = await User.findById(decoded.userId).select('-password_hash');
      console.log('Found user:', user ? 'YES' : 'NO');
      if (user) {
        console.log('User details:', { id: user._id, email: user.email, name: user.name });
      }
    } catch (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({
        success: false,
        message: 'Database error'
      });
    }
    
    const user = await User.findById(decoded.userId).select('-password_hash');
    
    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Token tidak valid'
    });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
  try {
    if (!req.user) {
      console.log('❌ No user found in request');
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (req.user.role !== 'admin') {
      console.log(`❌ User ${req.user.email} is not admin, role: ${req.user.role}`);
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    console.log(`✅ Admin access granted for ${req.user.email}`);
    next();
  } catch (error) {
    console.error('❌ Error in requireAdmin middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export default { authenticateToken, requireAdmin };