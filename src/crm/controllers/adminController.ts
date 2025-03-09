import { Response } from 'express';
import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { IAdminAnalyticsFilter, IAllLeadFilter } from "../types/marketingSpreadsheet";
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";
import { Lead } from "../models/leads";
import { FinalConversionType, LeadType } from "../../config/constants";
import { YellowLead } from "../models/yellowLead";
import logger from '../../config/logger';

export const adminAnalytics = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const {
        leadTypeChangeDateStart,
        leadTypeChangeDateEnd,
        location = [],
        assignedTo = [],
        source = [],
    } = req.body;

    const query: any = {};

    const filters: IAdminAnalyticsFilter = {
        leadTypeChangeDateStart,
        leadTypeChangeDateEnd,
        location,
        assignedTo,
        source
    };

    if (filters.location.length > 0) {
        query.location = { $in: filters.location };
    }

    if (filters.leadTypeChangeDateStart || filters.leadTypeChangeDateEnd) {
        query.date = {};
        if (filters.leadTypeChangeDateStart) {
            query.date.$gte = convertToMongoDate(filters.leadTypeChangeDateStart);
        }
        if (filters.leadTypeChangeDateEnd) {
            query.date.$lte = convertToMongoDate(filters.leadTypeChangeDateEnd);
        }
    }

    if (filters.assignedTo.length > 0) {
        query.assignedTo = { $in: filters.assignedTo };
    }

    if (filters.source.length > 0) {
        query.source = { $in: filters.source }
    }

    const allLeadAnalytics = await Lead.aggregate([
        { $match: query }, // Apply Filters
        {
            $group: {
                _id: null,
                allLeads: { $sum: 1 }, // Count total leads
                reached: { $sum: { $cond: [{ $ne: ['$leadType', LeadType.ORANGE] }, 1, 0] } }, // Count leads where leadType is NOT 'OPEN'
                notReached: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.ORANGE] }, 1, 0] } }, // Count leads where leadType is 'OPEN'
                white: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.WHITE] }, 1, 0] } }, // Count leads where leadType is 'DID_NOT_PICK'
                black: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.BLACK] }, 1, 0] } }, // Count leads where leadType is 'COURSE_UNAVAILABLE'
                red: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.RED] }, 1, 0] } }, // Count leads where leadType is 'NOT_INTERESTED'
                blue: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.BLUE] }, 1, 0] } }, // Count leads where leadType is 'NO_CLARITY'
                yellow: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.YELLOW] }, 1, 0] } }, // Count leads where leadType is 'INTERESTED'
            }
        }
    ]);

    const yellowLeadAnalytics = await YellowLead.aggregate([
        { $match: query }, // Apply the same filters
        {
            $group: {
                _id: null,
                // New Fields for Second Collection
                campusVisit: { $sum: { $cond: [{ $eq: ['$campusVisit', true] }, 1, 0] } }, // Count where campusVisit is true
                noCampusVisit: { $sum: { $cond: [{ $eq: ['$campusVisit', false] }, 1, 0] } }, // Count where campusVisit is false
                unconfirmed: { $sum: { $cond: [{ $eq: ['$finalConversion', FinalConversionType.PINK] }, 1, 0] } }, // Count where finalConversion is 'PENDING'
                declined: { $sum: { $cond: [{ $eq: ['$finalConversion', FinalConversionType.RED] }, 1, 0] } }, // Count where finalConversion is 'NOT_CONVERTED'
                finalConversion: { $sum: { $cond: [{ $eq: ['$finalConversion', FinalConversionType.GREEN] }, 1, 0] } }, // Count where finalConversion is 'CONVERTED'
            }
        }
    ]);

    console.log(allLeadAnalytics);
    console.log(yellowLeadAnalytics);

    res.status(200).json({
        success: true,
        message: "Admin analytics fetched successfully",
        data: {
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
        }
    });

});