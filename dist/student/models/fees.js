"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeModel = void 0;
const mongoose_1 = require("mongoose");
const constants_1 = require("../../config/constants");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const FeeUpdateHistoryModel = new mongoose_1.Schema({
    updatedAt: {
        type: Date
    },
    extraAmount: {
        type: Number
    },
    updatedFee: {
        type: Number
    },
    updatedBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: constants_1.COLLECTION_NAMES.USER
    }
});
const BaseFeeModel = new mongoose_1.Schema({
    type: {
        type: String,
        enum: Object.values(constants_1.FinanceFeeType),
        required: true
    },
    schedule: {
        type: String,
        enum: Object.values(constants_1.FinanceFeeSchedule),
        required: true
    },
    actualFee: {
        type: Number,
        required: true
    },
    finalFee: {
        type: Number,
        required: true
    },
    paidAmount: {
        type: Number,
        required: true
    },
    remark: {
        type: String,
    },
    feeUpdateHistory: [FeeUpdateHistoryModel]
});
exports.FeeModel = new mongoose_1.Schema({
    details: {
        type: [BaseFeeModel],
        required: true,
        default: []
    },
    dueDate: {
        type: Date,
        set: (value) => value ? (0, convertDateToFormatedDate_1.convertToMongoDate)(value) : undefined
    },
    paidAmount: {
        type: Number,
        required: true
    },
    totalFinalFee: {
        type: Number,
        required: true
    }
});
