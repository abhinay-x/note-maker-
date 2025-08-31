import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import User from '../models/User';
import OTP from '../models/OTP';
import RefreshToken from '../models/RefreshToken';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { sendOTPEmail, generateOTP } from '../utils/email';
import { APIResponse, AuthTokens } from '../types';

export class AuthController {
  // Email signup - Step 1: Send OTP
  static async signupEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        const response: APIResponse = {
          success: false,
          message: 'All fields are required: email, password, firstName, lastName',
        };
        res.status(400).json(response);
        return;
      }

      // Basic email validation
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        const response: APIResponse = {
          success: false,
          message: 'Please enter a valid email address',
        };
        res.status(400).json(response);
        return;
      }

      // Password validation
      if (password.length < 8) {
        const response: APIResponse = {
          success: false,
          message: 'Password must be at least 8 characters long',
        };
        res.status(400).json(response);
        return;
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        const response: APIResponse = {
          success: false,
          message: 'User with this email already exists',
        };
        res.status(400).json(response);
        return;
      }

      // Generate and send OTP
      const otpCode = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store OTP in database
      await OTP.create({
        email,
        otp: otpCode,
        purpose: 'signup',
        expiresAt,
      });

      // Send OTP email
      await sendOTPEmail(email, otpCode);

      // Store temporary user data
      const hashedPassword = await bcrypt.hash(password, 12);

      const response: APIResponse = {
        success: true,
        message: 'OTP sent to your email address',
        data: {
          email,
          tempData: {
            hashedPassword,
            firstName,
            lastName,
          },
        },
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Signup error:', error);
      const response: APIResponse = {
        success: false,
        message: 'Internal server error',
      };
      res.status(500).json(response);
    }
  }

  // Email signup - Step 2: Verify OTP and create user
  static async verifyOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp, tempData } = req.body;

      console.log('OTP Verification Request:', { email, otp, tempData: !!tempData });

      // Validate required fields
      if (!email || !otp || !tempData) {
        const response: APIResponse = {
          success: false,
          message: 'Email, OTP, and tempData are required',
        };
        res.status(400).json(response);
        return;
      }

      // Verify OTP
      const otpDoc = await OTP.findOne({
        email,
        otp,
        expiresAt: { $gt: new Date() },
        isUsed: false,
        purpose: 'signup'
      }).sort({ createdAt: -1 });

      console.log('OTP Document found:', !!otpDoc);

      if (!otpDoc) {
        // Check if OTP exists but is expired or used
        const anyOtpDoc = await OTP.findOne({ email, otp, purpose: 'signup' }).sort({ createdAt: -1 });
        
        if (anyOtpDoc) {
          if (anyOtpDoc.isUsed) {
            const response: APIResponse = {
              success: false,
              message: 'OTP has already been used',
            };
            res.status(400).json(response);
            return;
          } else if (anyOtpDoc.expiresAt <= new Date()) {
            const response: APIResponse = {
              success: false,
              message: 'OTP has expired',
            };
            res.status(400).json(response);
            return;
          }
        }

        const response: APIResponse = {
          success: false,
          message: 'Invalid OTP',
        };
        res.status(400).json(response);
        return;
      }

      // Mark OTP as used
      otpDoc.isUsed = true;
      await otpDoc.save();

      // Create user
      const user = new User({
        firstName: tempData.firstName,
        lastName: tempData.lastName,
        email,
        password: tempData.hashedPassword,
        isEmailVerified: true,
      });

      await user.save();
      const tokens = generateTokens({ userId: user._id.toString(), email: user.email });

      // Store refresh token
      await RefreshToken.create({
        token: tokens.refreshToken,
        userId: user._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      const response: APIResponse = {
        success: true,
        message: 'Account created successfully',
        data: {
          user: {
            id: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          tokens,
        },
      };
      res.status(201).json(response);
    } catch (error) {
      console.error('OTP verification error:', error);
      const response: APIResponse = {
        success: false,
        message: 'Internal server error',
      };
      res.status(500).json(response);
    }
  }

  // Email login
  static async loginEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ email });
      if (!user) {
        const response: APIResponse = {
          success: false,
          message: 'Invalid email or password',
        };
        res.status(401).json(response);
        return;
      }

      // Check password
      if (!(await user.comparePassword(password))) {
        const response: APIResponse = {
          success: false,
          message: 'Invalid email or password',
        };
        res.status(401).json(response);
        return;
      }

      // Update last login
      user.lastLoginAt = new Date();
      await user.save();

      // Generate tokens
      const tokens = generateTokens({ userId: user._id.toString(), email: user.email });

      // Store refresh token
      await RefreshToken.create({
        token: tokens.refreshToken,
        userId: user._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      const response: APIResponse = {
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          tokens,
        },
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Login error:', error);
      const response: APIResponse = {
        success: false,
        message: 'Internal server error',
      };
      res.status(500).json(response);
    }
  }

  // Refresh token
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        const response: APIResponse = {
          success: false,
          message: 'Refresh token required',
        };
        res.status(401).json(response);
        return;
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Check if refresh token exists in database
      const tokenDoc = await RefreshToken.findOne({
        token: refreshToken,
        expiresAt: { $gt: new Date() },
        isRevoked: false
      });

      if (!tokenDoc) {
        const response: APIResponse = {
          success: false,
          message: 'Invalid or expired refresh token',
        };
        res.status(403).json(response);
        return;
      }

      // Generate new tokens
      const tokens = generateTokens({ userId: tokenDoc.userId.toString(), email: decoded.email });

      // Update refresh token in database
      tokenDoc.token = tokens.refreshToken;
      tokenDoc.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await tokenDoc.save();

      const response: APIResponse = {
        success: true,
        message: 'Tokens refreshed successfully',
        data: { tokens },
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Token refresh error:', error);
      const response: APIResponse = {
        success: false,
        message: 'Invalid refresh token',
      };
      res.status(403).json(response);
    }
  }

  // Logout
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        // Remove refresh token from database
        await RefreshToken.findOneAndDelete({ token: refreshToken });
      }

      const response: APIResponse = {
        success: true,
        message: 'Logged out successfully',
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Logout error:', error);
      const response: APIResponse = {
        success: false,
        message: 'Internal server error',
      };
      res.status(500).json(response);
    }
  }

  // Forgot password - send OTP to email
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) {
        const response: APIResponse = {
          success: true,
          message: 'If an account exists for this email, an OTP has been sent',
        };
        res.status(200).json(response);
        return;
      }

      // Generate and store OTP for password reset
      const otpCode = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await OTP.create({ email, otp: otpCode, purpose: 'password_reset', expiresAt });

      // Send OTP
      await sendOTPEmail(email, otpCode);

      const response: APIResponse = {
        success: true,
        message: 'OTP sent to your email address',
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Forgot password error:', error);
      const response: APIResponse = {
        success: false,
        message: 'Internal server error',
      };
      res.status(500).json(response);
    }
  }

  // Reset password using OTP
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp, newPassword } = req.body;

      // Verify OTP for password_reset
      const otpDoc = await OTP.findOne({
        email,
        otp,
        purpose: 'password_reset',
        isUsed: false,
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      if (!otpDoc) {
        const response: APIResponse = {
          success: false,
          message: 'Invalid or expired OTP',
        };
        res.status(400).json(response);
        return;
      }

      // Mark OTP as used
      otpDoc.isUsed = true;
      await otpDoc.save();

      // Update user password (pre-save hook will hash if not already hashed)
      const user = await User.findOne({ email });
      if (!user) {
        const response: APIResponse = {
          success: false,
          message: 'User not found',
        };
        res.status(404).json(response);
        return;
      }

      user.password = newPassword;
      await user.save();

      // Optionally revoke existing refresh tokens
      await RefreshToken.updateMany({ userId: user._id }, { $set: { isRevoked: true } });

      const response: APIResponse = {
        success: true,
        message: 'Password has been reset successfully',
      };
      res.status(200).json(response);
    } catch (error) {
      console.error('Reset password error:', error);
      const response: APIResponse = {
        success: false,
        message: 'Internal server error',
      };
      res.status(500).json(response);
    }
  }
}
