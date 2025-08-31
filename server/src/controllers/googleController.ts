import { Request, Response } from 'express';
import User from '../models/User';
import RefreshToken from '../models/RefreshToken';
import { generateTokens } from '../utils/jwt';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

function getClientUrl(): string {
  // Prefer explicit CLIENT_URL, otherwise first CORS origin, fallback to localhost
  const explicit = process.env.CLIENT_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  const cors = process.env.CORS_ORIGIN?.split(',').map(s => s.trim()).filter(Boolean) || [];
  if (cors.length > 0) return cors[0].replace(/\/$/, '');
  return 'http://localhost:5173';
}

function getRedirectUri(): string {
  return (process.env.GOOGLE_CALLBACK_URL || '').replace(/\/$/, '') || 'http://localhost:5000/api/auth/google/callback';
}

export class GoogleController {
  static async startOAuth(req: Request, res: Response): Promise<void> {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID as string;
      const redirectUri = getRedirectUri();
      const scope = encodeURIComponent('openid email profile');
      const state = encodeURIComponent(req.query.state as string || '');

      const url = `${GOOGLE_AUTH_URL}?client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code&scope=${scope}&access_type=offline&prompt=consent` +
        (state ? `&state=${state}` : '');

      res.redirect(url);
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to start Google OAuth' });
    }
  }

  static async handleCallback(req: Request, res: Response): Promise<void> {
    try {
      const code = req.query.code as string;
      if (!code) {
        res.status(400).json({ success: false, message: 'Missing authorization code' });
        return;
      }

      const clientId = process.env.GOOGLE_CLIENT_ID as string;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET as string;
      const redirectUri = getRedirectUri();

      // Exchange code for tokens
      const params = new URLSearchParams();
      params.set('code', code);
      params.set('client_id', clientId);
      params.set('client_secret', clientSecret);
      params.set('redirect_uri', redirectUri);
      params.set('grant_type', 'authorization_code');

      const tokenResp = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (!tokenResp.ok) {
        const errText = await tokenResp.text();
        console.error('Google token error:', errText);
        res.status(400).json({ success: false, message: 'Failed to exchange Google code' });
        return;
      }

      const tokenJson: any = await tokenResp.json();
      const accessToken: string = tokenJson.access_token;

      // Fetch user info
      const userInfoResp = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!userInfoResp.ok) {
        const errText = await userInfoResp.text();
        console.error('Google userinfo error:', errText);
        res.status(400).json({ success: false, message: 'Failed to fetch Google profile' });
        return;
      }
      const profile: any = await userInfoResp.json();
      const email = (profile.email || '').toLowerCase();
      const firstName = profile.given_name || profile.name || 'User';
      const lastName = profile.family_name || '';

      if (!email) {
        res.status(400).json({ success: false, message: 'Google profile missing email' });
        return;
      }

      // Upsert user
      let user = await User.findOne({ email });
      if (!user) {
        user = new User({
          firstName,
          lastName,
          email,
          password: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
          isEmailVerified: true,
        });
        await user.save();
      }

      // Issue our tokens
      const tokens = generateTokens({ userId: user._id.toString(), email: user.email });
      await RefreshToken.create({
        token: tokens.refreshToken,
        userId: user._id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      // Build minimal user payload for the client
      const userPayload = {
        _id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isEmailVerified: true,
      };

      // Redirect back to client; pass tokens and user via URL fragment
      const clientUrl = getClientUrl();
      const redirect = `${clientUrl}/auth/callback#access=${encodeURIComponent(tokens.accessToken)}&refresh=${encodeURIComponent(tokens.refreshToken)}&user=${encodeURIComponent(Buffer.from(JSON.stringify(userPayload)).toString('base64'))}`;
      res.redirect(redirect);
    } catch (e) {
      console.error('Google callback error:', e);
      res.status(500).json({ success: false, message: 'Failed to complete Google OAuth' });
    }
  }
}

export default GoogleController;
