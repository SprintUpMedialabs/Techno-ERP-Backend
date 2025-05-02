import mongoose, { Schema } from "mongoose";
import { COLLECTION_NAMES, FeeActions } from "../../config/constants";
import { ICollegeTransactionSchema } from "../validators/collegeTransactionSchema";
import { Document } from "mongoose";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";
import createHttpError from "http-errors";

export interface ICollegeTransactionDocument extends ICollegeTransactionSchema, Document { }

export const CollegeTransactionModel = new Schema<ICollegeTransactionDocument>({
    studentId: {
        type: String,
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
    transactionID: {
        type: Number,
        required: true,
        unique: true,
    },
    amount: {
        type: String,
        required: true,
    },
    txnType: {
        type: String,
        required: true,
    },
    remark: {
        type: String,
    },
}, { timestamps: true });

CollegeTransactionModel.pre<ICollegeTransactionDocument>("save", async function (next) {
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

CollegeTransactionModel.post('save', function (error: any, doc: any, next: Function) {
    handleMongooseError(error, next);
});

CollegeTransactionModel.post('findOneAndUpdate', function (error: any, doc: any, next: Function) {
    handleMongooseError(error, next);
});

const removeExtraInfo = (_: any, ret: any) => {
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
};

CollegeTransactionModel.set('toJSON', { transform: removeExtraInfo });
CollegeTransactionModel.set('toObject', { transform: removeExtraInfo });

export const CollegeTransaction = mongoose.model<ICollegeTransactionDocument>(COLLECTION_NAMES.TRANSACTION_HISTORY, CollegeTransactionModel);