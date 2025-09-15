import mongoose, { Document, Schema } from 'mongoose';

export interface IDareInstruction extends Document {
  admin_id: mongoose.Types.ObjectId;
  instruction_text: string;
  level: number;
  is_active: boolean;
  created_at: Date;
}

const DareInstructionSchema: Schema = new Schema({
  admin_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  instruction_text: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  is_active: {
    type: Boolean,
    default: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

// Create indexes
DareInstructionSchema.index({ admin_id: 1 });
DareInstructionSchema.index({ is_active: 1, level: 1 });
DareInstructionSchema.index({ level: 1 });
DareInstructionSchema.index({ created_at: -1 });

export default mongoose.model<IDareInstruction>('DareInstruction', DareInstructionSchema);