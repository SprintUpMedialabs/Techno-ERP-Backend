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
exports.updateMarketingRemark = exports.getCallAnalytics = exports.createMarketingAnalytics = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const mongoose_1 = __importDefault(require("mongoose"));
const user_1 = require("../../auth/models/user");
const constants_1 = require("../../config/constants");
const formatResponse_1 = require("../../utils/formatResponse");
const getISTDate_1 = require("../../utils/getISTDate");
const marketingAnalytics_1 = require("../models/marketingAnalytics");
const marketingFollowUp_1 = require("../models/marketingFollowUp");
const marketingUserWiseAnalytics_1 = require("../models/marketingUserWiseAnalytics");
exports.createMarketingAnalytics = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const marketingEmployees = yield user_1.User.find({ roles: constants_1.UserRoles.EMPLOYEE_MARKETING }).select('_id').session(session);
        const marketingEmployeeIds = marketingEmployees.map(user => user._id);
        if (marketingEmployeeIds.length === 0) {
            yield session.abortTransaction();
            session.endSession();
            return (0, formatResponse_1.formatResponse)(res, 200, "No marketing employees found", true, null);
        }
        const today = new Date();
        const type = constants_1.MarketingAnalyticsEnum.NO_OF_CALLS;
        const dateKey = today.toDateString();
        const detailsMap = {
            [dateKey]: []
        };
        for (const empId of marketingEmployeeIds) {
            const followUps = yield marketingFollowUp_1.MarketingFollowUpModel.find({ currentLoggedInUser: empId }).session(session);
            const leadStats = {};
            for (const followUp of followUps) {
                const leadIdStr = (_a = followUp.leadId) === null || _a === void 0 ? void 0 : _a.toString();
                if (!leadIdStr)
                    continue;
                if (!leadStats[leadIdStr]) {
                    leadStats[leadIdStr] = { increaments: 0, decreaments: 0 };
                }
                if (followUp.action === constants_1.Actions.INCREAMENT) {
                    leadStats[leadIdStr].increaments += 1;
                }
                else if (followUp.action === constants_1.Actions.DECREAMENT) {
                    leadStats[leadIdStr].decreaments += 1;
                }
            }
            let netPositiveLeadCount = 0;
            for (const leadId in leadStats) {
                const netCount = leadStats[leadId].increaments - leadStats[leadId].decreaments;
                if (netCount > 0)
                    netPositiveLeadCount += 1;
            }
            detailsMap[dateKey].push({
                userId: empId,
                noOfCalls: netPositiveLeadCount
            });
        }
        const dataForToday = detailsMap[dateKey];
        const updatedAnalytics = yield marketingAnalytics_1.MarketingAnalyticsModel.updateOne({ type }, {
            $push: {
                details: {
                    date: today,
                    data: dataForToday
                }
            },
            $set: {
                lastUpdatedAt: new Date()
            }
        }, { upsert: true, session });
        if (updatedAnalytics.acknowledged)
            yield marketingFollowUp_1.MarketingFollowUpModel.deleteMany({}, { session });
        yield session.commitTransaction();
        session.endSession();
        return (0, formatResponse_1.formatResponse)(res, 200, "Call follow-up data saved and cleared successfully", true, null);
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        console.error("Error during marketing analytics transaction:", error);
        return (0, formatResponse_1.formatResponse)(res, 500, "Failed to save marketing analytics", false, null);
    }
}));
exports.getCallAnalytics = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const callAnalytics = yield marketingAnalytics_1.MarketingAnalyticsModel.findOne({ type: constants_1.MarketingAnalyticsEnum.NO_OF_CALLS });
    if (!callAnalytics || callAnalytics.details.length === 0) {
        return (0, formatResponse_1.formatResponse)(res, 200, "No analytics data found", true, {});
    }
    const latestEntry = callAnalytics.details[callAnalytics.details.length - 1];
    const userIds = latestEntry.data.map(item => item.userId);
    const users = yield user_1.User.find({ _id: { $in: userIds } }).select('firstName lastName email');
    const userMap = users.reduce((acc, user) => {
        acc[user._id.toString()] = `${user.firstName} ${user.lastName} - ${user.email}`;
        return acc;
    }, {});
    const updatedData = latestEntry.data.map(item => ({
        user: userMap[item.userId.toString()] || 'Unknown User',
        noOfCalls: item.noOfCalls
    }));
    const response = {
        date: latestEntry.date,
        data: updatedData
    };
    return (0, formatResponse_1.formatResponse)(res, 200, "Analytics fetched successfully", true, response);
}));
exports.updateMarketingRemark = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { analyticsRemark } = req.body;
    const todayStart = (0, getISTDate_1.getISTDate)();
    const userAnalyticsDoc = yield marketingUserWiseAnalytics_1.MarketingUserWiseAnalytics.findOne({
        date: { $gte: todayStart },
        data: { $elemMatch: { userId: (_a = req.data) === null || _a === void 0 ? void 0 : _a.id } },
    });
    if (!userAnalyticsDoc)
        throw (0, http_errors_1.default)(404, 'User analytics not found.');
    const userIndex = userAnalyticsDoc.data.findIndex((entry) => { var _a; return entry.userId.toString() === ((_a = req.data) === null || _a === void 0 ? void 0 : _a.id.toString()); });
    if (userIndex === -1)
        throw (0, http_errors_1.default)(404, 'User not found in analytics data.');
    userAnalyticsDoc.data[userIndex].analyticsRemark = analyticsRemark;
    yield userAnalyticsDoc.save();
    return (0, formatResponse_1.formatResponse)(res, 200, "Marketing remark updated successfully", true, null);
}));
