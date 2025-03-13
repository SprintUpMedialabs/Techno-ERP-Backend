import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from '../validators/user';
import { UserRoles } from '../../config/constants';
import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';

interface IUserDocument extends IUser, Document { }

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: [true, 'Email should be unique'],
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters long']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters long']
    },
    //Note: even though, the system is adding the password still validation is required.
    password: {
      type: String,
      validate: {
        validator: function (value: string) {
          // Only validate if the password is provided
          return !value || value.length >= 6;
        },
        message: 'Password must be at least 6 characters long'
      }
    },
    roles: {
      type: [String],
      enum: {
        values: Object.values(UserRoles),
        message: 'Invalid role name'
      },
      default: [UserRoles.BASIC_USER]
    }
  },
  { timestamps: true }
);

const handleMongooseError = (error: any, next: Function) => {
  console.log(error);
  if (error.name === 'ValidationError') {
    const firstError = error.errors[Object.keys(error.errors)[0]];
    throw createHttpError(400, firstError.message);
  } else if (error.name == 'MongooseError') {
    throw createHttpError(400, `${error.message}`);
  } else {
    next(error); // Pass any other errors to the next middleware
  }
};

// 🔐 Pre-save middleware to hash password before saving a new user or when password is modified
userSchema.pre<IUserDocument>('save', async function (next: Function) {
  if (!this.isModified('password')) return next(); // Only hash if password is modified

  try {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password!, saltRounds);
    next();
  } catch (error) {
    next(error);
  }
});

// 🔐 Pre-update middleware to hash password before updating it
userSchema.pre('findOneAndUpdate', async function (next: Function) {
  const update = this.getUpdate() as { password?: string };

  if (update?.password) {
    try {
      const saltRounds = 10;
      update.password = await bcrypt.hash(update.password, saltRounds);
      this.setUpdate(update);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

userSchema.post('save', function (error: any, doc: any, next: Function) {
  handleMongooseError(error, next);
});
userSchema.post('findOneAndUpdate', function (error: any, doc: any, next: Function) {
  handleMongooseError(error, next);
});

const transformDates = (_: any, ret: any) => {
  delete ret.password; 
  return ret;
};

userSchema.set('toJSON', { transform: transformDates });
userSchema.set('toObject', { transform: transformDates });

export const User = mongoose.model<IUserDocument>('User', userSchema);
