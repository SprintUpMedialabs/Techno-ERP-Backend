"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeesDraftModel = void 0;
const mongoose_1 = require("mongoose");
const constants_1 = require("../../config/constants");
//Other fees schema
const OtherFeesSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: Object.values(constants_1.FeeType),
        required: true
    },
    feeAmount: {
        type: Number,
        required: true
    },
    finalFee: {
        type: Number,
        required: true
    },
    feesDepositedTOA: {
        type: Number,
        default: 0
    },
    remarks: {
        type: String
    }
});
//Sem wise schema
const SingleSemWiseFeesSchema = new mongoose_1.Schema({
    feeAmount: {
        type: Number,
        required: true
    },
    finalFee: {
        type: Number,
        required: true
    }
}, { _id: false });
//Fees draft for entire student
const StudentFeesSchema = new mongoose_1.Schema({
    otherFees: {
        type: [OtherFeesSchema],
        validate: [
            (value) => value.length <= 50,
            'Cannot have more than 50 fee entries'
        ]
    },
    semWiseFees: {
        type: [SingleSemWiseFeesSchema],
    },
    feeStatus: {
        type: String,
        enum: Object.values(constants_1.FeeStatus),
        default: constants_1.FeeStatus.DRAFT,
        optional: true
    }
}, { timestamps: true });
exports.FeesDraftModel = (0, mongoose_1.model)('studentFee', StudentFeesSchema);
