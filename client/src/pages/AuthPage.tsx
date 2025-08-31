import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import SplitScreenLayout from '@/components/layout/SplitScreenLayout';
import LoginForm from '@/components/auth/LoginForm';
import SignupForm from '@/components/auth/SignupForm';
import OTPVerification from '@/components/auth/OTPVerification';
import ForgotPassword from '@/components/auth/ForgotPassword';
import ResetPassword from '@/components/auth/ResetPassword';
import { useAuth } from '@/context/AuthContext';

type AuthMode = 'login' | 'signup' | 'otp' | 'forgot' | 'reset';

interface OTPData {
  email: string;
  tempData: any;
}

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [otpData, setOtpData] = useState<OTPData | null>(null);
  const [resetEmail, setResetEmail] = useState<string>('');
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignupSuccess = (data: { email: string; tempData: any }) => {
    setOtpData(data);
    setMode('otp');
  };

  const handleOTPBack = () => {
    setMode('signup');
    setOtpData(null);
  };

  const renderAuthForm = () => {
    switch (mode) {
      case 'login':
        return (
          <LoginForm
            onSwitchToSignup={() => setMode('signup')}
            onForgotPassword={() => setMode('forgot')}
          />
        );
      case 'signup':
        return (
          <SignupForm
            onSuccess={handleSignupSuccess}
            onSwitchToLogin={() => setMode('login')}
          />
        );
      case 'otp':
        return otpData ? (
          <OTPVerification
            email={otpData.email}
            tempData={otpData.tempData}
            onBack={handleOTPBack}
          />
        ) : null;
      case 'forgot':
        return (
          <ForgotPassword
            onCancel={() => setMode('login')}
            onSent={(email: string) => {
              setResetEmail(email);
              setMode('reset');
            }}
          />
        );
      case 'reset':
        return (
          <ResetPassword
            defaultEmail={resetEmail}
            onCancel={() => setMode('login')}
            onSuccess={() => setMode('login')}
          />
        );
      default:
        return (
          <LoginForm
            onSwitchToSignup={() => setMode('signup')}
            onForgotPassword={() => setMode('forgot')}
          />
        );
    }
  };

  return (
    <SplitScreenLayout>
      {renderAuthForm()}
    </SplitScreenLayout>
  );
};

export default AuthPage;
