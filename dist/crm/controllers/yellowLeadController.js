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
const axiosInstance_1 = __importDefault(require("../../api/axiosInstance"));
const endPoints_1 = require("../../api/endPoints");
const safeAxios_1 = require("../../api/safeAxios");
const dropDownMetadataController_1 = require("../../utilityModules/dropdown/dropDownMetadataController");
exports.updateYellowLead = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
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
    const isCampusVisitChangedToNo = updateData.footFall === false && existingLead.footFall !== false;
    // If the campus visit is changed to yes, then the final conversion is set to unconfirmed
    if (isCampusVisitChangedToYes) {
        updateData.finalConversion = constants_1.FinalConversionType.UNCONFIRMED;
    }
    // If the campus visit is changed to no, then the final conversion can not be changed.
    if (isCampusVisitChangedToNo) {
        updateData.finalConversion = constants_1.FinalConversionType.NO_FOOTFALL;
    }
    // If the campus visit is no, then the final conversion can not be changed.
    if (((_a = updateData.footFall) !== null && _a !== void 0 ? _a : existingLead.footFall) === false) {
        if (updateData.finalConversion !== constants_1.FinalConversionType.NO_FOOTFALL) {
            throw (0, http_errors_1.default)(400, 'Final conversion can not be changed if campus visit is no.');
        }
    }
    else if (updateData.finalConversion === constants_1.FinalConversionType.NO_FOOTFALL) {
        // if footfall is yes, then final conversion can not be no footfall.
        throw (0, http_errors_1.default)(400, 'Final conversion can not be no footfall if campus visit is yes.');
    }
    const updatedYellowLead = yield lead_1.LeadMaster.findByIdAndUpdate(updateData._id, updateData, {
        new: true,
        runValidators: true
    });
    (0, dropDownMetadataController_1.updateOnlyOneValueInDropDown)(constants_1.DropDownType.FIX_CITY, updatedYellowLead === null || updatedYellowLead === void 0 ? void 0 : updatedYellowLead.city);
    (0, dropDownMetadataController_1.updateOnlyOneValueInDropDown)(constants_1.DropDownType.CITY, updatedYellowLead === null || updatedYellowLead === void 0 ? void 0 : updatedYellowLead.city);
    (0, dropDownMetadataController_1.updateOnlyOneValueInDropDown)(constants_1.DropDownType.FIX_COURSE, updatedYellowLead === null || updatedYellowLead === void 0 ? void 0 : updatedYellowLead.course);
    (0, dropDownMetadataController_1.updateOnlyOneValueInDropDown)(constants_1.DropDownType.COURSE, updatedYellowLead === null || updatedYellowLead === void 0 ? void 0 : updatedYellowLead.course);
    if (!updatedYellowLead) {
        throw (0, http_errors_1.default)(404, 'Yellow lead not found.');
    }
    (0, safeAxios_1.safeAxiosPost)(axiosInstance_1.default, `${endPoints_1.Endpoints.AuditLogService.MARKETING.SAVE_LEAD}`, {
        documentId: updatedYellowLead === null || updatedYellowLead === void 0 ? void 0 : updatedYellowLead._id,
        action: constants_1.RequestAction.POST,
        payload: updatedYellowLead,
        performedBy: (_b = req.data) === null || _b === void 0 ? void 0 : _b.id,
        restEndpoint: '/api/update-yellow-lead',
    });
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
                    $sum: { $cond: [{ $eq: ['$footFall', false] }, 1, 0] }
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
