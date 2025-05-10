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
        city = [],
        assignedTo = [],
        source = [],
        gender = []
    } = req.body as IAdminAnalyticsFilter;

    const query: Record<string, any> = {};

    if (city.length > 0) {
        query.city = { $in: city };
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

    const [allLeadAnalytics, yellowLeadAnalytics] = await Promise.all([
        LeadMaster.aggregate([
            { $match: query }, // Apply Filters
            {
                $group: {
                    _id: null,
                    allLeads: { $sum: 1 }, // Count total leads
                    reached: { $sum: { $cond: [{ $ne: ['$leadType', LeadType.LEFT_OVER] }, 1, 0] } }, // Count leads where leadType is NOT 'OPEN'
                    notReached: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.LEFT_OVER] }, 1, 0] } }, // Count leads where leadType is 'OPEN'
                    white: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.DID_NOT_PICK] }, 1, 0] } }, // Count leads where leadType is 'DID_NOT_PICK'
                    black: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.COURSE_UNAVAILABLE] }, 1, 0] } }, // Count leads where leadType is 'COURSE_UNAVAILABLE'
                    red: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.NOT_INTERESTED] }, 1, 0] } }, // Count leads where leadType is 'NOT_INTERESTED'
                    blue: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.NEUTRAL] }, 1, 0] } }, // Count leads where leadType is 'NO_CLARITY'
                    activeLeads: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.ACTIVE] }, 1, 0] } }, // Count leads where leadType is 'INTERESTED'
                    invalidType: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.INVALID] }, 1, 0] } }
                }
            }
        ]), LeadMaster.aggregate([
            { $match: {
                ...query,
                leadType : LeadType.ACTIVE
            } }, // in query we have issue
            {
                $group: {
                    _id: null,
                    // New Fields for Second Collection
                    footFall: { $sum: { $cond: [{ $eq: ['$footFall', true] }, 1, 0] } }, // Count where campusVisit is true
                    noFootFall: { $sum: { $cond: [{ $eq: ['$footFall', false] }, 1, 0] } }, // Count where campusVisit is false
                    unconfirmed: { $sum: { $cond: [{ $eq: ['$finalConversion', FinalConversionType.UNCONFIRMED] }, 1, 0] } }, // Count where finalConversion is 'PENDING'
                    dead: { $sum: { $cond: [{ $eq: ['$finalConversion', FinalConversionType.DEAD] }, 1, 0] } }, // Count where finalConversion is 'NOT_CONVERTED'
                    admissions: { $sum: { $cond: [{ $eq: ['$finalConversion', FinalConversionType.CONVERTED] }, 1, 0] } }, // Count where finalConversion is 'CONVERTED'
                }
            }
        ])
    ]);

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
});

