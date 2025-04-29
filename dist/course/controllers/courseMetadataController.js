"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdmissoinDocumentListByCourseCode = exports.getCourseMetadataBy = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const formatResponse_1 = require("../../utils/formatResponse");
const courseMetadata_1 = require("../models/courseMetadata");
exports.getCourseMetadataBy = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { courseCode } = req.params;
    const courseMetadata = yield courseMetadata_1.CourseMetaData.findOne({ courseCode });
    if (!courseMetadata) {
        return (0, formatResponse_1.formatResponse)(res, 404, 'Course metadata not found', false);
    }
    return (0, formatResponse_1.formatResponse)(res, 200, 'Course metadata fetched successfully', true, courseMetadata);
}));
exports.getAdmissoinDocumentListByCourseCode = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { courseCode } = req.params;
    const courseMetadata = yield courseMetadata_1.CourseMetaData.findOne({ courseCode });
    if (!courseMetadata) {
        return (0, formatResponse_1.formatResponse)(res, 404, 'Course metadata not found', false);
    }
    return (0, formatResponse_1.formatResponse)(res, 200, 'Course metadata fetched successfully', true, { documentTypeList: courseMetadata.documentType });
}));
