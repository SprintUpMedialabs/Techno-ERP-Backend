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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDurationBasedUserAnalytics = exports.getUserDailyAnalytics = exports.getMarketingUserWiseAnalytics = exports.reiterateLeads = exports.initializeUserWiseAnalytics = exports.getMarketingSourceWiseAnalytics = exports.createMarketingSourceWiseAnalyticsV1 = exports.createMarketingSourceWiseAnalytics = exports.adminAnalyticsV1 = exports.adminAnalytics = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const mongoose_1 = __importDefault(require("mongoose"));
const user_1 = require("../../auth/models/user");
const constants_1 = require("../../config/constants");
const retryMechanism_1 = require("../../config/retryMechanism");
const controller_1 = require("../../pipline/controller");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const formatResponse_1 = require("../../utils/formatResponse");
const getISTDate_1 = require("../../utils/getISTDate");
const lead_1 = require("../models/lead");
const marketingSourceWiseAnalytics_1 = require("../models/marketingSourceWiseAnalytics");
const marketingUserWiseAnalytics_1 = require("../models/marketingUserWiseAnalytics");
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
            {
                $match: Object.assign(Object.assign({}, query), { leadType: constants_1.LeadType.ACTIVE })
            }, // in query we have issue
            {
                $group: {
                    _id: null,
                    // New Fields for Second Collection
                    footFall: { $sum: { $cond: [{ $eq: ['$footFall', true] }, 1, 0] } }, // Count where campusVisit is true
                    noFootFall: { $sum: { $cond: [{ $eq: ['$footFall', false] }, 1, 0] } }, // Count where campusVisit is false
                    neutral: { $sum: { $cond: [{ $eq: ['$finalConversion', constants_1.FinalConversionType.NEUTRAL] }, 1, 0] } }, // Count where finalConversion is 'PENDING'
                    dead: { $sum: { $cond: [{ $eq: ['$finalConversion', constants_1.FinalConversionType.NOT_INTERESTED] }, 1, 0] } }, // Count where finalConversion is 'NOT_CONVERTED'
                    admissions: { $sum: { $cond: [{ $eq: ['$finalConversion', constants_1.FinalConversionType.ADMISSION] }, 1, 0] } }, // Count where finalConversion is 'CONVERTED'
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
exports.adminAnalyticsV1 = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    let { startDate, endDate, city = [], assignedTo = [], source = [], gender = [] } = req.body;
    const query = {};
    if (city.length > 0)
        query.city = { $in: city };
    if (startDate || endDate) {
        query.date = {};
        if (startDate)
            query.date.$gte = (0, convertDateToFormatedDate_1.convertToMongoDate)(startDate);
        if (endDate)
            query.date.$lte = (0, convertDateToFormatedDate_1.convertToMongoDate)(endDate);
    }
    if (assignedTo.length > 0)
        query.assignedTo = { $in: assignedTo.map(id => new mongoose_1.default.Types.ObjectId(id)) };
    if (source.length > 0)
        query.source = { $in: source };
    if (gender.length > 0)
        query.gender = { $in: gender };
    const [allLeadAnalytics, yellowLeadAnalytics] = yield Promise.all([
        lead_1.LeadMaster.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        name: "$name",
                        phoneNumber: "$phoneNumber",
                        source: "$source"
                    },
                    leadTypes: { $addToSet: '$leadType' }
                }
            },
            {
                $project: {
                    _id: 0,
                    representativeLeadType: {
                        $switch: {
                            branches: [
                                {
                                    case: { $in: [constants_1.LeadType.ACTIVE, '$leadTypes'] },
                                    then: constants_1.LeadType.ACTIVE
                                },
                                {
                                    case: { $in: [constants_1.LeadType.NEUTRAL, '$leadTypes'] },
                                    then: constants_1.LeadType.NEUTRAL
                                },
                                {
                                    case: { $in: [constants_1.LeadType.DID_NOT_PICK, '$leadTypes'] },
                                    then: constants_1.LeadType.DID_NOT_PICK
                                },
                                {
                                    case: { $in: [constants_1.LeadType.NOT_INTERESTED, '$leadTypes'] },
                                    then: constants_1.LeadType.NOT_INTERESTED
                                },
                                {
                                    case: { $in: [constants_1.LeadType.COURSE_UNAVAILABLE, '$leadTypes'] },
                                    then: constants_1.LeadType.COURSE_UNAVAILABLE
                                },
                                {
                                    case: { $in: [constants_1.LeadType.INVALID, '$leadTypes'] },
                                    then: constants_1.LeadType.INVALID
                                },
                                {
                                    case: { $in: [constants_1.LeadType.LEFT_OVER, '$leadTypes'] },
                                    then: constants_1.LeadType.LEFT_OVER
                                }
                            ],
                            default: 'UNKNOWN'
                        }
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    allLeads: { $sum: 1 },
                    reached: { $sum: { $cond: [{ $ne: ['$representativeLeadType', constants_1.LeadType.LEFT_OVER] }, 1, 0] } },
                    notReached: { $sum: { $cond: [{ $eq: ['$representativeLeadType', constants_1.LeadType.LEFT_OVER] }, 1, 0] } },
                    white: { $sum: { $cond: [{ $eq: ['$representativeLeadType', constants_1.LeadType.DID_NOT_PICK] }, 1, 0] } },
                    black: { $sum: { $cond: [{ $eq: ['$representativeLeadType', constants_1.LeadType.COURSE_UNAVAILABLE] }, 1, 0] } },
                    red: { $sum: { $cond: [{ $eq: ['$representativeLeadType', constants_1.LeadType.NOT_INTERESTED] }, 1, 0] } },
                    blue: { $sum: { $cond: [{ $eq: ['$representativeLeadType', constants_1.LeadType.NEUTRAL] }, 1, 0] } },
                    activeLeads: { $sum: { $cond: [{ $eq: ['$representativeLeadType', constants_1.LeadType.ACTIVE] }, 1, 0] } },
                    invalidType: { $sum: { $cond: [{ $eq: ['$representativeLeadType', constants_1.LeadType.INVALID] }, 1, 0] } }
                }
            }
        ]),
        lead_1.LeadMaster.aggregate([
            {
                $match: Object.assign(Object.assign({}, query), { leadType: constants_1.LeadType.ACTIVE })
            },
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
                    footFall: { $sum: { $cond: [{ $eq: ["$hasFootFall", true] }, 1, 0] } },
                    noFootFall: { $sum: { $cond: [{ $eq: ["$hasFootFall", false] }, 1, 0] } },
                    admissions: { $sum: { $cond: [{ $eq: ["$representativeFinalConversion", constants_1.FinalConversionType.ADMISSION] }, 1, 0] } },
                    neutral: { $sum: { $cond: [{ $eq: ["$representativeFinalConversion", constants_1.FinalConversionType.NEUTRAL] }, 1, 0] } },
                    dead: { $sum: { $cond: [{ $eq: ["$representativeFinalConversion", constants_1.FinalConversionType.NOT_INTERESTED] }, 1, 0] } },
                }
            }
        ])
    ]);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Analytics fetched successfully', true, {
        allLeadsAnalytics: (_a = allLeadAnalytics[0]) !== null && _a !== void 0 ? _a : {
            allLeads: 0,
            reached: 0,
            notReached: 0,
            white: 0,
            black: 0,
            red: 0,
            blue: 0,
            activeLeads: 0,
            invalidType: 0
        },
        yellowLeadsAnalytics: (_b = yellowLeadAnalytics[0]) !== null && _b !== void 0 ? _b : {
            footFall: 0,
            noFootFall: 0,
            admissions: 0,
            neutral: 0,
            dead: 0
        }
    });
}));
const createEmptyData = () => ({
    totalLeads: 0,
    activeLeads: 0,
    neutralLeads: 0,
    didNotPickLeads: 0,
    others: 0,
    footFall: 0,
    totalAdmissions: 0,
});
const mapLeadType = (lead) => {
    switch (lead.leadType) {
        case constants_1.LeadType.ACTIVE: return 'activeLeads';
        case constants_1.LeadType.NEUTRAL: return 'neutralLeads';
        case constants_1.LeadType.DID_NOT_PICK: return 'didNotPickLeads';
        default:
            return 'others';
    }
};
const updateLeadStats = (data, lead, field) => {
    data.totalLeads++;
    data[field]++;
    if (lead.footFall)
        data.footFall++;
    if (lead.finalConversion === constants_1.FinalConversionType.ADMISSION)
        data.totalAdmissions++;
};
const checkIsOnline = (source) => {
    const onlineSources = [
        'Digital - Direct Call',
        'Digital - Google Ads',
        'Digital - WhatsApp',
        'Digital - IVR',
        'Digital - Meta',
        'Digital - TawkTo',
        'Digital - Website',
    ];
    return onlineSources.map(s => s.toLowerCase()).includes(source.toLowerCase());
};
const checkIsOffline = (source) => {
    const offlineSources = [
        'Board Exam',
        'CUET',
        'PG Data',
        'UG Data',
    ];
    return offlineSources.map(s => s.toLowerCase()).includes(source.toLowerCase());
};
exports.createMarketingSourceWiseAnalytics = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pipelineId = yield (0, controller_1.createPipeline)(constants_1.PipelineName.MARKETING_SOURCE_WISE_ANALYTICS);
    yield (0, retryMechanism_1.retryMechanism)((session) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, e_1, _b, _c;
        const cursor = lead_1.LeadMaster.find({}, 'source leadType footFall finalConversion')
            .lean()
            .cursor();
        const offlineMap = {};
        const onlineMap = {};
        const totalOfflineData = createEmptyData();
        const totalOnlineData = createEmptyData();
        const totalOthersData = createEmptyData();
        try {
            for (var _d = true, cursor_1 = __asyncValues(cursor), cursor_1_1; cursor_1_1 = yield cursor_1.next(), _a = cursor_1_1.done, !_a; _d = true) {
                _c = cursor_1_1.value;
                _d = false;
                const lead = _c;
                const source = lead.source || 'Unknown';
                const field = mapLeadType(lead);
                const isOnline = checkIsOnline(source);
                const isOffline = checkIsOffline(source);
                if (isOnline || isOffline) {
                    const map = isOnline ? onlineMap : offlineMap;
                    const total = isOnline ? totalOnlineData : totalOfflineData;
                    if (!map[source]) {
                        map[source] = { source, data: createEmptyData() };
                    }
                    updateLeadStats(map[source].data, lead, field);
                    updateLeadStats(total, lead, field);
                }
                else {
                    updateLeadStats(totalOthersData, lead, field);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = cursor_1.return)) yield _b.call(cursor_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        // Prepare final analytics data
        const response = [
            { type: 'offline-data', details: Object.values(offlineMap) },
            { type: 'online-data', details: Object.values(onlineMap) },
            {
                type: 'all-leads',
                details: [
                    { source: 'offline', data: totalOfflineData },
                    { source: 'online', data: totalOnlineData },
                    { source: 'others', data: totalOthersData },
                ],
            },
        ];
        // Perform efficient upsert in one bulk write
        const bulkOps = response.map(item => ({
            updateOne: {
                filter: { type: item.type },
                update: { $set: { type: item.type, details: item.details } },
                upsert: true,
            },
        }));
        yield marketingSourceWiseAnalytics_1.MarketingSourceWiseAnalytics.bulkWrite(bulkOps, { session });
    }), "Marketing Source Analytics Retry Failed", "Final failure after multiple retry attempts in Marketing Source Analytics pipeline", pipelineId, constants_1.PipelineName.MARKETING_SOURCE_WISE_ANALYTICS);
    return (0, formatResponse_1.formatResponse)(res, 200, "Marketing Source Wise Analytics Created.", true, null);
}));
exports.createMarketingSourceWiseAnalyticsV1 = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield lead_1.LeadMaster.aggregate([
        {
            $group: {
                _id: {
                    name: '$name',
                    phoneNumber: '$phoneNumber',
                    source: '$source'
                },
                finalConversions: { $addToSet: '$finalConversion' },
                footFalls: { $addToSet: '$footFall' },
                leadTypes: { $addToSet: '$leadType' }
            }
        },
    ]);
}));
exports.getMarketingSourceWiseAnalytics = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield marketingSourceWiseAnalytics_1.MarketingSourceWiseAnalytics.find({});
    return (0, formatResponse_1.formatResponse)(res, 200, "Marketing Source Wise Analytics fetched successfully", true, data);
}));
exports.initializeUserWiseAnalytics = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pipelineId = yield (0, controller_1.createPipeline)(constants_1.PipelineName.INITIALIZE_MARKETING_ANALYTICS);
    if (!pipelineId)
        throw (0, http_errors_1.default)(400, "Pipeline creation failed");
    yield (0, retryMechanism_1.retryMechanism)((session) => __awaiter(void 0, void 0, void 0, function* () {
        const yesterday = (0, getISTDate_1.getISTDate)(-1);
        const marketingEmployees = yield user_1.User.find({ roles: constants_1.UserRoles.EMPLOYEE_MARKETING }, "_id firstName lastName").lean();
        const yesterdayAnalytics = yield marketingUserWiseAnalytics_1.MarketingUserWiseAnalytics.findOne({ date: yesterday }).lean();
        const yesterdayDataMap = {};
        if (yesterdayAnalytics) {
            for (const entry of yesterdayAnalytics.data) {
                yesterdayDataMap[String(entry.userId)] = {
                    totalFootFall: entry.totalFootFall,
                    totalAdmissions: entry.totalAdmissions,
                };
            }
        }
        const initializedData = marketingEmployees.map(user => {
            const userIdStr = String(user._id);
            const previous = yesterdayDataMap[userIdStr] || { totalFootFall: 0, totalAdmissions: 0 };
            return {
                userId: user._id,
                userFirstName: user.firstName,
                userLastName: user.lastName,
                totalCalls: 0,
                newLeadCalls: 0,
                activeLeadCalls: 0,
                nonActiveLeadCalls: 0,
                totalFootFall: previous.totalFootFall,
                totalAdmissions: previous.totalAdmissions,
            };
        });
        const todayIST = (0, getISTDate_1.getISTDate)();
        yield marketingUserWiseAnalytics_1.MarketingUserWiseAnalytics.create([{ date: todayIST, data: initializedData }], { session });
        return (0, formatResponse_1.formatResponse)(res, 201, "Initialized data", true, null);
    }), "UserWise Analytics Initialization Failed", "Failed to initialize user-wise analytics after multiple attempts.", pipelineId, constants_1.PipelineName.INITIALIZE_MARKETING_ANALYTICS);
}));
exports.reiterateLeads = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pipelineId = yield (0, controller_1.createPipeline)(constants_1.PipelineName.ITERATE_LEADS);
    if (!pipelineId)
        throw (0, http_errors_1.default)(400, "Pipeline creation failed");
    yield (0, retryMechanism_1.retryMechanism)((session) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, e_2, _b, _c;
        const BATCH_SIZE = 1000; // Tune batch size as per memory limits
        const cursor = lead_1.LeadMaster.find({}, null, { lean: true }).cursor({ session });
        let bulkOps = [];
        let updatedCount = 0;
        try {
            for (var _d = true, cursor_2 = __asyncValues(cursor), cursor_2_1; cursor_2_1 = yield cursor_2.next(), _a = cursor_2_1.done, !_a; _d = true) {
                _c = cursor_2_1.value;
                _d = false;
                const lead = _c;
                bulkOps.push({
                    updateOne: {
                        filter: { _id: lead._id },
                        update: {
                            isCalledToday: false,
                            isActiveLead: lead.leadType === constants_1.LeadType.ACTIVE,
                        },
                    },
                });
                if (bulkOps.length === BATCH_SIZE) {
                    const bulkWriteResult = yield lead_1.LeadMaster.bulkWrite(bulkOps, { session });
                    updatedCount += bulkWriteResult.modifiedCount;
                    bulkOps = []; // reset for next batch
                }
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = cursor_2.return)) yield _b.call(cursor_2);
            }
            finally { if (e_2) throw e_2.error; }
        }
        // Process any remaining operations
        if (bulkOps.length > 0) {
            const bulkWriteResult = yield lead_1.LeadMaster.bulkWrite(bulkOps, { session });
            updatedCount += bulkWriteResult.modifiedCount;
        }
        return (0, formatResponse_1.formatResponse)(res, 200, "Reiterated the Lead Master Table", true, updatedCount);
    }), "Lead Reiteration Failed", "Failed to reiterate lead statuses after multiple attempts.", pipelineId, constants_1.PipelineName.ITERATE_LEADS);
}));
exports.getMarketingUserWiseAnalytics = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const startIST = (0, getISTDate_1.getISTDate)(0);
    const todayAnalytics = yield marketingUserWiseAnalytics_1.MarketingUserWiseAnalytics.findOne({
        date: startIST
    });
    return (0, formatResponse_1.formatResponse)(res, 200, "Marketing user wise analytics fetched successfully", true, todayAnalytics);
}));
exports.getUserDailyAnalytics = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const startIST = (0, getISTDate_1.getISTDate)(0);
    const todayAnalytics = yield marketingUserWiseAnalytics_1.MarketingUserWiseAnalytics.findOne({
        date: startIST,
    });
    const userAnalytics = todayAnalytics === null || todayAnalytics === void 0 ? void 0 : todayAnalytics.data.find(item => { var _a; return item.userId.toString() === ((_a = req.data) === null || _a === void 0 ? void 0 : _a.id); });
    if (!userAnalytics)
        throw (0, http_errors_1.default)(404, "User daily analytics not found");
    return (0, formatResponse_1.formatResponse)(res, 200, "User daily analytics fetched successfully", true, userAnalytics);
}));
exports.getDurationBasedUserAnalytics = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { startDate, endDate } = req.body;
    const mongoStartDate = (0, convertDateToFormatedDate_1.convertToMongoDate)(startDate);
    const mongoEndDate = (0, convertDateToFormatedDate_1.convertToMongoDate)(endDate);
    const pipeline = [
        {
            $match: {
                date: {
                    $gte: mongoStartDate,
                    $lte: mongoEndDate,
                },
            },
        },
        {
            $unwind: '$data',
        },
        {
            $sort: {
                'data.userId': 1,
                date: 1,
            },
        },
        {
            $group: {
                _id: '$data.userId',
                userFirstName: { $first: '$data.userFirstName' },
                userLastName: { $first: '$data.userLastName' },
                totalCalls: { $sum: '$data.totalCalls' },
                newLeadCalls: { $sum: '$data.newLeadCalls' },
                activeLeadCalls: { $sum: '$data.activeLeadCalls' },
                nonActiveLeadCalls: { $sum: '$data.nonActiveLeadCalls' },
                totalFootFall: { $last: '$data.totalFootFall' },
                totalAdmissions: { $last: '$data.totalAdmissions' },
            },
        },
    ];
    const result = yield marketingUserWiseAnalytics_1.MarketingUserWiseAnalytics.aggregate(pipeline);
    return (0, formatResponse_1.formatResponse)(res, 200, "User Wise Analytics Fetched successfully", true, result);
}));
