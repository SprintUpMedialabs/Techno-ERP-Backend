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
exports.getYellowLeadsAnalytics = exports.getFilteredYellowLeads = exports.updateYellowLead = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const constants_1 = require("../../config/constants");
const parseFilter_1 = require("../helpers/parseFilter");
const formatResponse_1 = require("../../utils/formatResponse");
const lead_1 = require("../models/lead");
const leads_1 = require("../validators/leads");
exports.updateYellowLead = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const updateData = req.body;
    const validation = leads_1.yellowLeadUpdateSchema.safeParse(updateData);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const existingLead = yield lead_1.LeadMaster.findById(updateData._id);
    if (!existingLead) {
        throw (0, http_errors_1.default)(404, 'Yellow lead not found.');
    }
    const isCampusVisitChangedToYes = updateData.footFall === true && existingLead.footFall !== true;
    const wasFinalConversionNoFootfall = existingLead.finalConversion === constants_1.FinalConversionType.NO_FOOTFALL;
    if (isCampusVisitChangedToYes && wasFinalConversionNoFootfall) {
        updateData.finalConversion = constants_1.FinalConversionType.UNCONFIRMED;
    }
    const updatedYellowLead = yield lead_1.LeadMaster.findByIdAndUpdate(updateData._id, updateData, {
        new: true,
        runValidators: true
    });
    if (!updatedYellowLead) {
        throw (0, http_errors_1.default)(404, 'Yellow lead not found.');
    }
    return (0, formatResponse_1.formatResponse)(res, 200, 'Yellow lead updated successfully', true, updatedYellowLead);
}));
exports.getFilteredYellowLeads = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { query, search, page, limit, sort } = (0, parseFilter_1.parseFilter)(req);
    query.leadType = constants_1.LeadType.INTERESTED;
    if (search.trim()) {
        query.$and = [
            ...(query.$and || []), // Preserve existing AND conditions if any
            {
                $or: [
                    { name: { $regex: search, $options: 'i' } }, // Case-insensitive search
                    { phoneNumber: { $regex: search, $options: 'i' } }
                ]
            }
        ];
    }
    const skip = (page - 1) * limit;
    const [yellowLeads, totalLeads] = yield Promise.all([
        lead_1.LeadMaster.find(query).sort(sort).skip(skip).limit(limit),
        lead_1.LeadMaster.countDocuments(query),
    ]);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Filtered yellow leads fetched successfully', true, {
        yellowLeads,
        total: totalLeads,
        totalPages: Math.ceil(totalLeads / limit),
        currentPage: page
    });
}));
exports.getYellowLeadsAnalytics = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { query } = (0, parseFilter_1.parseFilter)(req);
    query.leadType = constants_1.LeadType.INTERESTED;
    const analytics = yield lead_1.LeadMaster.aggregate([
        { $match: query },
        {
            $group: {
                _id: null,
                allLeadsCount: { $sum: 1 },
                campusVisitTrueCount: {
                    $sum: { $cond: [{ $eq: ['$footFall', true] }, 1, 0] }
                },
                activeYellowLeadsCount: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $ne: ['$finalConversion', constants_1.FinalConversionType.DEAD] },
                                    { $ne: ['$finalConversion', constants_1.FinalConversionType.CONVERTED] }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                },
                deadLeadCount: {
                    $sum: { $cond: [{ $eq: ['$finalConversion', constants_1.FinalConversionType.DEAD] }, 1, 0] }
                },
                admissions: {
                    $sum: { $cond: [{ $eq: ['$finalConversion', constants_1.FinalConversionType.CONVERTED] }, 1, 0] }
                },
                unconfirmed: {
                    $sum: { $cond: [{ $eq: ['$finalConversion', constants_1.FinalConversionType.UNCONFIRMED] }, 1, 0] }
                }
            }
        },
        {
            $project: {
                _id: 0,
                allLeadsCount: 1,
                campusVisitTrueCount: 1,
                activeYellowLeadsCount: 1,
                deadLeadCount: 1,
                admissions: 1,
                unconfirmed: 1
            }
        }
    ]);
    const result = analytics.length > 0
        ? analytics[0]
        : {
            allLeadsCount: 0,
            campusVisitTrueCount: 0,
            activeYellowLeadsCount: 0,
            deadLeadCount: 0,
            admissions: 0,
            unconfirmed: 0
        };
    return (0, formatResponse_1.formatResponse)(res, 200, 'Yellow leads analytics fetched successfully', true, result);
}));
