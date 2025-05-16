import createHttpError from "http-errors";
import mongoose, { Document, Schema } from "mongoose";
import { COLLECTION_NAMES, FeeActions, TransactionTypes } from "../../config/constants";
import { TechnoMetaData } from "../../config/models/TechnoMetaData";
import { ICollegeTransactionSchema } from "../validators/collegeTransactionSchema";

export interface ICollegeTransactionDocument extends ICollegeTransactionSchema, Document { }

export const CollegeTransactionModel = new Schema<ICollegeTransactionDocument>({
    studentId: {
        type: String,
        required: true,
    },
    dateTime: {
        type: Date,
        default : new Date()
    },
    feeAction: {
        type: String,
        enum: Object.values(FeeActions),
        required: true,
    },
    transactionID: {
        type: Number,
        // required: true,
        unique: true,
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
    actionedBy : {
        type : Schema.Types.ObjectId,
        ref : COLLECTION_NAMES.USER
    },
    courseName: {
        type: String,
    },
    courseCode: {
        type: String,
    },
    courseYear : {
        type : String
    }
}, { timestamps: true });


CollegeTransactionModel.pre<ICollegeTransactionDocument>("save", async function (next) {
    if (!this.isNew) {
        return next();
    }

    try {
        const counter = await TechnoMetaData.findOneAndUpdate(
            { name: "transactionID" },
            { $inc: { value: 1 } },
            { upsert: true, new: true }
        );

        this.transactionID = counter.value;
        next();
    }
    catch (err: any) {
        next(err);
    }
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