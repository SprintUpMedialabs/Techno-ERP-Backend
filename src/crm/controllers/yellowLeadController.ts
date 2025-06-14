import { Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import createHttpError from 'http-errors';
import axiosInstance from '../../api/axiosInstance';
import { Endpoints } from '../../api/endPoints';
import { safeAxiosPost } from '../../api/safeAxios';
import { getCurrentLoggedInUser } from '../../auth/utils/getCurrentLoggedInUser';
import { AuthenticatedRequest } from '../../auth/validators/authenticatedRequest';
import { DropDownType, FinalConversionType, LeadType, RequestAction } from '../../config/constants';
import { updateOnlyOneValueInDropDown } from '../../utilityModules/dropdown/dropDownMetadataController';
import { formatResponse } from '../../utils/formatResponse';
import { getISTDate, getISTDateWithTime } from '../../utils/getISTDate';
import { parseFilter } from '../helpers/parseFilter';
import { LeadMaster } from '../models/lead';
import { MarketingUserWiseAnalytics } from '../models/marketingUserWiseAnalytics';
import { IYellowLeadUpdate, yellowLeadUpdateSchema } from '../validators/leads';
import mongoose from 'mongoose';
import { SQS_MARKETING_ANALYTICS_QUEUE_URL } from '../../secrets';
import { sendMessageToQueue } from '../../sqs/sqsProducer';

export const updateYellowLead = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const updateData: IYellowLeadUpdate = req.body;

  const validation = yellowLeadUpdateSchema.safeParse(updateData);
  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  const existingLead = await LeadMaster.findById(updateData._id);
  if (!existingLead) {
    throw createHttpError(404, 'Yellow lead not found.');
  }
  const isCampusVisitChangedToYes = updateData.footFall === true && existingLead.footFall !== true;
  const isCampusVisitChangedToNo = updateData.footFall === false && existingLead.footFall !== false;
  const isFinalConversionChangedToAdmission = updateData.finalConversion === FinalConversionType.ADMISSION &&
    existingLead.finalConversion !== FinalConversionType.ADMISSION;
  const isFinalConversionChangedFromAdmission =
    updateData.finalConversion !== FinalConversionType.ADMISSION &&
    existingLead.finalConversion === FinalConversionType.ADMISSION;


  // If the campus visit is changed to yes, then the final conversion is set to unconfirmed
  if (isCampusVisitChangedToYes) {
    updateData.finalConversion = FinalConversionType.NEUTRAL;
  }

  // If the campus visit is changed to no, then the final conversion can not be changed.
  if (isCampusVisitChangedToNo) {
    updateData.finalConversion = FinalConversionType.NO_FOOTFALL;
  }

  // If the campus visit is no, then the final conversion can not be changed.
  if ((updateData.footFall ?? existingLead.footFall) === false) {
    const allowedConversions = [FinalConversionType.NOT_INTERESTED, FinalConversionType.NO_FOOTFALL, FinalConversionType.NEUTRAL];
    if (updateData.finalConversion && !allowedConversions.includes(updateData.finalConversion)) {
      throw createHttpError(400, 'If campus visit is no, then final conversion can not be ' + updateData.finalConversion + '.');
    }
  } else if (updateData.finalConversion === FinalConversionType.NO_FOOTFALL) {
    // if footfall is yes, then final conversion can not be no footfall.
    throw createHttpError(400, 'Final conversion can not be no footfall if campus visit is yes.');
  }

  let existingRemarkLength = existingLead?.remarks?.length || 0;
  let yellowLeadRequestDataRemarkLength = updateData.remarks?.length || 0;


  const isRemarkChanged = existingRemarkLength < yellowLeadRequestDataRemarkLength ;

  if (isRemarkChanged) {
    updateData.followUpCount = existingLead.followUpCount + 1;
    updateData.remarkUpdatedAt = getISTDateWithTime();
  }

  const currentLoggedInUser = req.data?.id;
  const todayStart = getISTDate();

  const userAnalyticsDoc = await MarketingUserWiseAnalytics.findOne({
    date: todayStart,
    data: { $elemMatch: { userId: currentLoggedInUser } },
  });

  if (!userAnalyticsDoc)
    throw createHttpError(404, 'User analytics not found.');

  const userIndex = userAnalyticsDoc.data.findIndex((entry) =>
    entry.userId.toString() === currentLoggedInUser?.toString()
  );

  if (userIndex === -1) {
    throw createHttpError(404, 'User not found in analytics data.');
  }

  if (isRemarkChanged && !existingLead?.isCalledToday) {
    userAnalyticsDoc.data[userIndex].totalCalls += 1;

    if (existingLead?.isActiveLead) {
      userAnalyticsDoc.data[userIndex].activeLeadCalls += 1;
    } else {
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

  const session = await mongoose.startSession();
  session.startTransaction();

  try {

    await userAnalyticsDoc.save({ session });


    const updatedYellowLead = await LeadMaster.findByIdAndUpdate(updateData._id, updateData, {
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


    updateOnlyOneValueInDropDown(DropDownType.FIX_MARKETING_CITY, updatedYellowLead?.city);
    updateOnlyOneValueInDropDown(DropDownType.MARKETING_CITY, updatedYellowLead?.city);
    updateOnlyOneValueInDropDown(DropDownType.FIX_MARKETING_COURSE_CODE, updatedYellowLead?.course);
    updateOnlyOneValueInDropDown(DropDownType.MARKETING_COURSE_CODE, updatedYellowLead?.course);



    safeAxiosPost(axiosInstance, `${Endpoints.AuditLogService.MARKETING.SAVE_LEAD}`, {
      documentId: updatedYellowLead?._id,
      action: RequestAction.POST,
      payload: updatedYellowLead,
      performedBy: req.data?.id,
      restEndpoint: '/api/update-yellow-lead',
    });

    await session.commitTransaction();

    return formatResponse(res, 200, 'Yellow lead updated successfully', true, updatedYellowLead);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
});

export const updateYellowLeadV1 = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const updateData: IYellowLeadUpdate = req.body;

  const validation = yellowLeadUpdateSchema.safeParse(updateData);
  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  const existingLead = await LeadMaster.findById(updateData._id);
  if (!existingLead) {
    throw createHttpError(404, 'Yellow lead not found.');
  }
  const isCampusVisitChangedToYes = updateData.footFall === true && existingLead.footFall !== true;
  const isCampusVisitChangedToNo = updateData.footFall === false && existingLead.footFall !== false;
  const isFinalConversionChangedToAdmission = updateData.finalConversion === FinalConversionType.ADMISSION &&
    existingLead.finalConversion !== FinalConversionType.ADMISSION;
  const isFinalConversionChangedFromAdmission =
    updateData.finalConversion !== FinalConversionType.ADMISSION &&
    existingLead.finalConversion === FinalConversionType.ADMISSION;


  // If the campus visit is changed to yes, then the final conversion is set to unconfirmed
  if (isCampusVisitChangedToYes) {
    updateData.finalConversion = FinalConversionType.NEUTRAL;
  }

  // If the campus visit is changed to no, then the final conversion can not be changed.
  if (isCampusVisitChangedToNo) {
    updateData.finalConversion = FinalConversionType.NO_FOOTFALL;
  }

  // If the campus visit is no, then the final conversion can not be changed.
  if ((updateData.footFall ?? existingLead.footFall) === false) {
    const allowedConversions = [FinalConversionType.NOT_INTERESTED, FinalConversionType.NO_FOOTFALL, FinalConversionType.NEUTRAL];
    if (updateData.finalConversion && !allowedConversions.includes(updateData.finalConversion)) {
      throw createHttpError(400, 'If campus visit is no, then final conversion can not be ' + updateData.finalConversion + '.');
    }
  } else if (updateData.finalConversion === FinalConversionType.NO_FOOTFALL) {
    // if footfall is yes, then final conversion can not be no footfall.
    throw createHttpError(400, 'Final conversion can not be no footfall if campus visit is yes.');
  }

  let existingRemarkLength = existingLead?.remarks?.length || 0;
  let yellowLeadRequestDataRemarkLength = updateData.remarks?.length || 0;


  const isRemarkChanged = existingRemarkLength < yellowLeadRequestDataRemarkLength ;

  if (isRemarkChanged) {
    updateData.followUpCount = existingLead.followUpCount + 1;
    updateData.remarkUpdatedAt = getISTDateWithTime();
  }

  const currentLoggedInUser = req.data?.id;
  if (isRemarkChanged && !existingLead?.isCalledToday) {
    updateData.isCalledToday = true;
    sendMessageToQueue(SQS_MARKETING_ANALYTICS_QUEUE_URL, { currentLoggedInUser,isCalledToday:existingLead.isCalledToday,isRemarkChanged,isActiveLead: existingLead.isActiveLead,isFinalConversionChangedToAdmission,isFinalConversionChangedFromAdmission,isCampusVisitChangedToYes,isCampusVisitChangedToNo});
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const updatedYellowLead = await LeadMaster.findByIdAndUpdate(updateData._id, updateData, {
      new: true,
      runValidators: true,
      session
    });

    updateOnlyOneValueInDropDown(DropDownType.FIX_MARKETING_CITY, updatedYellowLead?.city);
    updateOnlyOneValueInDropDown(DropDownType.MARKETING_CITY, updatedYellowLead?.city);
    updateOnlyOneValueInDropDown(DropDownType.FIX_MARKETING_COURSE_CODE, updatedYellowLead?.course);
    updateOnlyOneValueInDropDown(DropDownType.MARKETING_COURSE_CODE, updatedYellowLead?.course);

    safeAxiosPost(axiosInstance, `${Endpoints.AuditLogService.MARKETING.SAVE_LEAD}`, {
      documentId: updatedYellowLead?._id,
      action: RequestAction.POST,
      payload: updatedYellowLead,
      performedBy: req.data?.id,
      restEndpoint: '/api/update-yellow-lead',
    });

    await session.commitTransaction();

    return formatResponse(res, 200, 'Yellow lead updated successfully', true, updatedYellowLead);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
});

export const marketingAnalyticsSQSHandlerYellowLead = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response)=>{
  const {  currentLoggedInUser,isCalledToday,isRemarkChanged, isActiveLead, isFinalConversionChangedToAdmission, isFinalConversionChangedFromAdmission, isCampusVisitChangedToYes, isCampusVisitChangedToNo} = req.body;

  const todayStart = getISTDate();

  const userAnalyticsDoc = await MarketingUserWiseAnalytics.findOne({
    date: todayStart,
    data: { $elemMatch: { userId: currentLoggedInUser } },
  });

  if (!userAnalyticsDoc)
    throw createHttpError(404, 'User analytics not found.');

  const userIndex = userAnalyticsDoc.data.findIndex((entry) =>
    entry.userId.toString() === currentLoggedInUser?.toString()
  );

  if (userIndex === -1) {
    throw createHttpError(404, 'User not found in analytics data.');
  }

  if (isRemarkChanged && !isCalledToday) {
    userAnalyticsDoc.data[userIndex].totalCalls += 1;

    if (isActiveLead) {
      userAnalyticsDoc.data[userIndex].activeLeadCalls += 1;
    } else {
      userAnalyticsDoc.data[userIndex].nonActiveLeadCalls += 1;
    }
    
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

  await userAnalyticsDoc.save();
});

export const getFilteredYellowLeads = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { query, search, page, limit, sort } = parseFilter(req);

    query.leadType = LeadType.ACTIVE;

    if (search.trim()) {
      query.$and = [
        ...(query.$and ?? []), // Preserve existing AND conditions if any
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

    const [yellowLeads, totalLeads] = await Promise.all([
      LeadMaster.find(query).sort(sort).skip(skip).limit(limit),
      LeadMaster.countDocuments(query),
    ]);

    return formatResponse(res, 200, 'Filtered yellow leads fetched successfully', true, {
      yellowLeads,
      total: totalLeads,
      totalPages: Math.ceil(totalLeads / limit),
      currentPage: page
    });
  }
);

export const getYellowLeadsAnalytics = expressAsyncHandler(async (req: Request, res: Response) => {
  const { query } = parseFilter(req);

  query.leadType = LeadType.ACTIVE;

  const analytics = await LeadMaster.aggregate([
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
          $sum: { $cond: [{ $eq: ['$finalConversion', FinalConversionType.NOT_INTERESTED] }, 1, 0] }
        },
        admissions: {
          $sum: { $cond: [{ $eq: ['$finalConversion', FinalConversionType.ADMISSION] }, 1, 0] }
        },
        neutral: {
          $sum: { $cond: [{ $eq: ['$finalConversion', FinalConversionType.NEUTRAL] }, 1, 0] }
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

  const result =
    analytics.length > 0
      ? analytics[0]
      : {
        allLeadsCount: 0,
        campusVisitTrueCount: 0,
        activeYellowLeadsCount: 0,
        deadLeadCount: 0,
        admissions: 0,
        neutral: 0
      };

  return formatResponse(res, 200, 'Yellow leads analytics fetched successfully', true, result);
});

export const getYellowLeadsAnalyticsV1 = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { query } = parseFilter(req);
  query.leadType = LeadType.ACTIVE;

  const analytics = await LeadMaster.aggregate([
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
        allLeadsCount: { $sum: 1 },
        campusVisitTrueCount: {
          $sum: { $cond: [{ $eq: ['$hasFootFall', true] }, 1, 0] }
        },
        activeYellowLeadsCount: {
          $sum: { $cond: [{ $eq: ['$hasFootFall', false] }, 1, 0] }
        },
        deadLeadCount: {
          $sum: { $cond: [{ $eq: ['$representativeFinalConversion', FinalConversionType.NOT_INTERESTED] }, 1, 0] }
        },
        admissions: {
          $sum: { $cond: [{ $eq: ['$representativeFinalConversion', FinalConversionType.ADMISSION] }, 1, 0] }
        },
        neutral: {
          $sum: { $cond: [{ $eq: ['$representativeFinalConversion', FinalConversionType.NEUTRAL] }, 1, 0] }
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

  const result =
    analytics.length > 0
      ? analytics[0]
      : {
          allLeadsCount: 0,
          campusVisitTrueCount: 0,
          activeYellowLeadsCount: 0,
          deadLeadCount: 0,
          admissions: 0,
          neutral: 0
        };

  return formatResponse(res, 200, 'Yellow leads analytics fetched successfully', true, result);
});
