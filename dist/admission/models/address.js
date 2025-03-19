"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addressSchema = void 0;
const mongoose_1 = require("mongoose");
exports.addressSchema = new mongoose_1.Schema({
    permanentAddress: { type: String },
    district: { type: String },
    pincode: {
        type: String,
        validate: {
            validator: (value) => /^[1-9][0-9]{5}$/.test(value),
            message: 'Pincode must be a 6-digit number starting with a non-zero digit'
        }
    },
    state: { type: String },
    country: { type: String }
});
