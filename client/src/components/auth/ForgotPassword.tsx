import React, { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Mail } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import api from '@/services/api';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type FormData = z.infer<typeof schema>;

interface ForgotPasswordProps {
  onCancel: () => void;
  onSent: (email: string) => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onCancel, onSent }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const res = await api.forgotPassword({ email: data.email });
      if (res.success) {
        onSent(data.email);
      } else {
        // Even on unknown email we return success to prevent enumeration, proceed to next step
        onSent(data.email);
      }
    } catch (e) {
      // Proceed anyway to keep UX consistent
      onSent(data.email);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Forgot password</h1>
      <p className="text-gray-600 mb-6 text-center">Enter your email to receive an OTP.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          label="Email"
          type="email"
          icon={<Mail className="w-5 h-5 text-gray-400" />}
          {...register('email')}
          error={errors.email?.message}
          placeholder="Enter your email address"
        />

        <div className="flex gap-3">
          <Button type="button" variant="secondary" className="w-1/3" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" isLoading={isLoading}>
            Send OTP
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;
