"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const storage = multer_1.default.memoryStorage();
// DTODO: need to clean multer storge after saving to AWS => Resolved in updateEnquiryDocuments function
const upload = (0, multer_1.default)({ storage });
exports.default = upload;
