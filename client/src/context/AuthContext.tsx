import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthTokens, AuthContextType, LoginFormData, SignupFormData, OTPFormData } from '@/types';
import apiService from '@/services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user data and tokens from localStorage on app start
    const storedUser = localStorage.getItem('user_data');
    const storedTokens = apiService.getTokens();

    if (storedUser && storedTokens) {
      setUser(JSON.parse(storedUser));
      setTokens(storedTokens);
    }
    
    setIsLoading(false);
  }, []);

  const login = async (data: LoginFormData): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await apiService.loginEmail({
        email: data.email,
        password: data.password,
      });

      if (response.success && response.data) {
        setUser(response.data.user);
        setTokens(response.data.tokens);
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupFormData): Promise<{ email: string; tempData: any }> => {
    setIsLoading(true);
    try {
      const response = await apiService.signupEmail({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      if (response.success && response.data) {
        return {
          email: response.data.email,
          tempData: response.data.tempData,
        };
      } else {
        throw new Error(response.message || 'Signup failed');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (data: OTPFormData & { tempData: any }): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await apiService.verifyOTP({
        email: data.email,
        otp: data.otp,
        tempData: data.tempData,
      });

      if (response.success && response.data) {
        setUser(response.data.user);
        setTokens(response.data.tokens);
      } else {
        throw new Error(response.message || 'OTP verification failed');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'OTP verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    apiService.logout();
    setUser(null);
    setTokens(null);
  };

  const refreshToken = async (): Promise<void> => {
    // This is handled automatically by the API service interceptors
    const newTokens = apiService.getTokens();
    if (newTokens) {
      setTokens(newTokens);
    }
  };

  const value: AuthContextType = {
    user,
    tokens,
    isLoading,
    isAuthenticated: !!user && !!tokens,
    login,
    signup,
    verifyOTP,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
