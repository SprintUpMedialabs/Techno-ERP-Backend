const OtherFeesSchema = new Schema({
    type: {
        type: String,
        enum: Object.values(TypeOfFee),
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