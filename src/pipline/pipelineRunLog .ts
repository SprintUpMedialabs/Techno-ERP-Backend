import moment from 'moment-timezone';
import mongoose, { Document, Schema } from 'mongoose';
import { PipelineStatus } from '../config/constants';

export interface IPipelineRunLog {
    pipelineName: string;
    status: PipelineStatus;
    attemptNo: number;
    date: Date;
    time: Date;
    durationInSeconds?: number;
    errorMessages?: string[];
    startedAt?: Date;
}

export interface IPipelineRunLogDocument extends IPipelineRunLog, Document { }

const pipelineRunLogSchema = new Schema<IPipelineRunLogDocument>(
    {
        pipelineName: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(PipelineStatus),
            required: true,
        },
        attemptNo: {
            type: Number,
            required: true,
            min: 1,
        },
        date: {
            type: Date,
            default: () => moment().tz('Asia/Kolkata').startOf('day').toDate(),
        },
        time: {
            type: Date,
            default: () => moment().tz('Asia/Kolkata').toDate(),
        },
        durationInSeconds: {
            type: Number,
        },
        errorMessages: {
            type: [String],
            default: [],
        },
        startedAt: {
            type: Date,
            default: () => moment().tz('Asia/Kolkata').toDate(),
        },
    },
    { timestamps: true }
);

// Format date and time when converting to JSON
pipelineRunLogSchema.set('toJSON', {
    transform: (_, ret) => {
        delete ret.__v;
        return ret;
    }
});

export const PipelineRunLog = mongoose.model<IPipelineRunLogDocument>('PipelineRunLog', pipelineRunLogSchema);