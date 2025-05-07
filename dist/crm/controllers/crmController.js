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
exports.logFollowUpChange = exports.updateData = exports.getAllLeadAnalytics = exports.getFilteredLeadData = exports.uploadData = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const axiosInstance_1 = __importDefault(require("../../api/axiosInstance"));
const endPoints_1 = require("../../api/endPoints");
const safeAxios_1 = require("../../api/safeAxios");
const constants_1 = require("../../config/constants");
const formatResponse_1 = require("../../utils/formatResponse");
const googleSheetOperations_1 = require("../helpers/googleSheetOperations");
const parseFilter_1 = require("../helpers/parseFilter");
const updateAndSaveToDb_1 = require("../helpers/updateAndSaveToDb");
const lead_1 = require("../models/lead");
const leads_1 = require("../validators/leads");
const dropDownMetadataController_1 = require("../../utilityModules/dropdown/dropDownMetadataController");
const user_1 = require("../../auth/models/user");
const formators_1 = require("../validators/formators");
const marketingFollowUp_1 = require("../models/marketingFollowUp");
const getCurrentLoggedInUser_1 = require("../../auth/utils/getCurrentLoggedInUser");
exports.uploadData = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = yield user_1.User.findById((_a = req.data) === null || _a === void 0 ? void 0 : _a.id);
    const marketingSheet = user === null || user === void 0 ? void 0 : user.marketingSheet;
    if (marketingSheet && marketingSheet.length > 0) {
        for (const sheet of marketingSheet) {
            const latestData = yield (0, googleSheetOperations_1.readFromGoogleSheet)(sheet.id, sheet.name);
            console.log('we are here');
            if (latestData) {
                yield (0, updateAndSaveToDb_1.saveDataToDb)(latestData.rowData, latestData.lastSavedIndex, sheet.id, sheet.name, latestData.requiredColumnHeaders);
            }
        }
        return (0, formatResponse_1.formatResponse)(res, 200, 'Data updated in Database!', true);
    }
    else {
        return (0, formatResponse_1.formatResponse)(res, 400, 'No data found in the sheet!', false);
    }
}));
exports.getFilteredLeadData = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { query, search, page, limit, sort } = (0, parseFilter_1.parseFilter)(req);
    if (search === null || search === void 0 ? void 0 : search.trim()) {
        query.$and = [
            ...((_a = query.$and) !== null && _a !== void 0 ? _a : []),
            {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { phoneNumber: { $regex: search, $options: 'i' } }
                ]
            }
        ];
    }
    const skip = (page - 1) * limit;
    let leadsQuery = lead_1.LeadMaster.find(query);
    if (Object.keys(sort).length > 0) {
        leadsQuery = leadsQuery.sort(sort);
    }
    const [leads, totalLeads] = yield Promise.all([
        leadsQuery.skip(skip).limit(limit),
        lead_1.LeadMaster.countDocuments(query),
    ]);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Filtered leads fetched successfully', true, {
        leads,
        total: totalLeads,
        totalPages: Math.ceil(totalLeads / limit),
        currentPage: page
    });
}));
exports.getAllLeadAnalytics = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const { query } = (0, parseFilter_1.parseFilter)(req);
    // 🔹 Running Aggregate Pipeline
    const analytics = yield lead_1.LeadMaster.aggregate([
        { $match: query }, // Apply Filters
        {
            $group: {
                _id: null,
                totalLeads: { $sum: 1 }, // Count total leads
                openLeads: { $sum: { $cond: [{ $eq: ['$leadType', constants_1.LeadType.OPEN] }, 1, 0] } }, // Count OPEN leads
                didNotPickLeads: { $sum: { $cond: [{ $eq: ['$leadType', constants_1.LeadType.DID_NOT_PICK] }, 1, 0] } }, // Count OPEN leads
                interestedLeads: { $sum: { $cond: [{ $eq: ['$leadType', constants_1.LeadType.INTERESTED] }, 1, 0] } }, // Count INTERESTED leads
                notInterestedLeads: { $sum: { $cond: [{ $eq: ['$leadType', constants_1.LeadType.DEAD] }, 1, 0] } }, // Count NOT_INTERESTED leads,
                neutralLeads: { $sum: { $cond: [{ $eq: ['$leadType', constants_1.LeadType.NO_CLARITY] }, 1, 0] } }
            }
        }
    ]);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Lead analytics fetched successfully', true, {
        totalLeads: (_b = (_a = analytics[0]) === null || _a === void 0 ? void 0 : _a.totalLeads) !== null && _b !== void 0 ? _b : 0,
        openLeads: (_d = (_c = analytics[0]) === null || _c === void 0 ? void 0 : _c.openLeads) !== null && _d !== void 0 ? _d : 0,
        didNotPickLeads: (_f = (_e = analytics[0]) === null || _e === void 0 ? void 0 : _e.didNotPickLeads) !== null && _f !== void 0 ? _f : 0,
        interestedLeads: (_h = (_g = analytics[0]) === null || _g === void 0 ? void 0 : _g.interestedLeads) !== null && _h !== void 0 ? _h : 0,
        notInterestedLeads: (_k = (_j = analytics[0]) === null || _j === void 0 ? void 0 : _j.notInterestedLeads) !== null && _k !== void 0 ? _k : 0,
        neutralLeads: (_m = (_l = analytics[0]) === null || _l === void 0 ? void 0 : _l.neutralLeads) !== null && _m !== void 0 ? _m : 0
    });
}));
exports.updateData = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const leadRequestData = req.body;
    const validation = leads_1.updateLeadRequestSchema.safeParse(leadRequestData);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    console.log("Validation error : ", validation.error);
    const existingLead = yield lead_1.LeadMaster.findById(leadRequestData._id);
    if (existingLead) {
        // if (existingLead.leadType === LeadType.INTERESTED) {
        //   throw createHttpError(
        //     400,
        //     'Sorry, this lead can only be updated from the yellow leads tracker!'
        //   );
        // }
        let leadTypeModifiedDate = existingLead.leadTypeModifiedDate;
        let existingRemark = (0, formators_1.normaliseText)(existingLead.remarks);
        let leadRequestDataRemark = (0, formators_1.normaliseText)(leadRequestData.remarks);
        let existingFollowUpCount = existingLead.leadsFollowUpCount;
        let leadRequestDataFollowUpCount = leadRequestData.leadsFollowUpCount;
        const isRemarkChanged = existingRemark !== leadRequestDataRemark;
        const isFollowUpCountChanged = existingFollowUpCount !== leadRequestDataFollowUpCount;
        if (isRemarkChanged && !isFollowUpCountChanged) {
            leadRequestData.leadsFollowUpCount = existingLead.leadsFollowUpCount + 1;
        }
        if (leadRequestData.leadType && existingLead.leadType != leadRequestData.leadType) {
            leadTypeModifiedDate = new Date();
        }
        const updatedData = yield lead_1.LeadMaster.findByIdAndUpdate(existingLead._id, Object.assign(Object.assign({}, leadRequestData), { leadTypeModifiedDate }), {
            new: true,
            runValidators: true
        });
        const currentLoggedInUser = (0, getCurrentLoggedInUser_1.getCurrentLoggedInUser)(req);
        const updatedFollowUpCount = (updatedData === null || updatedData === void 0 ? void 0 : updatedData.leadsFollowUpCount) || 0;
        if (updatedFollowUpCount > existingFollowUpCount) {
            (0, exports.logFollowUpChange)(existingLead._id, currentLoggedInUser, constants_1.Actions.INCREAMENT);
        }
        else if (updatedFollowUpCount < existingFollowUpCount) {
            (0, exports.logFollowUpChange)(existingLead._id, currentLoggedInUser, constants_1.Actions.DECREAMENT);
        }
        (0, dropDownMetadataController_1.updateOnlyOneValueInDropDown)(constants_1.DropDownType.FIX_MARKETING_CITY, updatedData === null || updatedData === void 0 ? void 0 : updatedData.city);
        (0, dropDownMetadataController_1.updateOnlyOneValueInDropDown)(constants_1.DropDownType.MARKETING_CITY, updatedData === null || updatedData === void 0 ? void 0 : updatedData.city);
        (0, dropDownMetadataController_1.updateOnlyOneValueInDropDown)(constants_1.DropDownType.FIX_MARKETING_COURSE_CODE, updatedData === null || updatedData === void 0 ? void 0 : updatedData.course);
        (0, dropDownMetadataController_1.updateOnlyOneValueInDropDown)(constants_1.DropDownType.MARKETING_COURSE_CODE, updatedData === null || updatedData === void 0 ? void 0 : updatedData.course);
        (0, safeAxios_1.safeAxiosPost)(axiosInstance_1.default, `${endPoints_1.Endpoints.AuditLogService.MARKETING.SAVE_LEAD}`, {
            documentId: updatedData === null || updatedData === void 0 ? void 0 : updatedData._id,
            action: constants_1.RequestAction.POST,
            payload: updatedData,
            performedBy: (_a = req.data) === null || _a === void 0 ? void 0 : _a.id,
            restEndpoint: '/api/edit/crm',
        });
        return (0, formatResponse_1.formatResponse)(res, 200, 'Data Updated Successfully!', true, updatedData);
    }
    else {
        throw (0, http_errors_1.default)(404, 'Lead does not found with the given ID.');
    }
}));
const logFollowUpChange = (leadId, userId, action) => {
    marketingFollowUp_1.MarketingFollowUpModel.create({
        currentLoggedInUser: userId,
        leadId,
        action
    })
        .then(() => console.log(`Follow-up ${action.toLowerCase()} logged for lead ${leadId} by ${userId}.`))
        .catch(err => console.error(`Error for lead ${leadId} by ${userId}. Error logging follow-up ${action.toLowerCase()}:`, err));
};
exports.logFollowUpChange = logFollowUpChange;
