import { Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import createHttpError from 'http-errors';
import axiosInstance from '../../api/axiosInstance';
import { Endpoints } from '../../api/endPoints';
import { safeAxiosPost } from '../../api/safeAxios';
import { getCurrentLoggedInUser } from '../../auth/utils/getCurrentLoggedInUser';
import { AuthenticatedRequest } from '../../auth/validators/authenticatedRequest';
import { Actions, DropDownType, FinalConversionType, LeadType, RequestAction } from '../../config/constants';
import { updateOnlyOneValueInDropDown } from '../../utilityModules/dropdown/dropDownMetadataController';
import { formatResponse } from '../../utils/formatResponse';
import { parseFilter } from '../helpers/parseFilter';
import { LeadMaster } from '../models/lead';
import { IYellowLeadUpdate, yellowLeadUpdateSchema } from '../validators/leads';
import { logFollowUpChange } from './crmController';
import { MarketingUserWiseAnalytics } from '../models/marketingUserWiseAnalytics';
import { getISTDate } from '../../utils/getISTDate';

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

  let existingRemark = existingLead?.remarks?.length;
  let yellowLeadRequestDataRemark = updateData.remarks?.length;

  let existingFollowUpCount = existingLead.followUpCount;
  let yellowLeadRequestDataFollowUpCount = updateData.followUpCount;

  const isRemarkChanged = existingRemark !== yellowLeadRequestDataRemark;
  const isFollowUpCountChanged = existingFollowUpCount !== yellowLeadRequestDataFollowUpCount;

  if (isRemarkChanged && !isFollowUpCountChanged) {
    updateData.followUpCount = existingLead.followUpCount + 1;
  }

  const updatedYellowLead = await LeadMaster.findByIdAndUpdate(updateData._id, updateData, {
    new: true,
    runValidators: true
  });

  const currentLoggedInUser = getCurrentLoggedInUser(req);

  const updatedFollowUpCount = updatedYellowLead?.followUpCount ?? 0;


  if (updatedFollowUpCount > existingFollowUpCount) {
    logFollowUpChange(existingLead._id, currentLoggedInUser, Actions.INCREAMENT)
  }
  else if (updatedFollowUpCount < existingFollowUpCount) {
    logFollowUpChange(existingLead._id, currentLoggedInUser, Actions.DECREAMENT)
  }


  updateOnlyOneValueInDropDown(DropDownType.FIX_MARKETING_CITY, updatedYellowLead?.city);
  updateOnlyOneValueInDropDown(DropDownType.MARKETING_CITY, updatedYellowLead?.city);
  updateOnlyOneValueInDropDown(DropDownType.FIX_MARKETING_COURSE_CODE, updatedYellowLead?.course);
  updateOnlyOneValueInDropDown(DropDownType.MARKETING_COURSE_CODE, updatedYellowLead?.course);

  if (!updatedYellowLead) {
    throw createHttpError(404, 'Yellow lead not found.');
  }

  if (isCampusVisitChangedToYes || isFinalConversionChangedToAdmission) {
    const todayStart = getISTDate();

    const analyticsDoc = await MarketingUserWiseAnalytics.findOne({
      date: { $gte: todayStart },
      data: {
        $elemMatch: {
          userId: currentLoggedInUser
        }
      }
    });

    if (!analyticsDoc) {
      throw createHttpError(404, 'Marketing analytics not found for user.');
    }

    const updatedDataArray = analyticsDoc.data.map(entry => {
      if (entry.userId.toString() === currentLoggedInUser) {
        if (isCampusVisitChangedToYes) {
          entry.totalFootFall = (entry.totalFootFall ?? 0) + 1;
        }
        if (isFinalConversionChangedToAdmission) {
          entry.totalAdmissions = (entry.totalAdmissions ?? 0) + 1;
        }
      }
      return entry;
    });

    analyticsDoc.data = updatedDataArray;
    await analyticsDoc.save();
  }

  safeAxiosPost(axiosInstance, `${Endpoints.AuditLogService.MARKETING.SAVE_LEAD}`, {
    documentId: updatedYellowLead?._id,
    action: RequestAction.POST,
    payload: updatedYellowLead,
    performedBy: req.data?.id,
    restEndpoint: '/api/update-yellow-lead',
  });

  return formatResponse(res, 200, 'Yellow lead updated successfully', true, updatedYellowLead);
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
            { phoneNumber: { $regex: search, $options: 'i' } }
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
