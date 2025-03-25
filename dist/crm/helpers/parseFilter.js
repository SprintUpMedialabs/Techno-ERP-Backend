"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFilter = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const constants_1 = require("../../config/constants");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
//We need to add here one for LTC of yellow leads for allowing analytics of yellow leads table on that => createdAt pe kaam kar raha hai ab
const parseFilter = (req) => {
    var _a, _b, _c, _d, _e;
    const { startDate, endDate, startLTCDate, // related to yellow lead table
    endLTCDate, // related to yellow lead table
    leadType = [], finalConversionType = [], // related to yellow lead table
    course = [], location = [], assignedTo = [], page = 1, limit = 10, sortBy, orderBy = "asc" /* OrderBy.ASC */, search = '' } = req.body;
    const filters = {
        startDate,
        endDate,
        leadType,
        finalConversionType,
        course,
        location,
        assignedTo,
        startLTCDate,
        endLTCDate
    };
    const query = {};
    if (finalConversionType.length > 0) {
        query.finalConversion = { $in: filters.finalConversionType };
    }
    if (leadType.length > 0) {
        query.leadType = { $in: filters.leadType };
    }
    if (filters.course.length > 0) {
        query.course = { $in: filters.course };
    }
    if (filters.location.length > 0) {
        query.location = { $in: filters.location };
    }
    filters.assignedTo = filters.assignedTo.map(id => new mongoose_1.default.Types.ObjectId(id));
    if (((_a = req.data) === null || _a === void 0 ? void 0 : _a.roles.includes(constants_1.UserRoles.EMPLOYEE_MARKETING)) &&
        !((_b = req.data) === null || _b === void 0 ? void 0 : _b.roles.includes(constants_1.UserRoles.LEAD_MARKETING)) &&
        !((_c = req.data) === null || _c === void 0 ? void 0 : _c.roles.includes(constants_1.UserRoles.ADMIN))) {
        query.assignedTo = { $in: [new mongoose_1.default.Types.ObjectId(req.data.id)] };
    }
    else if (((_d = req.data) === null || _d === void 0 ? void 0 : _d.roles.includes(constants_1.UserRoles.ADMIN)) ||
        ((_e = req.data) === null || _e === void 0 ? void 0 : _e.roles.includes(constants_1.UserRoles.LEAD_MARKETING))) {
        if (filters.assignedTo.length > 0) {
            query.assignedTo = { $in: filters.assignedTo };
        }
        // else {
        //   query.assignedTo = { $exists: true };
        // }
    }
    if (filters.startDate || filters.endDate) {
        query.date = {};
        if (filters.startDate) {
            query.date.$gte = (0, convertDateToFormatedDate_1.convertToMongoDate)(filters.startDate);
        }
        if (filters.endDate) {
            query.date.$lte = (0, convertDateToFormatedDate_1.convertToMongoDate)(filters.endDate);
        }
    }
    if (filters.startLTCDate || filters.endLTCDate) {
        query.createdAt = {};
        if (filters.startLTCDate) {
            query.createdAt.$gte = (0, convertDateToFormatedDate_1.convertToMongoDate)(filters.startLTCDate);
        }
        if (filters.endLTCDate) {
            query.createdAt.$lte = (0, convertDateToFormatedDate_1.convertToMongoDate)(filters.endLTCDate);
        }
    }
    let sort = {};
    if (sortBy === "date" /* SortableFields.DATE */ || sortBy === "nextDueDate" /* SortableFields.NEXT_DUE_DATE */) {
        sort[sortBy] = orderBy === "desc" /* OrderBy.DESC */ ? -1 : 1;
    }
    else if (sortBy === "startLTCDate" /* SortableFields.LTC_DATE */) {
        sort['createdAt'] = orderBy === "desc" /* OrderBy.DESC */ ? -1 : 1;
    }
    return {
        search: search,
        query: query,
        page: page,
        limit: limit,
        sort: sort
    };
};
exports.parseFilter = parseFilter;
