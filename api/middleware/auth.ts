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
    console.log('🔍 [AUTH DEBUG] Starting authentication check');
    console.log('🔍 [AUTH DEBUG] Request headers:', JSON.stringify(req.headers, null, 2));
    
    // Ensure database connection
    await connectToDatabase();
    console.log('🔍 [AUTH DEBUG] Database connected successfully');
    
    const authHeader = req.headers.authorization;
    console.log('🔍 [AUTH DEBUG] Authorization header:', authHeader);
    
    const token = authHeader && authHeader.split(' ')[1];
    console.log('🔍 [AUTH DEBUG] Extracted token:', token ? `${token.substring(0, 20)}...` : 'null');

    if (!token) {
      console.log('❌ [AUTH DEBUG] No token provided');
      return res.status(401).json({
        success: false,
        message: 'Token akses diperlukan'
      });
    }

    console.log('🔍 [AUTH DEBUG] JWT_SECRET exists:', !!process.env.JWT_SECRET);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    console.log('🔍 [AUTH DEBUG] Token decoded successfully:', { userId: decoded.userId, email: decoded.email });
    
    // Find user in database
    const user = await User.findById(decoded.userId);
    console.log('🔍 [AUTH DEBUG] User found in database:', user ? { id: user._id, email: user.email, role: user.role } : 'null');
    
    if (!user) {
      console.log('❌ [AUTH DEBUG] User not found in database');
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid'
      });
    }

    req.user = user;
    console.log('✅ [AUTH DEBUG] Authentication successful, proceeding to next middleware');
    next();
  } catch (error) {
    console.error('❌ [AUTH DEBUG] Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid'
    });
  }
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
  console.log('🔍 [ADMIN DEBUG] Starting admin role check');
  console.log('🔍 [ADMIN DEBUG] User object exists:', !!req.user);
  
  if (!req.user) {
    console.log('❌ [ADMIN DEBUG] No user object found in request');
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  console.log('🔍 [ADMIN DEBUG] User details:', { id: req.user._id, email: req.user.email, role: req.user.role });
  console.log('🔍 [ADMIN DEBUG] Required role: admin, User role:', req.user.role);
  
  if (req.user.role !== 'admin') {
    console.log('❌ [ADMIN DEBUG] User role is not admin, access denied');
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  console.log('✅ [ADMIN DEBUG] Admin role verified, proceeding to route handler');
  next();
};

export default { authenticateToken, requireAdmin };