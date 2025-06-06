import { Response } from 'express';
import expressAsyncHandler from "express-async-handler";
import createHttpError from "http-errors";
import mongoose from 'mongoose';
import { User } from '../../auth/models/user';
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { FinalConversionType, LeadType, offlineSources, onlineSources, PipelineName, UserRoles } from "../../config/constants";
import { retryMechanism } from '../../config/retryMechanism';
import { createPipeline } from '../../pipline/controller';
import { convertToMongoDate } from "../../utils/convertDateToFormatedDate";
import { formatResponse } from '../../utils/formatResponse';
import { getISTDate } from '../../utils/getISTDate';
import { LeadMaster } from '../models/lead';
import { MarketingSourceWiseAnalytics } from '../models/marketingSourceWiseAnalytics';
import { MarketingUserWiseAnalytics } from '../models/marketingUserWiseAnalytics';
import { IAdminAnalyticsFilter } from "../types/marketingSpreadsheet";

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
            {
                $match: {
                    ...query,
                    leadType: LeadType.ACTIVE
                }
            }, // in query we have issue
            {
                $group: {
                    _id: null,
                    // New Fields for Second Collection
                    footFall: { $sum: { $cond: [{ $eq: ['$footFall', true] }, 1, 0] } }, // Count where campusVisit is true
                    noFootFall: { $sum: { $cond: [{ $eq: ['$footFall', false] }, 1, 0] } }, // Count where campusVisit is false
                    neutral: { $sum: { $cond: [{ $eq: ['$finalConversion', FinalConversionType.NEUTRAL] }, 1, 0] } }, // Count where finalConversion is 'PENDING'
                    dead: { $sum: { $cond: [{ $eq: ['$finalConversion', FinalConversionType.NOT_INTERESTED] }, 1, 0] } }, // Count where finalConversion is 'NOT_CONVERTED'
                    admissions: { $sum: { $cond: [{ $eq: ['$finalConversion', FinalConversionType.ADMISSION] }, 1, 0] } }, // Count where finalConversion is 'CONVERTED'
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

export const adminAnalyticsV1 = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    let {
        startDate,
        endDate,
        city = [],
        assignedTo = [],
        source = [],
        gender = []
    } = req.body as IAdminAnalyticsFilter;

    const query: Record<string, any> = {};

    if (city.length > 0) query.city = { $in: city };

    if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = convertToMongoDate(startDate);
        if (endDate) query.date.$lte = convertToMongoDate(endDate);
    }

    if (assignedTo.length > 0)
        query.assignedTo = { $in: assignedTo.map(id => new mongoose.Types.ObjectId(id)) };

    if (source.length > 0) query.source = { $in: source };
    if (gender.length > 0) query.gender = { $in: gender };

    const [allLeadAnalytics, yellowLeadAnalytics] = await Promise.all([
        LeadMaster.aggregate([
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
                                    case: { $in: [LeadType.ACTIVE, '$leadTypes'] },
                                    then: LeadType.ACTIVE
                                },
                                {
                                    case: { $in: [LeadType.NEUTRAL, '$leadTypes'] },
                                    then: LeadType.NEUTRAL
                                },
                                {
                                    case: { $in: [LeadType.DID_NOT_PICK, '$leadTypes'] },
                                    then: LeadType.DID_NOT_PICK
                                },
                                {
                                    case: { $in: [LeadType.NOT_INTERESTED, '$leadTypes'] },
                                    then: LeadType.NOT_INTERESTED
                                },
                                {
                                    case: { $in: [LeadType.COURSE_UNAVAILABLE, '$leadTypes'] },
                                    then: LeadType.COURSE_UNAVAILABLE
                                },
                                {
                                    case: { $in: [LeadType.INVALID, '$leadTypes'] },
                                    then: LeadType.INVALID
                                },
                                {
                                    case: { $in: [LeadType.LEFT_OVER, '$leadTypes'] },
                                    then: LeadType.LEFT_OVER
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
                    reached: { $sum: { $cond: [{ $ne: ['$representativeLeadType', LeadType.LEFT_OVER] }, 1, 0] } },
                    notReached: { $sum: { $cond: [{ $eq: ['$representativeLeadType', LeadType.LEFT_OVER] }, 1, 0] } },
                    white: { $sum: { $cond: [{ $eq: ['$representativeLeadType', LeadType.DID_NOT_PICK] }, 1, 0] } },
                    black: { $sum: { $cond: [{ $eq: ['$representativeLeadType', LeadType.COURSE_UNAVAILABLE] }, 1, 0] } },
                    red: { $sum: { $cond: [{ $eq: ['$representativeLeadType', LeadType.NOT_INTERESTED] }, 1, 0] } },
                    blue: { $sum: { $cond: [{ $eq: ['$representativeLeadType', LeadType.NEUTRAL] }, 1, 0] } },
                    activeLeads: { $sum: { $cond: [{ $eq: ['$representativeLeadType', LeadType.ACTIVE] }, 1, 0] } },
                    invalidType: { $sum: { $cond: [{ $eq: ['$representativeLeadType', LeadType.INVALID] }, 1, 0] } }
                }
            }
        ]),

        LeadMaster.aggregate([
            {
                $match: {
                    ...query,
                    leadType: LeadType.ACTIVE
                }
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
                                    case: { $in: [FinalConversionType.ADMISSION, '$finalConversions'] },
                                    then: FinalConversionType.ADMISSION
                                },
                                {
                                    case: { $in: [FinalConversionType.NEUTRAL, '$finalConversions'] },
                                    then: FinalConversionType.NEUTRAL
                                },
                                {
                                    case: { $in: [FinalConversionType.NOT_INTERESTED, '$finalConversions'] },
                                    then: FinalConversionType.NOT_INTERESTED
                                }
                            ],
                            default: FinalConversionType.NO_FOOTFALL
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
                    admissions: { $sum: { $cond: [{ $eq: ["$representativeFinalConversion", FinalConversionType.ADMISSION] }, 1, 0] } },
                    neutral: { $sum: { $cond: [{ $eq: ["$representativeFinalConversion", FinalConversionType.NEUTRAL] }, 1, 0] } },
                    dead: { $sum: { $cond: [{ $eq: ["$representativeFinalConversion", FinalConversionType.NOT_INTERESTED] }, 1, 0] } },
                }
            }
        ])
    ]);

    return formatResponse(res, 200, 'Analytics fetched successfully',
        true,
        {
            allLeadsAnalytics: allLeadAnalytics[0] ?? {
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
            yellowLeadsAnalytics: yellowLeadAnalytics[0] ?? {
                footFall: 0,
                noFootFall: 0,
                admissions: 0,
                neutral: 0,
                dead: 0
            }
        });
});



const createEmptyData = () => ({
    totalLeads: 0,
    activeLeads: 0,
    neutralLeads: 0,
    didNotPickLeads: 0,
    others: 0,
    footFall: 0,
    totalAdmissions: 0,
});

const mapLeadType = (lead: any) => {
    switch (lead.leadType) {
        case LeadType.ACTIVE: return 'activeLeads';
        case LeadType.NEUTRAL: return 'neutralLeads';
        case LeadType.DID_NOT_PICK: return 'didNotPickLeads';
        default:
            return 'others';
    }
};
const updateLeadStats = (data: any, lead: any, field: string) => {
    data.totalLeads++;
    data[field]++;
    if (lead.footFall)
        data.footFall++;
    if (lead.finalConversion === FinalConversionType.ADMISSION)
        data.totalAdmissions++;
};

const checkIsOnline = (source: string) => {
    return onlineSources.map(s => s.toLowerCase()).includes(source.toLowerCase());
}

const checkIsOffline = (source: string) => {
    return offlineSources.map(s => s.toLowerCase()).includes(source.toLowerCase());
}

export const createMarketingSourceWiseAnalytics = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

    const pipelineId = await createPipeline(PipelineName.MARKETING_SOURCE_WISE_ANALYTICS);

    await retryMechanism(
        async (session) => {
            const cursor = LeadMaster.find({}, 'source leadType footFall finalConversion')
                .lean()
                .cursor();

            const offlineMap: Record<string, { source: string; data: any }> = {};
            const onlineMap: Record<string, { source: string; data: any }> = {};

            const totalOfflineData = createEmptyData();
            const totalOnlineData = createEmptyData();
            const totalOthersData = createEmptyData();

            for await (const lead of cursor) {
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
                } else {
                    updateLeadStats(totalOthersData, lead, field);
                }
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

            await MarketingSourceWiseAnalytics.bulkWrite(bulkOps, { session });

        },
        "Marketing Source Analytics Retry Failed",
        "Final failure after multiple retry attempts in Marketing Source Analytics pipeline",
        pipelineId!,
        PipelineName.MARKETING_SOURCE_WISE_ANALYTICS
    );

    return formatResponse(res, 200, "Marketing Source Wise Analytics Created.", true, null);
});

export const createMarketingSourceWiseAnalyticsV1 = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await LeadMaster.aggregate([
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
        {
            $project: {
                _id: 0,
                source: '$_id.source',
                hasFootFall: {
                    $in: [true, '$footFalls']
                },
                representativeFinalConversion: {
                    $switch: {
                        branches: [
                            {
                                case: { $in: [FinalConversionType.ADMISSION, '$finalConversions'] },
                                then: FinalConversionType.ADMISSION
                            },
                        ],
                        default: FinalConversionType.NO_FOOTFALL
                    }
                },
                representativeLeadType: {
                    $switch: {
                        branches: [
                            {
                                case: { $in: [LeadType.ACTIVE, '$leadTypes'] },
                                then: LeadType.ACTIVE
                            },
                            {
                                case: { $in: [LeadType.NEUTRAL, '$leadTypes'] },
                                then: LeadType.NEUTRAL
                            },
                            {
                                case: { $in: [LeadType.DID_NOT_PICK, '$leadTypes'] },
                                then: LeadType.DID_NOT_PICK
                            },
                        ],
                        default: 'OTHERS'
                    }
                }
            }
        },
        {
            $group: {
                _id: '$source',
                totalLeads: { $sum: 1 },
                activeLeads: { $sum: { $cond: [{ $eq: ['$representativeLeadType', LeadType.ACTIVE] }, 1, 0] } },
                neutralLeads: { $sum: { $cond: [{ $eq: ['$representativeLeadType', LeadType.NEUTRAL] }, 1, 0] } },
                didNotPickLeads: { $sum: { $cond: [{ $eq: ['$representativeLeadType', LeadType.DID_NOT_PICK] }, 1, 0] } },
                others: { $sum: { $cond: [{ $eq: ['$representativeLeadType', 'OTHERS'] }, 1, 0] } },
                footFall: { $sum: { $cond: [{ $eq: ['$hasFootFall', true] }, 1, 0] } },
                totalAdmissions: {
                    $sum: { $cond: [{ $eq: ['$representativeFinalConversion', FinalConversionType.ADMISSION] }, 1, 0] }
                },
            }
        },
        {
            $project: {
                _id: 0,
                source: '$_id',
                totalLeads: 1,
                activeLeads: 1,
                neutralLeads: 1,
                didNotPickLeads: 1,
                others: 1,
                footFall: 1,
                totalAdmissions: 1,
            }
        }
    ]);
    const offlineMap: Record<string, { source: string; data: any }> = {};
    const onlineMap: Record<string, { source: string; data: any }> = {};

    const totalOfflineData = createEmptyData();
    const totalOnlineData = createEmptyData();
    const totalOthersData = createEmptyData();

    for (const item of data) {
        const isOnline = checkIsOnline(item.source);
        const isOffline = checkIsOffline(item.source);
        if (isOnline) {
            onlineMap[item.source] = { source: item.source, data: item };
        } else if (isOffline) {
            offlineMap[item.source] = { source: item.source, data: item };
        }
        if (isOnline) {
            totalOnlineData.totalLeads += item.totalLeads;
            totalOnlineData.activeLeads += item.activeLeads;
            totalOnlineData.neutralLeads += item.neutralLeads;
            totalOnlineData.didNotPickLeads += item.didNotPickLeads;
            totalOnlineData.others += item.others;
            totalOnlineData.footFall += item.footFall;
            totalOnlineData.totalAdmissions += item.totalAdmissions;
        } else if (isOffline) {
            totalOfflineData.totalLeads += item.totalLeads;
            totalOfflineData.activeLeads += item.activeLeads;
            totalOfflineData.neutralLeads += item.neutralLeads;
            totalOfflineData.didNotPickLeads += item.didNotPickLeads;
            totalOfflineData.others += item.others;
            totalOfflineData.footFall += item.footFall;
            totalOfflineData.totalAdmissions += item.totalAdmissions;
        } else {
            totalOthersData.totalLeads += item.totalLeads;
            totalOthersData.activeLeads += item.activeLeads;
            totalOthersData.neutralLeads += item.neutralLeads;
            totalOthersData.didNotPickLeads += item.didNotPickLeads;
            totalOthersData.others += item.others;
            totalOthersData.footFall += item.footFall;
            totalOthersData.totalAdmissions += item.totalAdmissions;
        }
    }
    onlineSources.forEach(source => {
        if (!onlineMap[source]) {
            onlineMap[source] = { source, data: createEmptyData() };
        }
    });
    offlineSources.forEach(source => {
        if (!offlineMap[source]) {
            offlineMap[source] = { source, data: createEmptyData() };
        }
    });
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
    // const bulkOps = response.map(item => ({
    //     updateOne: {
    //         filter: { type: item.type },
    //         update: { $set: { type: item.type, details: item.details } },
    //         upsert: true,
    //     },
    // }));

    // await MarketingSourceWiseAnalytics.bulkWrite(bulkOps)
    return formatResponse(res, 200, "Marketing Source Wise Analytics fetched successfully", true, response);
});


export const getMarketingSourceWiseAnalytics = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = await MarketingSourceWiseAnalytics.find({});
    return formatResponse(res, 200, "Marketing Source Wise Analytics fetched successfully", true, data);
});


export const initializeUserWiseAnalytics = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const pipelineId = await createPipeline(PipelineName.INITIALIZE_MARKETING_ANALYTICS);
    if (!pipelineId)
        throw createHttpError(400, "Pipeline creation failed");


    await retryMechanism(
        async (session) => {
            const yesterday = getISTDate(-1);
            const marketingEmployees = await User.find({ roles: UserRoles.EMPLOYEE_MARKETING }, "_id firstName lastName").lean();

            const yesterdayAnalytics = await MarketingUserWiseAnalytics.findOne({ date: yesterday }).lean();
            const yesterdayDataMap: Record<string, { totalFootFall: number; totalAdmissions: number }> = {};

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

            const todayIST = getISTDate();

            await MarketingUserWiseAnalytics.create(
                [{ date: todayIST, data: initializedData }],
                { session }
            );

            return formatResponse(res, 201, "Initialized data", true, null);
        },
        "UserWise Analytics Initialization Failed",
        "Failed to initialize user-wise analytics after multiple attempts.",
        pipelineId,
        PipelineName.INITIALIZE_MARKETING_ANALYTICS
    );
});


export const reiterateLeads = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const pipelineId = await createPipeline(PipelineName.ITERATE_LEADS);
    if (!pipelineId) throw createHttpError(400, "Pipeline creation failed");


    await retryMechanism(
        async (session) => {
            const BATCH_SIZE = 1000; // Tune batch size as per memory limits
            const cursor = LeadMaster.find({}, null, { lean: true }).cursor({ session });
            let bulkOps: any[] = [];
            let updatedCount = 0;

            for await (const lead of cursor) {
                bulkOps.push({
                    updateOne: {
                        filter: { _id: lead._id },
                        update: {
                            $set: {
                                isCalledToday: false,
                                isActiveLead: lead.leadType === LeadType.ACTIVE,
                            },
                        },
                    },
                });

                if (bulkOps.length === BATCH_SIZE) {
                    const bulkWriteResult = await LeadMaster.bulkWrite(bulkOps, { session });
                    updatedCount += bulkWriteResult.modifiedCount;
                    bulkOps = []; // reset for next batch
                }
            }

            // Process any remaining operations
            if (bulkOps.length > 0) {
                const bulkWriteResult = await LeadMaster.bulkWrite(bulkOps, { session });
                updatedCount += bulkWriteResult.modifiedCount;
            }

            return formatResponse(
                res,
                200,
                "Reiterated the Lead Master Table",
                true,
                updatedCount
            );

        },
        "Lead Reiteration Failed",
        "Failed to reiterate lead statuses after multiple attempts.",
        pipelineId,
        PipelineName.ITERATE_LEADS
    );
});



export const getMarketingUserWiseAnalytics = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const startIST = getISTDate(0);

    const todayAnalytics = await MarketingUserWiseAnalytics.findOne({
        date: startIST
    });
    return formatResponse(res, 200, "Marketing user wise analytics fetched successfully", true, todayAnalytics);
});

export const getUserDailyAnalytics = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const startIST = getISTDate(0);
    const todayAnalytics = await MarketingUserWiseAnalytics.findOne({
        date: startIST,
    });
    const userAnalytics = todayAnalytics?.data.find(item => item.userId.toString() === req.data?.id);
    if (!userAnalytics)
        throw createHttpError(404, "User daily analytics not found");
    return formatResponse(res, 200, "User daily analytics fetched successfully", true, userAnalytics);
});


export const getDurationBasedUserAnalytics = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { startDate, endDate } = req.body;

    const mongoStartDate = convertToMongoDate(startDate);
    const mongoEndDate = convertToMongoDate(endDate);

    const pipeline: any[] = [
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

    const result = await MarketingUserWiseAnalytics.aggregate(pipeline);
    return formatResponse(res, 200, "User Wise Analytics Fetched successfully", true, result);
})
