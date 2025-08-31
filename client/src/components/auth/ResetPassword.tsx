import React, { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Mail, KeyRound, Lock, Eye, EyeOff } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import api from '@/services/api';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

type FormData = z.infer<typeof schema>;

interface ResetPasswordProps {
  defaultEmail?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ defaultEmail = '', onCancel, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: defaultEmail },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const res = await api.resetPassword({ email: data.email, otp: data.otp, newPassword: data.newPassword });
      if (res.success) {
        onSuccess();
      } else {
        setError('otp', { type: 'manual', message: res.message || 'Invalid OTP' });
      }
    } catch (e: any) {
      setError('otp', { type: 'manual', message: e?.message || 'Failed to reset password' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Reset password</h1>
      <p className="text-gray-600 mb-6 text-center">Enter the OTP and your new password.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Email"
          type="email"
          icon={<Mail className="w-5 h-5 text-gray-400" />}
          {...register('email')}
          error={errors.email?.message}
          placeholder="Enter your email address"
        />

        <Input
          label="OTP"
          type="text"
          icon={<KeyRound className="w-5 h-5 text-gray-400" />}
          {...register('otp')}
          error={errors.otp?.message}
          placeholder="Enter 6-digit OTP"
        />

        <div className="relative">
          <Input
            label="New password"
            type={showPassword ? 'text' : 'password'}
            icon={<Lock className="w-5 h-5 text-gray-400" />}
            {...register('newPassword')}
            error={errors.newPassword?.message}
            placeholder="Enter new password"
          />
          <button
            type="button"
            className="absolute right-3 top-9 text-gray-400 hover:text-gray-600"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" className="w-1/3" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" isLoading={isLoading}>
            Reset Password
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
