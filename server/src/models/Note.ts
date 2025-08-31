import mongoose, { Document, Schema } from 'mongoose';

export interface INote extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  tags: string[];
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }],
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Create indexes
noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ userId: 1, title: 'text', content: 'text' });
noteSchema.index({ tags: 1 });

export default mongoose.model<INote>('Note', noteSchema);
