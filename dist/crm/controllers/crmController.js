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
exports.updateData = exports.getAllLeadAnalytics = exports.getFilteredLeadData = exports.uploadData = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const constants_1 = require("../../config/constants");
const googleSheetOperations_1 = require("../helpers/googleSheetOperations");
const parseFilter_1 = require("../helpers/parseFilter");
const updateAndSaveToDb_1 = require("../helpers/updateAndSaveToDb");
const leads_1 = require("../models/leads");
const leads_2 = require("../validators/leads");
const yellowLeadController_1 = require("./yellowLeadController");
const formatResponse_1 = require("../../utils/formatResponse");
exports.uploadData = (0, express_async_handler_1.default)((_, res) => __awaiter(void 0, void 0, void 0, function* () {
    const latestData = yield (0, googleSheetOperations_1.readFromGoogleSheet)();
    if (!latestData) {
        return (0, formatResponse_1.formatResponse)(res, 200, 'There is no data to update.', true);
    }
    else {
        yield (0, updateAndSaveToDb_1.saveDataToDb)(latestData.RowData, latestData.LastSavedIndex);
        return (0, formatResponse_1.formatResponse)(res, 200, 'Data updated in Database!', true);
    }
}));
exports.getFilteredLeadData = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { query, search, page, limit, sort } = (0, parseFilter_1.parseFilter)(req);
    console.log(query);
    if (search.trim()) {
        query.$and = [
            ...(query.$and || []),
            {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { phoneNumber: { $regex: search, $options: 'i' } }
                ]
            }
        ];
    }
    const skip = (page - 1) * limit;
    let leadsQuery = leads_1.Lead.find(query);
    if (Object.keys(sort).length > 0) {
        leadsQuery = leadsQuery.sort(sort);
    }
    const [leads, totalLeads] = yield Promise.all([
        leadsQuery.skip(skip).limit(limit),
        leads_1.Lead.countDocuments(query),
    ]);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Filtered leads fetched successfully', true, {
        leads,
        total: totalLeads,
        totalPages: Math.ceil(totalLeads / limit),
        currentPage: page
    });
}));
exports.getAllLeadAnalytics = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const { query } = (0, parseFilter_1.parseFilter)(req);
    console.log(query);
    // 🔹 Running Aggregate Pipeline
    const analytics = yield leads_1.Lead.aggregate([
        { $match: query }, // Apply Filters
        {
            $group: {
                _id: null,
                totalLeads: { $sum: 1 }, // Count total leads
                openLeads: { $sum: { $cond: [{ $eq: ['$leadType', constants_1.LeadType.ORANGE] }, 1, 0] } }, // Count OPEN leads
                interestedLeads: { $sum: { $cond: [{ $eq: ['$leadType', constants_1.LeadType.YELLOW] }, 1, 0] } }, // Count INTERESTED leads
                notInterestedLeads: { $sum: { $cond: [{ $eq: ['$leadType', constants_1.LeadType.RED] }, 1, 0] } } // Count NOT_INTERESTED leads
            }
        }
    ]);
    console.log(analytics);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Lead analytics fetched successfully', true, {
        totalLeads: (_b = (_a = analytics[0]) === null || _a === void 0 ? void 0 : _a.totalLeads) !== null && _b !== void 0 ? _b : 0,
        openLeads: (_d = (_c = analytics[0]) === null || _c === void 0 ? void 0 : _c.openLeads) !== null && _d !== void 0 ? _d : 0,
        interestedLeads: (_f = (_e = analytics[0]) === null || _e === void 0 ? void 0 : _e.interestedLeads) !== null && _f !== void 0 ? _f : 0,
        notInterestedLeads: (_h = (_g = analytics[0]) === null || _g === void 0 ? void 0 : _g.notInterestedLeads) !== null && _h !== void 0 ? _h : 0
    });
}));
exports.updateData = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const leadRequestData = req.body;
    const validation = leads_2.updateLeadRequestSchema.safeParse(leadRequestData);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const existingLead = yield leads_1.Lead.findById(leadRequestData._id);
    if (existingLead) {
        if (existingLead.leadType === constants_1.LeadType.YELLOW) {
            throw (0, http_errors_1.default)(400, 'Sorry, this lead can only be updated from the yellow leads tracker!');
        }
        let leadTypeModifiedDate = existingLead.leadTypeModifiedDate;
        const updatedData = yield leads_1.Lead.findByIdAndUpdate(existingLead._id, Object.assign(Object.assign({}, leadRequestData), { leadTypeModifiedDate }), {
            new: true,
            runValidators: true
        });
        if (leadRequestData.leadType && existingLead.leadType != leadRequestData.leadType) {
            if (leadRequestData.leadType === constants_1.LeadType.YELLOW) {
                (0, yellowLeadController_1.createYellowLead)(updatedData);
            }
            leadTypeModifiedDate = new Date();
        }
        return (0, formatResponse_1.formatResponse)(res, 200, 'Data Updated Successfully!', true, updatedData);
    }
    else {
        throw (0, http_errors_1.default)(404, 'Lead does not found with the given ID.');
    }
}));
