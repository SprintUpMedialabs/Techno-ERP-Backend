import mongoose, { Document, Schema } from 'mongoose';
import moment from 'moment-timezone';
import createHttpError from 'http-errors';
import { convertToDDMMYYYY } from '../../utils/convertDateToFormatedDate';

export enum AttemptStatus {
  STARTED = 'STARTED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export interface IAttemptLog {
  type: string;
  status: AttemptStatus;
  attemptNo: number;
  date: Date;
  time: Date;
}

export interface IAttemptLogDocument extends IAttemptLog, Document {}

const attemptLogSchema = new Schema<IAttemptLogDocument>(
  {
    type: {
      type: String,
      required: [true, 'Type is required'],
    },
    status: {
      type: String,
      enum: {
        values: Object.values(AttemptStatus),
        message: 'Invalid status value',
      },
      required: [true, 'Status is required'],
    },
    attemptNo: {
      type: Number,
      required: [true, 'Attempt number is required'],
      min: [1, 'Attempt number must be at least 1'],
    },
    date: {
      type: Date,
      default: () => {
        // Set date to only date part (midnight) in Asia/Kolkata
        const now = moment().tz('Asia/Kolkata').startOf('day');
        return now.toDate();
      },
    },
    time: {
      type: Date,
      default: () => {
        // Full datetime with current time in Asia/Kolkata
        return moment().tz('Asia/Kolkata').toDate();
      },
    },
  },
  { timestamps: true }
);

// Error handler
attemptLogSchema.post('save', function (error: any, doc: any, next: Function) {
  if (error.name === 'ValidationError') {
    const firstError = error.errors[Object.keys(error.errors)[0]];
    throw createHttpError(400, firstError.message);
  } else {
    next(error);
  }
});

// Output formatting
const transformDateTime = (_: any, ret: any) => {
  if (ret.date) {
    ret.date = convertToDDMMYYYY(ret.date); // e.g., "18/05/2025"
  }
  if (ret.time) {
    ret.time = moment(ret.time).tz('Asia/Kolkata').format('HH:mm:ss'); // e.g., "14:45:30"
  }
  delete ret.__v;
  delete ret.createdAt;
  delete ret.updatedAt;
  return ret;
};

attemptLogSchema.set('toJSON', { transform: transformDateTime });
attemptLogSchema.set('toObject', { transform: transformDateTime });

export const AttemptLog = mongoose.model<IAttemptLogDocument>('AttemptLog', attemptLogSchema);