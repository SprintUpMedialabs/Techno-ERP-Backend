import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from '../validators/user';

interface IUserDocument extends IUser, Document {}

const userSchema = new Schema<IUserDocument>(
  {
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    password: { type: String },
    roles: [{ type: String }]
  },
  { timestamps: true }
);

export const User = mongoose.model<IUserDocument>('User', userSchema);
