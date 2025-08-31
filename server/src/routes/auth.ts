import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { GoogleController } from '../controllers/googleController';
import { validateSignup, validateLogin, validateOTP, validateForgotPassword, validateResetPassword } from '../middleware/validation';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter';

const router = Router();

// Email signup routes
router.post('/signup/email', authLimiter, validateSignup, AuthController.signupEmail);
router.post('/verify-otp', otpLimiter, validateOTP, AuthController.verifyOTP);

// Login routes
router.post('/login/email', authLimiter, validateLogin, AuthController.loginEmail);

// Google OAuth routes
router.get('/google', GoogleController.startOAuth);
router.get('/google/callback', GoogleController.handleCallback);

// Token management
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', AuthController.logout);

// Password reset
router.post('/forgot-password', authLimiter, validateForgotPassword, AuthController.forgotPassword);
router.post('/reset-password', authLimiter, validateResetPassword, AuthController.resetPassword);

export default router;
