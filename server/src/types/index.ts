export interface User {
  id: string;
  email: string;
  password_hash?: string;
  google_id?: string;
  first_name: string;
  last_name: string;
  profile_picture?: string;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

export interface OTP {
  id: string;
  email: string;
  otp_code: string;
  expires_at: Date;
  verified: boolean;
  created_at: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface GoogleProfile {
  id: string;
  email: string;
  given_name: string;
  family_name: string;
  picture?: string;
}
