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
exports.getYellowLeadsAnalytics = exports.getFilteredYellowLeads = exports.updateYellowLead = exports.createYellowLead = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const constants_1 = require("../../config/constants");
const logger_1 = __importDefault(require("../../config/logger"));
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const parseFilter_1 = require("../helpers/parseFilter");
const yellowLead_1 = require("../models/yellowLead");
const yellowLead_2 = require("../validators/yellowLead");
const formatResponse_1 = require("../../utils/formatResponse");
const createYellowLead = (leadData) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const yellowLead = {
        date: leadData.date,
        name: leadData.name,
        phoneNumber: leadData.phoneNumber,
        email: (_a = leadData.email) !== null && _a !== void 0 ? _a : '',
        gender: leadData.gender,
        campusVisit: false,
        assignedTo: leadData.assignedTo,
        source: (_b = leadData.source) !== null && _b !== void 0 ? _b : constants_1.Marketing_Source.SCHOOL
    };
    if (leadData.nextDueDate && (0, convertDateToFormatedDate_1.convertToMongoDate)(leadData.nextDueDate) > new Date()) {
        yellowLead.nextDueDate = (0, convertDateToFormatedDate_1.convertToMongoDate)(leadData.nextDueDate);
    }
    const validation = yellowLead_2.yellowLeadSchema.safeParse(yellowLead);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    console.log(yellowLead);
    yield yellowLead_1.YellowLead.create(yellowLead);
    logger_1.default.info('Yellow lead object created successfully');
});
exports.createYellowLead = createYellowLead;
exports.updateYellowLead = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const updateData = req.body;
    // console.log(updateData);
    const validation = yellowLead_2.yellowLeadUpdateSchema.safeParse(updateData);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const updatedYellowLead = yield yellowLead_1.YellowLead.findByIdAndUpdate(updateData._id, updateData, {
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
    let leadsQuery = yellowLead_1.YellowLead.find(query);
    // console.log(leadsQuery);
    if (Object.keys(sort).length > 0) {
        leadsQuery = leadsQuery.sort(sort);
    }
    const [yellowLeads, totalLeads] = yield Promise.all([
        yellowLead_1.YellowLead.find(query).sort(sort).skip(skip).limit(limit),
        yellowLead_1.YellowLead.countDocuments(query),
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
    const analytics = yield yellowLead_1.YellowLead.aggregate([
        { $match: query },
        {
            $group: {
                _id: null,
                allLeadsCount: { $sum: 1 },
                campusVisitTrueCount: {
                    $sum: { $cond: [{ $eq: ['$campusVisit', true] }, 1, 0] }
                },
                activeYellowLeadsCount: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $ne: ['$finalConversion', constants_1.FinalConversionType.RED] },
                                    { $ne: ['$finalConversion', constants_1.FinalConversionType.GREEN] }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                },
                deadLeadCount: {
                    $sum: { $cond: [{ $eq: ['$finalConversion', constants_1.FinalConversionType.RED] }, 1, 0] }
                }
            }
        },
        {
            $project: {
                _id: 0,
                allLeadsCount: 1,
                campusVisitTrueCount: 1,
                activeYellowLeadsCount: 1,
                deadLeadCount: 1
            }
        }
    ]);
    const result = analytics.length > 0
        ? analytics[0]
        : {
            allLeadsCount: 0,
            campusVisitTrueCount: 0,
            activeYellowLeadsCount: 0,
            deadLeadCount: 0
        };
    return (0, formatResponse_1.formatResponse)(res, 200, 'Yellow leads analytics fetched successfully', true, result);
}));
