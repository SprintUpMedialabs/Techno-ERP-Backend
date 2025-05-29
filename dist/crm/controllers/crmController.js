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
exports.exportData = exports.logFollowUpChange = exports.updateData = exports.getAllLeadAnalytics = exports.getFilteredLeadData = exports.getAssignedSheets = exports.uploadData = void 0;
const exceljs_1 = __importDefault(require("exceljs"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const moment_timezone_1 = __importDefault(require("moment-timezone"));
const axiosInstance_1 = __importDefault(require("../../api/axiosInstance"));
const endPoints_1 = require("../../api/endPoints");
const safeAxios_1 = require("../../api/safeAxios");
const user_1 = require("../../auth/models/user");
const getCurrentLoggedInUser_1 = require("../../auth/utils/getCurrentLoggedInUser");
const constants_1 = require("../../config/constants");
const dropDownMetadataController_1 = require("../../utilityModules/dropdown/dropDownMetadataController");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const formatResponse_1 = require("../../utils/formatResponse");
const getISTDate_1 = require("../../utils/getISTDate");
const googleSheetOperations_1 = require("../helpers/googleSheetOperations");
const parseFilter_1 = require("../helpers/parseFilter");
const updateAndSaveToDb_1 = require("../helpers/updateAndSaveToDb");
const lead_1 = require("../models/lead");
const marketingFollowUp_1 = require("../models/marketingFollowUp");
const marketingUserWiseAnalytics_1 = require("../models/marketingUserWiseAnalytics");
const leads_1 = require("../validators/leads");
const logger_1 = __importDefault(require("../../config/logger"));
exports.uploadData = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, name } = req.body;
    if (id && name) {
        const latestData = yield (0, googleSheetOperations_1.readFromGoogleSheet)(id, name);
        if (latestData) {
            yield (0, updateAndSaveToDb_1.saveDataToDb)(latestData.rowData, latestData.lastSavedIndex, id, name, latestData.requiredColumnHeaders);
        }
    }
    return (0, formatResponse_1.formatResponse)(res, 200, 'Data updated in Database!', true);
}));
exports.getAssignedSheets = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const user = yield user_1.User.findById((_a = req.data) === null || _a === void 0 ? void 0 : _a.id);
    const marketingSheet = user === null || user === void 0 ? void 0 : user.marketingSheet;
    logger_1.default.info(marketingSheet);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Assigned sheets fetched successfully', true, marketingSheet);
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
                leftOverLeads: { $sum: { $cond: [{ $eq: ['$leadType', constants_1.LeadType.LEFT_OVER] }, 1, 0] } }, // Count OPEN leads
                didNotPickLeads: { $sum: { $cond: [{ $eq: ['$leadType', constants_1.LeadType.DID_NOT_PICK] }, 1, 0] } }, // Count OPEN leads
                activeLeads: { $sum: { $cond: [{ $eq: ['$leadType', constants_1.LeadType.ACTIVE] }, 1, 0] } }, // Count INTERESTED leads
                notInterestedLeads: { $sum: { $cond: [{ $eq: ['$leadType', constants_1.LeadType.NOT_INTERESTED] }, 1, 0] } }, // Count NOT_INTERESTED leads,
                neutralLeads: { $sum: { $cond: [{ $eq: ['$leadType', constants_1.LeadType.NEUTRAL] }, 1, 0] } }
            }
        }
    ]);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Lead analytics fetched successfully', true, {
        totalLeads: (_b = (_a = analytics[0]) === null || _a === void 0 ? void 0 : _a.totalLeads) !== null && _b !== void 0 ? _b : 0,
        leftOverLeads: (_d = (_c = analytics[0]) === null || _c === void 0 ? void 0 : _c.leftOverLeads) !== null && _d !== void 0 ? _d : 0,
        didNotPickLeads: (_f = (_e = analytics[0]) === null || _e === void 0 ? void 0 : _e.didNotPickLeads) !== null && _f !== void 0 ? _f : 0,
        activeLeads: (_h = (_g = analytics[0]) === null || _g === void 0 ? void 0 : _g.activeLeads) !== null && _h !== void 0 ? _h : 0,
        notInterestedLeads: (_k = (_j = analytics[0]) === null || _j === void 0 ? void 0 : _j.notInterestedLeads) !== null && _k !== void 0 ? _k : 0,
        neutralLeads: (_m = (_l = analytics[0]) === null || _l === void 0 ? void 0 : _l.neutralLeads) !== null && _m !== void 0 ? _m : 0
    });
}));
exports.updateData = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const leadRequestData = req.body;
    const validation = leads_1.updateLeadRequestSchema.safeParse(leadRequestData);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const existingLead = yield lead_1.LeadMaster.findById(leadRequestData._id);
    if (!existingLead) {
        throw (0, http_errors_1.default)(404, 'Lead does not found with the given ID.');
    }
    let leadTypeModifiedDate = existingLead.leadTypeModifiedDate;
    const existingRemarkLength = ((_a = existingLead.remarks) === null || _a === void 0 ? void 0 : _a.length) || 0;
    const newRemarkLength = ((_b = leadRequestData.remarks) === null || _b === void 0 ? void 0 : _b.length) || 0;
    const existingFollowUpCount = existingLead.followUpCount || 0;
    const newFollowUpCount = leadRequestData.followUpCount || 0;
    const isRemarkChanged = existingRemarkLength !== newRemarkLength;
    const isFollowUpCountChanged = existingFollowUpCount !== newFollowUpCount;
    if (isRemarkChanged && !isFollowUpCountChanged) {
        leadRequestData.followUpCount = existingLead.followUpCount + 1;
    }
    if (leadRequestData.leadType && existingLead.leadType !== leadRequestData.leadType) {
        leadTypeModifiedDate = new Date();
    }
    const currentLoggedInUser = (0, getCurrentLoggedInUser_1.getCurrentLoggedInUser)(req);
    if (isRemarkChanged) {
        const isActive = existingLead.isActiveLead;
        const wasCalled = existingLead.isCalledToday;
        const todayStart = (0, getISTDate_1.getISTDate)();
        const userAnalyticsDoc = yield marketingUserWiseAnalytics_1.MarketingUserWiseAnalytics.findOne({
            date: { $gte: todayStart },
            data: { $elemMatch: { userId: currentLoggedInUser } },
        });
        if (!userAnalyticsDoc)
            throw (0, http_errors_1.default)(404, 'User analytics not found.');
        const userIndex = userAnalyticsDoc.data.findIndex((entry) => entry.userId.toString() === currentLoggedInUser.toString());
        if (userIndex === -1)
            throw (0, http_errors_1.default)(404, 'User not found in analytics data.');
        let shouldMarkCalled = false;
        const isFirstFollowUp = existingFollowUpCount === 0 && newFollowUpCount > 0;
        if (isFirstFollowUp) {
            userAnalyticsDoc.data[userIndex].newLeadCalls += 1;
            if (!wasCalled) {
                userAnalyticsDoc.data[userIndex].totalCalls += 1;
                shouldMarkCalled = true;
            }
        }
        else if (!wasCalled) {
            userAnalyticsDoc.data[userIndex].totalCalls += 1;
            shouldMarkCalled = true;
            if (isActive) {
                userAnalyticsDoc.data[userIndex].activeLeadCalls += 1;
            }
            else {
                userAnalyticsDoc.data[userIndex].nonActiveLeadCalls += 1;
            }
        }
        if (shouldMarkCalled) {
            leadRequestData.isCalledToday = true;
        }
        yield userAnalyticsDoc.save();
    }
    const updatedData = yield lead_1.LeadMaster.findByIdAndUpdate(existingLead._id, Object.assign(Object.assign({}, leadRequestData), { leadTypeModifiedDate }), { new: true, runValidators: true });
    const updatedFollowUpCount = (_c = updatedData === null || updatedData === void 0 ? void 0 : updatedData.followUpCount) !== null && _c !== void 0 ? _c : 0;
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
        performedBy: (_d = req.data) === null || _d === void 0 ? void 0 : _d.id,
        restEndpoint: '/api/edit/crm',
    });
    return (0, formatResponse_1.formatResponse)(res, 200, 'Data Updated Successfully!', true, updatedData);
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
exports.exportData = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    const roles = ((_a = req.data) === null || _a === void 0 ? void 0 : _a.roles) || [];
    const user = yield user_1.User.findById((_b = req.data) === null || _b === void 0 ? void 0 : _b.id);
    const isAdminOrLead = roles.includes(constants_1.UserRoles.ADMIN) || roles.includes(constants_1.UserRoles.LEAD_MARKETING);
    const marketingSheet = user === null || user === void 0 ? void 0 : user.marketingSheet;
    const workbook = new exceljs_1.default.Workbook();
    const worksheet = workbook.addWorksheet((_d = (_c = marketingSheet === null || marketingSheet === void 0 ? void 0 : marketingSheet[0]) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : 'Leads');
    // Define headers
    const baseColumns = [
        { header: 'Date', key: 'date' },
        { header: 'Name', key: 'name' },
        { header: 'Phone Number', key: 'phoneNumber' },
        { header: 'Alt Phone Number', key: 'altPhoneNumber' },
        { header: 'Email', key: 'email' },
        { header: 'Course', key: 'course' },
        { header: 'Lead Type', key: 'leadType' },
        { header: 'Remarks', key: 'remarks' },
        { header: 'Area', key: 'area' },
        { header: 'City', key: 'city' },
        { header: 'Final Conversion', key: 'finalConversion' },
        { header: 'Gender', key: 'gender' },
        { header: 'School Name', key: 'schoolName' },
        { header: 'Lead Type Modified Date', key: 'leadTypeModifiedDate' },
        { header: 'Next Due Date', key: 'nextDueDate' },
        { header: 'Foot Fall', key: 'footFall' },
        { header: 'Follow Up Count', key: 'followUpCount' },
    ];
    if (isAdminOrLead) {
        baseColumns.push({ header: 'Assigned To', key: 'assignedTo' });
    }
    worksheet.columns = baseColumns;
    const leads = yield lead_1.LeadMaster.find({
        assignedTo: { $in: [(_e = req.data) === null || _e === void 0 ? void 0 : _e.id] }
    }).populate({
        path: 'assignedTo',
        select: 'firstName lastName'
    });
    leads.forEach(lead => {
        const rowData = {
            date: lead.date ? (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(lead.date) : '',
            name: lead.name || '',
            phoneNumber: lead.phoneNumber || '',
            altPhoneNumber: lead.altPhoneNumber || '',
            email: lead.email || '',
            course: lead.course || '',
            leadType: lead.leadType || '',
            remarks: Array.isArray(lead.remarks) ? lead.remarks.join('\n') : '',
            area: lead.area || '',
            city: lead.city || '',
            finalConversion: lead.finalConversion || '',
            gender: lead.gender || '',
            schoolName: lead.schoolName || '',
            leadTypeModifiedDate: lead.leadTypeModifiedDate ? (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(lead.leadTypeModifiedDate) : '',
            nextDueDate: lead.nextDueDate ? (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(lead.nextDueDate) : '',
            footFall: lead.footFall ? 'Yes' : 'No',
            followUpCount: lead.followUpCount || 0,
        };
        if (isAdminOrLead) {
            rowData.assignedTo = Array.isArray(lead.assignedTo)
                ? lead.assignedTo.map((user) => { var _a, _b; return `${(_a = user.firstName) !== null && _a !== void 0 ? _a : ''} ${(_b = user.lastName) !== null && _b !== void 0 ? _b : ''}`.trim(); }).join(', ')
                : '';
        }
        worksheet.addRow(rowData);
    });
    worksheet.columns.forEach(column => {
        var _a;
        let maxLength = 10;
        (_a = column.eachCell) === null || _a === void 0 ? void 0 : _a.call(column, { includeEmpty: true }, cell => {
            var _a;
            const cellValue = (_a = cell.text) !== null && _a !== void 0 ? _a : '';
            maxLength = Math.max(maxLength, cellValue.length);
        });
        column.width = maxLength + 2;
    });
    const formattedDate = (0, moment_timezone_1.default)().tz('Asia/Kolkata').format('DD-MM-YY');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${(_f = user === null || user === void 0 ? void 0 : user.firstName) !== null && _f !== void 0 ? _f : ''} ${(_g = user === null || user === void 0 ? void 0 : user.lastName) !== null && _g !== void 0 ? _g : ''} - ${formattedDate}.xlsx"`);
    // ✅ Write the Excel file to response
    yield workbook.xlsx.write(res);
    res.end(); // ✅ Must end the response
}));
