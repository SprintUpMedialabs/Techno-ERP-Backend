"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DropDownMetaData = void 0;
const mongoose_1 = require("mongoose");
const constants_1 = require("../../config/constants");
const dropDownMetaDataSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: {
            values: Object.values(constants_1.DropDownType),
            message: 'Invalid config name'
        },
        required: [true, 'Name is required'],
        unique: true //
    },
    value: {
        type: [String],
        default: ['other'],
        validate: {
            validator: (arr) => arr.every(v => typeof v === 'string'),
            message: 'All values must be strings'
        }
    }
}, { timestamps: true });
const removeExtraFields = (_, ret) => {
    delete ret.__v;
    delete ret.createdAt;
    delete ret.updatedAt;
    return ret;
};
dropDownMetaDataSchema.set('toJSON', {
    transform: removeExtraFields
});
dropDownMetaDataSchema.set('toObject', {
    transform: removeExtraFields
});
exports.DropDownMetaData = (0, mongoose_1.model)(constants_1.COLLECTION_NAMES.DROP_DOWN_META_DATA, dropDownMetaDataSchema);
