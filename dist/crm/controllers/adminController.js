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
const leads_1 = require("../models/leads");
const yellowLead_1 = require("../models/yellowLead");
const formatResponse_1 = require("../../utils/formatResponse");
exports.adminAnalytics = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { startDate, endDate, location = [], assignedTo = [], source = [], } = req.body;
    const query = {};
    if (location.length > 0) {
        query.location = { $in: location };
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
    if (assignedTo.length > 0) {
        query.assignedTo = { $in: assignedTo };
    }
    // TODO: will discuss this in future and apply it here
    // if (filters.source.length > 0) {
    //     query.source = { $in: filters.source }
    // }
    const [allLeadAnalytics, yellowLeadAnalytics] = yield Promise.all([
        leads_1.Lead.aggregate([
            { $match: query }, // Apply Filters
            {
                $group: {
                    _id: null,
                    allLeads: { $sum: 1 }, // Count total leads
                    reached: { $sum: { $cond: [{ $ne: ['$leadType', constants_1.LeadType.ORANGE] }, 1, 0] } }, // Count leads where leadType is NOT 'OPEN'
                    notReached: { $sum: { $cond: [{ $eq: ['$leadType', constants_1.LeadType.ORANGE] }, 1, 0] } }, // Count leads where leadType is 'OPEN'
                    white: { $sum: { $cond: [{ $eq: ['$leadType', constants_1.LeadType.WHITE] }, 1, 0] } }, // Count leads where leadType is 'DID_NOT_PICK'
                    black: { $sum: { $cond: [{ $eq: ['$leadType', constants_1.LeadType.BLACK] }, 1, 0] } }, // Count leads where leadType is 'COURSE_UNAVAILABLE'
                    red: { $sum: { $cond: [{ $eq: ['$leadType', constants_1.LeadType.RED] }, 1, 0] } }, // Count leads where leadType is 'NOT_INTERESTED'
                    blue: { $sum: { $cond: [{ $eq: ['$leadType', constants_1.LeadType.BLUE] }, 1, 0] } }, // Count leads where leadType is 'NO_CLARITY'
                    yellow: { $sum: { $cond: [{ $eq: ['$leadType', constants_1.LeadType.YELLOW] }, 1, 0] } }, // Count leads where leadType is 'INTERESTED'
                }
            }
        ]), yellowLead_1.YellowLead.aggregate([
            { $match: query }, // in query we have issue
            {
                $group: {
                    _id: null,
                    // New Fields for Second Collection
                    campusVisit: { $sum: { $cond: [{ $eq: ['$campusVisit', true] }, 1, 0] } }, // Count where campusVisit is true
                    noCampusVisit: { $sum: { $cond: [{ $eq: ['$campusVisit', false] }, 1, 0] } }, // Count where campusVisit is false
                    unconfirmed: { $sum: { $cond: [{ $eq: ['$finalConversion', constants_1.FinalConversionType.PINK] }, 1, 0] } }, // Count where finalConversion is 'PENDING'
                    declined: { $sum: { $cond: [{ $eq: ['$finalConversion', constants_1.FinalConversionType.RED] }, 1, 0] } }, // Count where finalConversion is 'NOT_CONVERTED'
                    finalConversion: { $sum: { $cond: [{ $eq: ['$finalConversion', constants_1.FinalConversionType.GREEN] }, 1, 0] } }, // Count where finalConversion is 'CONVERTED'
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
            yellow: 0
        },
        yellowLeadsAnalytics: yellowLeadAnalytics.length > 0 ? yellowLeadAnalytics[0] : {
            campusVisit: 0,
            noCampusVisit: 0,
            unconfirmed: 0,
            declined: 0,
            finalConversion: 0
        }
    });
}));
