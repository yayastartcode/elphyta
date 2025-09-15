/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../../api/models/User.js'
import UserProgress from '../../api/models/UserProgress.js'
import { authenticateToken } from '../../api/middleware/auth.js'

const router = Router()

/**
 * User Registration
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body

    // Validation
    if (!username || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Username, email, dan password diperlukan'
      })
      return
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password minimal 6 karakter'
      })
      return
    }

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { name: username }] 
    })
    
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Username atau email sudah terdaftar'
      })
      return
    }

    // Hash password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user
    const user = new User({
      name: username,
      email,
      password_hash: hashedPassword
    })

    await user.save()

    // Create initial user progress for both game modes
    await UserProgress.create([
      {
        user_id: user._id,
        game_mode: 'truth',
        current_level: 1,
        unlocked_levels: [1]
      },
      {
        user_id: user._id,
        game_mode: 'dare',
        current_level: 1,
        unlocked_levels: [1]
      }
    ])

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: {
        token,
        user: {
          id: user._id,
          username: user.name,
          email: user.email,
          role: user.role
        }
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    })
  }
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email dan password diperlukan'
      })
      return
    }

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      })
      return
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      })
      return
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        token,
        user: {
          id: user._id,
          username: user.name,
          email: user.email,
          role: user.role
        }
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    })
  }
})

/**
 * Get Current User
 * GET /api/auth/me
 */
router.get('/me', authenticateToken, async (req: any, res: Response): Promise<void> => {
  try {
    res.json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          username: req.user.name,
          email: req.user.email,
          role: req.user.role
        }
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server'
    })
  }
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  // Since we're using JWT, logout is handled on client side
  // by removing the token from storage
  res.json({
    success: true,
    message: 'Logout berhasil'
  })
})

export default router
