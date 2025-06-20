import mongoose from 'mongoose';
import { COLLECTION_NAMES } from '../config/constants';

const ErrorLogSchema = new mongoose.Schema({
    message: { type: String, required: true },
    statusCode: { type: Number, required: true },
    date: { type: String, required: true },
}, { timestamps: true });

export const ErrorLog = mongoose.model(COLLECTION_NAMES.ERROR_LOG, ErrorLogSchema,COLLECTION_NAMES.ERROR_LOG);
