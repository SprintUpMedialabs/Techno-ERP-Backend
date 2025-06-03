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
exports.getYellowLeadsAnalyticsV1 = exports.getYellowLeadsAnalytics = exports.getFilteredYellowLeads = exports.updateYellowLead = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const axiosInstance_1 = __importDefault(require("../../api/axiosInstance"));
const endPoints_1 = require("../../api/endPoints");
const safeAxios_1 = require("../../api/safeAxios");
const constants_1 = require("../../config/constants");
const dropDownMetadataController_1 = require("../../utilityModules/dropdown/dropDownMetadataController");
const formatResponse_1 = require("../../utils/formatResponse");
const getISTDate_1 = require("../../utils/getISTDate");
const parseFilter_1 = require("../helpers/parseFilter");
const lead_1 = require("../models/lead");
const marketingUserWiseAnalytics_1 = require("../models/marketingUserWiseAnalytics");
const leads_1 = require("../validators/leads");
const mongoose_1 = __importDefault(require("mongoose"));
exports.updateYellowLead = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
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
    const isFinalConversionChangedToAdmission = updateData.finalConversion === constants_1.FinalConversionType.ADMISSION &&
        existingLead.finalConversion !== constants_1.FinalConversionType.ADMISSION;
    const isFinalConversionChangedFromAdmission = updateData.finalConversion !== constants_1.FinalConversionType.ADMISSION &&
        existingLead.finalConversion === constants_1.FinalConversionType.ADMISSION;
    // If the campus visit is changed to yes, then the final conversion is set to unconfirmed
    if (isCampusVisitChangedToYes) {
        updateData.finalConversion = constants_1.FinalConversionType.NEUTRAL;
    }
    // If the campus visit is changed to no, then the final conversion can not be changed.
    if (isCampusVisitChangedToNo) {
        updateData.finalConversion = constants_1.FinalConversionType.NO_FOOTFALL;
    }
    // If the campus visit is no, then the final conversion can not be changed.
    if (((_a = updateData.footFall) !== null && _a !== void 0 ? _a : existingLead.footFall) === false) {
        const allowedConversions = [constants_1.FinalConversionType.NOT_INTERESTED, constants_1.FinalConversionType.NO_FOOTFALL, constants_1.FinalConversionType.NEUTRAL];
        if (updateData.finalConversion && !allowedConversions.includes(updateData.finalConversion)) {
            throw (0, http_errors_1.default)(400, 'If campus visit is no, then final conversion can not be ' + updateData.finalConversion + '.');
        }
    }
    else if (updateData.finalConversion === constants_1.FinalConversionType.NO_FOOTFALL) {
        // if footfall is yes, then final conversion can not be no footfall.
        throw (0, http_errors_1.default)(400, 'Final conversion can not be no footfall if campus visit is yes.');
    }
    let existingRemarkLength = ((_b = existingLead === null || existingLead === void 0 ? void 0 : existingLead.remarks) === null || _b === void 0 ? void 0 : _b.length) || 0;
    let yellowLeadRequestDataRemarkLength = ((_c = updateData.remarks) === null || _c === void 0 ? void 0 : _c.length) || 0;
    const isRemarkChanged = existingRemarkLength < yellowLeadRequestDataRemarkLength;
    if (isRemarkChanged) {
        updateData.followUpCount = existingLead.followUpCount + 1;
    }
    const currentLoggedInUser = (_d = req.data) === null || _d === void 0 ? void 0 : _d.id;
    const todayStart = (0, getISTDate_1.getISTDate)();
    const userAnalyticsDoc = yield marketingUserWiseAnalytics_1.MarketingUserWiseAnalytics.findOne({
        date: todayStart,
        data: { $elemMatch: { userId: currentLoggedInUser } },
    });
    if (!userAnalyticsDoc)
        throw (0, http_errors_1.default)(404, 'User analytics not found.');
    const userIndex = userAnalyticsDoc.data.findIndex((entry) => entry.userId.toString() === (currentLoggedInUser === null || currentLoggedInUser === void 0 ? void 0 : currentLoggedInUser.toString()));
    if (userIndex === -1) {
        throw (0, http_errors_1.default)(404, 'User not found in analytics data.');
    }
    if (isRemarkChanged && !(existingLead === null || existingLead === void 0 ? void 0 : existingLead.isCalledToday)) {
        userAnalyticsDoc.data[userIndex].totalCalls += 1;
        if (existingLead === null || existingLead === void 0 ? void 0 : existingLead.isActiveLead) {
            userAnalyticsDoc.data[userIndex].activeLeadCalls += 1;
        }
        else {
            userAnalyticsDoc.data[userIndex].nonActiveLeadCalls += 1;
        }
        updateData.isCalledToday = true;
    }
    if (isFinalConversionChangedToAdmission) {
        userAnalyticsDoc.data[userIndex].totalAdmissions += 1;
    }
    if (isFinalConversionChangedFromAdmission) {
        userAnalyticsDoc.data[userIndex].totalAdmissions -= 1;
    }
    if (isCampusVisitChangedToYes) {
        userAnalyticsDoc.data[userIndex].totalFootFall += 1;
    }
    if (isCampusVisitChangedToNo) {
        userAnalyticsDoc.data[userIndex].totalFootFall -= 1;
    }
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        yield userAnalyticsDoc.save({ session });
        const updatedYellowLead = yield lead_1.LeadMaster.findByIdAndUpdate(updateData._id, updateData, {
            new: true,
            runValidators: true,
            session
        });
        // const updatedFollowUpCount = updatedYellowLead?.followUpCount ?? 0;
        // if (updatedFollowUpCount > existingFollowUpCount) {
        //   logFollowUpChange(existingLead._id, currentLoggedInUser, Actions.INCREAMENT)
        // }
        // else if (updatedFollowUpCount < existingFollowUpCount) {
        //   logFollowUpChange(existingLead._id, currentLoggedInUser, Actions.DECREAMENT)
        // }
        (0, dropDownMetadataController_1.updateOnlyOneValueInDropDown)(constants_1.DropDownType.FIX_MARKETING_CITY, updatedYellowLead === null || updatedYellowLead === void 0 ? void 0 : updatedYellowLead.city);
        (0, dropDownMetadataController_1.updateOnlyOneValueInDropDown)(constants_1.DropDownType.MARKETING_CITY, updatedYellowLead === null || updatedYellowLead === void 0 ? void 0 : updatedYellowLead.city);
        (0, dropDownMetadataController_1.updateOnlyOneValueInDropDown)(constants_1.DropDownType.FIX_MARKETING_COURSE_CODE, updatedYellowLead === null || updatedYellowLead === void 0 ? void 0 : updatedYellowLead.course);
        (0, dropDownMetadataController_1.updateOnlyOneValueInDropDown)(constants_1.DropDownType.MARKETING_COURSE_CODE, updatedYellowLead === null || updatedYellowLead === void 0 ? void 0 : updatedYellowLead.course);
        (0, safeAxios_1.safeAxiosPost)(axiosInstance_1.default, `${endPoints_1.Endpoints.AuditLogService.MARKETING.SAVE_LEAD}`, {
            documentId: updatedYellowLead === null || updatedYellowLead === void 0 ? void 0 : updatedYellowLead._id,
            action: constants_1.RequestAction.POST,
            payload: updatedYellowLead,
            performedBy: (_e = req.data) === null || _e === void 0 ? void 0 : _e.id,
            restEndpoint: '/api/update-yellow-lead',
        });
        yield session.commitTransaction();
        return (0, formatResponse_1.formatResponse)(res, 200, 'Yellow lead updated successfully', true, updatedYellowLead);
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        yield session.endSession();
    }
}));
exports.getFilteredYellowLeads = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { query, search, page, limit, sort } = (0, parseFilter_1.parseFilter)(req);
    query.leadType = constants_1.LeadType.ACTIVE;
    if (search.trim()) {
        query.$and = [
            ...((_a = query.$and) !== null && _a !== void 0 ? _a : []), // Preserve existing AND conditions if any
            {
                $or: [
                    { name: { $regex: search, $options: 'i' } }, // Case-insensitive search
                    { phoneNumber: { $regex: search, $options: 'i' } },
                    { altPhoneNumber: { $regex: search, $options: 'i' } }
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
    query.leadType = constants_1.LeadType.ACTIVE;
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
                    $sum: { $cond: [{ $eq: ['$finalConversion', constants_1.FinalConversionType.NOT_INTERESTED] }, 1, 0] }
                },
                admissions: {
                    $sum: { $cond: [{ $eq: ['$finalConversion', constants_1.FinalConversionType.ADMISSION] }, 1, 0] }
                },
                neutral: {
                    $sum: { $cond: [{ $eq: ['$finalConversion', constants_1.FinalConversionType.NEUTRAL] }, 1, 0] }
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
                neutral: 1
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
            neutral: 0
        };
    return (0, formatResponse_1.formatResponse)(res, 200, 'Yellow leads analytics fetched successfully', true, result);
}));
exports.getYellowLeadsAnalyticsV1 = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { query } = (0, parseFilter_1.parseFilter)(req);
    query.leadType = constants_1.LeadType.ACTIVE;
    const analytics = yield lead_1.LeadMaster.aggregate([
        { $match: query },
        // Group by name, phoneNumber, and source
        {
            $group: {
                _id: {
                    name: '$name',
                    phoneNumber: '$phoneNumber',
                    source: '$source'
                },
                finalConversions: { $addToSet: '$finalConversion' },
                footFalls: { $addToSet: '$footFall' }
            }
        },
        // Determine representative lead per group using priority logic
        {
            $project: {
                _id: 0,
                hasFootFall: {
                    $in: [true, '$footFalls']
                },
                representativeFinalConversion: {
                    $switch: {
                        branches: [
                            {
                                case: { $in: [constants_1.FinalConversionType.ADMISSION, '$finalConversions'] },
                                then: constants_1.FinalConversionType.ADMISSION
                            },
                            {
                                case: { $in: [constants_1.FinalConversionType.NEUTRAL, '$finalConversions'] },
                                then: constants_1.FinalConversionType.NEUTRAL
                            },
                            {
                                case: { $in: [constants_1.FinalConversionType.NOT_INTERESTED, '$finalConversions'] },
                                then: constants_1.FinalConversionType.NOT_INTERESTED
                            }
                        ],
                        default: constants_1.FinalConversionType.NO_FOOTFALL
                    }
                }
            }
        },
        // Group again to count different categories
        {
            $group: {
                _id: null,
                allLeadsCount: { $sum: 1 },
                campusVisitTrueCount: {
                    $sum: { $cond: [{ $eq: ['$hasFootFall', true] }, 1, 0] }
                },
                activeYellowLeadsCount: {
                    $sum: { $cond: [{ $eq: ['$hasFootFall', false] }, 1, 0] }
                },
                deadLeadCount: {
                    $sum: { $cond: [{ $eq: ['$representativeFinalConversion', constants_1.FinalConversionType.NOT_INTERESTED] }, 1, 0] }
                },
                admissions: {
                    $sum: { $cond: [{ $eq: ['$representativeFinalConversion', constants_1.FinalConversionType.ADMISSION] }, 1, 0] }
                },
                neutral: {
                    $sum: { $cond: [{ $eq: ['$representativeFinalConversion', constants_1.FinalConversionType.NEUTRAL] }, 1, 0] }
                }
            }
        },
        // Remove _id and keep only necessary fields
        {
            $project: {
                _id: 0,
                allLeadsCount: 1,
                campusVisitTrueCount: 1,
                activeYellowLeadsCount: 1,
                deadLeadCount: 1,
                admissions: 1,
                neutral: 1
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
            neutral: 0
        };
    return (0, formatResponse_1.formatResponse)(res, 200, 'Yellow leads analytics fetched successfully', true, result);
}));
