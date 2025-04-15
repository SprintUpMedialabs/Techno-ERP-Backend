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
exports.checkIfStudentAdmitted = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const enquiry_1 = require("../models/enquiry");
const checkIfStudentAdmitted = (enquiryId) => __awaiter(void 0, void 0, void 0, function* () {
    const student = yield enquiry_1.Enquiry.findById(enquiryId);
    if ((student === null || student === void 0 ? void 0 : student.universityId) != null) {
        throw (0, http_errors_1.default)(400, 'Student is already admitted');
    }
    return false;
});
exports.checkIfStudentAdmitted = checkIfStudentAdmitted;
