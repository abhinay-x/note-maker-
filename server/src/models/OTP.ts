import mongoose, { Document, Schema } from 'mongoose';

export interface IOTP extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  otp: string;
  purpose: 'signup' | 'login' | 'password_reset';
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

const otpSchema = new Schema<IOTP>({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  otp: {
    type: String,
    required: true,
    length: 6
  },
  purpose: {
    type: String,
    enum: ['signup', 'login', 'password_reset'],
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  },
  isUsed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Create indexes
otpSchema.index({ email: 1, otp: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export default mongoose.model<IOTP>('OTP', otpSchema);
