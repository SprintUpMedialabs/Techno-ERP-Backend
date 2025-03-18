import mongoose, { Schema, Document } from 'mongoose';
import { ITransactionHistorySchema } from '../validators/transactionHistory';
import { convertToDDMMYYYY, convertToMongoDate } from '../../utils/convertDateToFormatedDate';
import createHttpError from 'http-errors';

export interface ITransactionHistoryDocument extends ITransactionHistorySchema, Document { }

const transactionHistorySchema = new Schema<ITransactionHistoryDocument>({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Student ID is required'],
    },
    otp: {
        type: Number,
        required: [true, 'OTP is required'],
        validate: {
            validator: (value: number) => /^\d{6}$/.test(value.toString()),
            message: 'OTP must be a 6-digit number'
        }

    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
        set: (value: string) => {
            console.log(value);
            let convertedDate = convertToMongoDate(value);
            console.log(convertedDate);
            if (!convertedDate) throw new Error('Invalid date format, expected DD/MM/YYYY');
            return convertedDate;
        }
    },
    amountPaid: {
        type: Number,
        required: [true, 'Amount paid is required'],
        min: [0, 'Amount must be non-negative'],
    },
    remarks: {
        type: String,
        maxlength: [500, 'Remarks must not exceed 500 characters'],
        optional: true
    },
}, {
    timestamps: true,
});


const handleMongooseError = (error: any, next: Function) => {
    if (error.name === 'ValidationError') {
        const firstError = error.errors[Object.keys(error.errors)[0]];
        throw createHttpError(400, firstError.message);
    } else if (error.name == 'MongooseError') {
        throw createHttpError(400, `${error.message}`);
    } else {
        next(error); 
    }
};

transactionHistorySchema.post('save', function (error: any, doc: any, next: Function) {
    handleMongooseError(error, next);
});

transactionHistorySchema.post('findOneAndUpdate', function (error: any, doc: any, next: Function) {
    handleMongooseError(error, next);
});

const transformDates = (_: any, ret: any) => {
    ['date'].forEach((key) => {
        if (ret[key]) {
            ret[key] = convertToDDMMYYYY(ret[key]);
        }
    });
    return ret;
};

transactionHistorySchema.set('toJSON', { transform: transformDates });
transactionHistorySchema.set('toObject', { transform: transformDates });


export const TransactionHistory = mongoose.model<ITransactionHistoryDocument>('TransactionHistory', transactionHistorySchema);

