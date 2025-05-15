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
exports.adminAnalytics = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const constants_1 = require("../../config/constants");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const formatResponse_1 = require("../../utils/formatResponse");
const mongoose_1 = __importDefault(require("mongoose"));
const lead_1 = require("../models/lead");
exports.adminAnalytics = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { startDate, endDate, city = [], assignedTo = [], source = [], gender = [] } = req.body;
    const query = {};
    if (city.length > 0) {
        query.city = { $in: city };
    }
    if (startDate || endDate) {
        query.date = {};
        if (startDate) {
            query.date.$gte = (0, convertDateToFormatedDate_1.convertToMongoDate)(startDate);
        }
        if (endDate) {
            query.date.$lte = (0, convertDateToFormatedDate_1.convertToMongoDate)(endDate);
        }
    }
    assignedTo = assignedTo.map(id => new mongoose_1.default.Types.ObjectId(id));
    assignedTo = assignedTo.map(id => new mongoose_1.default.Types.ObjectId(id));
    if (assignedTo.length > 0) {
        query.assignedTo = { $in: assignedTo };
    }
    // TODO: will discuss this in future and apply it here
    if (source.length > 0) {
        query.source = { $in: source };
    }
    if (gender.length > 0) {
        query.gender = { $in: gender };
    }
    const [allLeadAnalytics, yellowLeadAnalytics] = yield Promise.all([
        lead_1.LeadMaster.aggregate([
            { $match: query }, // Apply Filters
            {
                $group: {
                    _id: null,
                    allLeads: { $sum: 1 }, // Count total leads
                    reached: { $sum: { $cond: [{ $ne: ['$leadType', constants_1.LeadType.LEFT_OVER] }, 1, 0] } }, // Count leads where leadType is NOT 'OPEN'
                    notReached: { $sum: { $cond: [{ $eq: ['$leadType', constants_1.LeadType.LEFT_OVER] }, 1, 0] } }, // Count leads where leadType is 'OPEN'
                    white: { $sum: { $cond: [{ $eq: ['$leadType', constants_1.LeadType.DID_NOT_PICK] }, 1, 0] } }, // Count leads where leadType is 'DID_NOT_PICK'
                    black: { $sum: { $cond: [{ $eq: ['$leadType', constants_1.LeadType.COURSE_UNAVAILABLE] }, 1, 0] } }, // Count leads where leadType is 'COURSE_UNAVAILABLE'
                    red: { $sum: { $cond: [{ $eq: ['$leadType', constants_1.LeadType.NOT_INTERESTED] }, 1, 0] } }, // Count leads where leadType is 'NOT_INTERESTED'
                    blue: { $sum: { $cond: [{ $eq: ['$leadType', constants_1.LeadType.NEUTRAL] }, 1, 0] } }, // Count leads where leadType is 'NO_CLARITY'
                    activeLeads: { $sum: { $cond: [{ $eq: ['$leadType', constants_1.LeadType.ACTIVE] }, 1, 0] } }, // Count leads where leadType is 'INTERESTED'
                    invalidType: { $sum: { $cond: [{ $eq: ['$leadType', constants_1.LeadType.INVALID] }, 1, 0] } }
                }
            }
        ]), lead_1.LeadMaster.aggregate([
            { $match: Object.assign(Object.assign({}, query), { leadType: constants_1.LeadType.ACTIVE }) }, // in query we have issue
            {
                $group: {
                    _id: null,
                    // New Fields for Second Collection
                    footFall: { $sum: { $cond: [{ $eq: ['$footFall', true] }, 1, 0] } }, // Count where campusVisit is true
                    noFootFall: { $sum: { $cond: [{ $eq: ['$footFall', false] }, 1, 0] } }, // Count where campusVisit is false
                    neutral: { $sum: { $cond: [{ $eq: ['$finalConversion', constants_1.FinalConversionType.NEUTRAL] }, 1, 0] } }, // Count where finalConversion is 'PENDING'
                    dead: { $sum: { $cond: [{ $eq: ['$finalConversion', constants_1.FinalConversionType.NOT_INTERESTED] }, 1, 0] } }, // Count where finalConversion is 'NOT_CONVERTED'
                    admissions: { $sum: { $cond: [{ $eq: ['$finalConversion', constants_1.FinalConversionType.CONVERTED] }, 1, 0] } }, // Count where finalConversion is 'CONVERTED'
                }
            }
        ])
    ]);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Analytics fetched successfully', true, {
        allLeadsAnalytics: allLeadAnalytics.length > 0 ? allLeadAnalytics[0] : {
            allLeads: 0,
            reached: 0,
            notReached: 0,
            white: 0,
            black: 0,
            red: 0,
            blue: 0,
            activeLeads: 0
        },
        yellowLeadsAnalytics: yellowLeadAnalytics.length > 0 ? yellowLeadAnalytics[0] : {
            footFall: 0,
            noFootFall: 0,
            unconfirmed: 0,
            declined: 0,
            finalConversion: 0
        }
    });
}));
