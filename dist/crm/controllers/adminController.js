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
exports.getMarketingUserWiseAnalytics = exports.reiterateLeads = exports.initializeUserWiseAnalytics = exports.getMarketingSourceWiseAnalytics = exports.createMarketingSourceWiseAnalytics = exports.adminAnalytics = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const constants_1 = require("../../config/constants");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const formatResponse_1 = require("../../utils/formatResponse");
const mongoose_1 = __importDefault(require("mongoose"));
const lead_1 = require("../models/lead");
const marketingSourceWiseAnalytics_1 = require("../models/marketingSourceWiseAnalytics");
const retryMechanism_1 = require("../../config/retryMechanism");
const controller_1 = require("../../pipline/controller");
const getISTDate_1 = require("../../utils/getISTDate");
const user_1 = require("../../auth/models/user");
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
exports.createMarketingSourceWiseAnalytics = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const pipelineId = yield (0, controller_1.createPipeline)(constants_1.PipelineName.MARKETING_SOURCE_WISE_ANALYTICS);
    yield (0, retryMechanism_1.retryMechanism)((session) => __awaiter(void 0, void 0, void 0, function* () {
        const leads = yield lead_1.LeadMaster.find({}, 'source leadType footFall finalConversion').lean();
        const offlineMap = {};
        const onlineMap = {};
        const totalOfflineData = createEmptyData();
        const totalOnlineData = createEmptyData();
        const totalOthersData = createEmptyData();
        for (const lead of leads) {
            const source = lead.source || 'Unknown';
            const field = mapLeadType(lead);
            const isOnline = constants_1.ONLINE_SOURCES.includes(source);
            const isOffline = constants_1.OFFLINE_SOURCES.includes(source);
            if (isOnline || isOffline) {
                const map = isOnline ? onlineMap : offlineMap;
                const total = isOnline ? totalOnlineData : totalOfflineData;
                if (!map[source]) {
                    map[source] = {
                        source,
                        data: createEmptyData(),
                    };
                }
                updateLeadStats(map[source].data, lead, field);
                updateLeadStats(total, lead, field);
            }
            else {
                updateLeadStats(totalOthersData, lead, field);
            }
        }
        const response = [
            { type: "offline-data", details: Object.values(offlineMap) },
            { type: "online-data", details: Object.values(onlineMap) },
            {
                type: "all-leads",
                details: [
                    { source: "offline", data: totalOfflineData },
                    { source: "online", data: totalOnlineData },
                    { source: "others", data: totalOthersData },
                ],
            },
        ];
        const bulkOps = response.map((item) => ({
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
exports.getMarketingSourceWiseAnalytics = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield marketingSourceWiseAnalytics_1.MarketingSourceWiseAnalytics.find({});
    return (0, formatResponse_1.formatResponse)(res, 200, "Marketing Source Wise Analytics fetched successfully", true, data);
}));
exports.initializeUserWiseAnalytics = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
    yield marketingUserWiseAnalytics_1.MarketingUserWiseAnalytics.create({
        date: todayIST,
        data: initializedData,
    });
    return (0, formatResponse_1.formatResponse)(res, 200, "Initialised data", true, initializedData);
}));
exports.reiterateLeads = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const leads = yield lead_1.LeadMaster.find({});
    const bulkOps = leads.map((lead) => {
        return {
            updateOne: {
                filter: { _id: lead._id },
                update: {
                    isCalledToday: false,
                    isActiveLead: lead.leadType === constants_1.LeadType.ACTIVE,
                },
            },
        };
    });
    if (bulkOps.length > 0) {
        const bulkWriteResult = yield lead_1.LeadMaster.bulkWrite(bulkOps);
        return (0, formatResponse_1.formatResponse)(res, 200, "Reiterated the Lead Master Table", true, bulkWriteResult.modifiedCount);
    }
    else {
        return (0, formatResponse_1.formatResponse)(res, 200, "No Leads to update", true, null);
    }
}));
exports.getMarketingUserWiseAnalytics = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const startIST = (0, getISTDate_1.getISTDate)(0);
    const nextDayIST = (0, getISTDate_1.getISTDate)(1);
    const todayAnalytics = yield marketingUserWiseAnalytics_1.MarketingUserWiseAnalytics.findOne({
        date: {
            $gte: startIST,
            $lt: nextDayIST,
        },
    });
    return (0, formatResponse_1.formatResponse)(res, 200, "Marketing user wise analytics fetched successfully", true, todayAnalytics);
}));
