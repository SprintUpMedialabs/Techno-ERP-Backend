import { Response } from 'express';
import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { FinalConversionType, LeadType } from "../../config/constants";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";
import { IAdminAnalyticsFilter } from "../types/marketingSpreadsheet";
import { formatResponse } from '../../utils/formatResponse';
import mongoose from 'mongoose';
import { LeadMaster } from '../models/lead';

export const adminAnalytics = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    let {
        startDate,
        endDate,
        location = [],
        assignedTo = [],
        source = [],
        gender = []
    } = req.body as IAdminAnalyticsFilter;

    const query: Record<string, any> = {};

    if (location.length > 0) {
        query.location = { $in: location };
    }

    if (startDate || endDate) {
        query.date = {};
        if (startDate) {
            query.date.$gte = convertToMongoDate(startDate);
        }
        if (endDate) {
            query.date.$lte = convertToMongoDate(endDate);
        }
    }
    assignedTo = assignedTo.map(id => new mongoose.Types.ObjectId(id));

    assignedTo = assignedTo.map(id => new mongoose.Types.ObjectId(id));

    if (assignedTo.length > 0) {
        query.assignedTo = { $in: assignedTo };
    }


    // TODO: will discuss this in future and apply it here
    if (source.length > 0) {
        query.source = { $in: source }
    }
    if (gender.length > 0) {
        query.gender = { $in: gender };
    }

    // console.log(query);

    const [allLeadAnalytics, yellowLeadAnalytics] = await Promise.all([
        LeadMaster.aggregate([
            { $match: query }, // Apply Filters
            {
                $group: {
                    _id: null,
                    allLeads: { $sum: 1 }, // Count total leads
                    reached: { $sum: { $cond: [{ $ne: ['$leadType', LeadType.OPEN] }, 1, 0] } }, // Count leads where leadType is NOT 'OPEN'
                    notReached: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.OPEN] }, 1, 0] } }, // Count leads where leadType is 'OPEN'
                    white: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.DID_NOT_PICK] }, 1, 0] } }, // Count leads where leadType is 'DID_NOT_PICK'
                    black: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.COURSE_UNAVAILABLE] }, 1, 0] } }, // Count leads where leadType is 'COURSE_UNAVAILABLE'
                    red: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.DEAD] }, 1, 0] } }, // Count leads where leadType is 'NOT_INTERESTED'
                    blue: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.NO_CLARITY] }, 1, 0] } }, // Count leads where leadType is 'NO_CLARITY'
                    yellow: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.INTERESTED] }, 1, 0] } }, // Count leads where leadType is 'INTERESTED'
                }
            }
        ]), LeadMaster.aggregate([
            { $match: {
                ...query,
                leadType : LeadType.INTERESTED
            } }, // in query we have issue
            {
                $group: {
                    _id: null,
                    // New Fields for Second Collection
                    campusVisit: { $sum: { $cond: [{ $eq: ['$campusVisit', true] }, 1, 0] } }, // Count where campusVisit is true
                    noCampusVisit: { $sum: { $cond: [{ $eq: ['$campusVisit', false] }, 1, 0] } }, // Count where campusVisit is false
                    unconfirmed: { $sum: { $cond: [{ $eq: ['$finalConversion', FinalConversionType.PENDING] }, 1, 0] } }, // Count where finalConversion is 'PENDING'
                    declined: { $sum: { $cond: [{ $eq: ['$finalConversion', FinalConversionType.DEAD] }, 1, 0] } }, // Count where finalConversion is 'NOT_CONVERTED'
                    finalConversion: { $sum: { $cond: [{ $eq: ['$finalConversion', FinalConversionType.CONVERTED] }, 1, 0] } }, // Count where finalConversion is 'CONVERTED'
                }
            }
        ])
    ]);

    // console.log(allLeadAnalytics);

    // console.log(yellowLeadAnalytics);

    return formatResponse(res, 200, 'Analytics fetched successfully',
        true,
        {
            allLeadsAnalytics: allLeadAnalytics.length > 0 ? allLeadAnalytics[0] : {
                allLeads: 0,
                reached: 0,
                notReached: 0,
                white: 0,
                black: 0,
                red: 0,
                blue: 0,
                yellow: 0
            },
            yellowLeadsAnalytics: yellowLeadAnalytics.length > 0 ? yellowLeadAnalytics[0] : {
                campusVisit: 0,
                noCampusVisit: 0,
                unconfirmed: 0,
                declined: 0,
                finalConversion: 0
            }
        });
});
