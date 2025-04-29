import mongoose, { Schema } from "mongoose";
import { COLLECTION_NAMES, FeeActions, TransactionTypes } from "../../config/constants";
import { Document } from "mongoose";
import { IBaseTransactionSchema, IStudentTransactionSchema } from "../validators/studentTransactionSchema";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";
import createHttpError from "http-errors";

export interface IBaseTransactionDocument extends IBaseTransactionSchema, Document { }
export interface IStudentTransactionDocument extends IStudentTransactionSchema, Document { }

const BaseTransactionModel = new Schema<IBaseTransactionDocument>({
    transactionID: {
        type: Number,
        required: true,
    },
    dateTime: {
        type: Date,
        set: (value: Date | undefined) => value ? convertToMongoDate(value) : undefined
    },
    feeAction: {
        type: String,
        enum: Object.values(FeeActions),
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    txnType: {
        type: String,
        enum: Object.values(TransactionTypes),
        required: true,
    },
    remark: {
        type: String,
    },
});

export const StudentTransactionModel = new Schema<IStudentTransactionDocument>({
    studentId: {
        type: String,
        required: true,
    },
    transactions: {
        type: [BaseTransactionModel],
        required: true,
        default: [],
    },
}, { timestamps: true });



StudentTransactionModel.pre<IStudentTransactionDocument>('save', async function (next) {
    next();
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

StudentTransactionModel.post('save', function (error: any, doc: any, next: Function) {
    handleMongooseError(error, next);
});

StudentTransactionModel.post('findOneAndUpdate', function (error: any, doc: any, next: Function) {
    handleMongooseError(error, next);
});

const removeExtraInfo = (_: any, ret: any) => {
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
};

StudentTransactionModel.set('toJSON', { transform: removeExtraInfo });
StudentTransactionModel.set('toObject', { transform: removeExtraInfo });

export const StudentTransaction = mongoose.model<IStudentTransactionDocument>(COLLECTION_NAMES.STUDENT_TRANSACTION_HISTORY, StudentTransactionModel);