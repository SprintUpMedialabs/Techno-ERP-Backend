import { Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import createHttpError from 'http-errors';
import { AuthenticatedRequest } from '../../auth/validators/authenticatedRequest';
import { DropDownType, FinalConversionType, LeadType, RequestAction } from '../../config/constants';
import { parseFilter } from '../helpers/parseFilter';
import { formatResponse } from '../../utils/formatResponse';
import { LeadMaster } from '../models/lead';
import { IYellowLeadUpdate, yellowLeadUpdateSchema } from '../validators/leads';
import axiosInstance from '../../api/axiosInstance';
import { Endpoints } from '../../api/endPoints';
import { safeAxiosPost } from '../../api/safeAxios';
import { updateOnlyOneValueInDropDown } from '../../utilityModules/dropdown/dropDownMetadataController';

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

  // If the campus visit is changed to yes, then the final conversion is set to unconfirmed
  if (isCampusVisitChangedToYes) {
    updateData.finalConversion = FinalConversionType.UNCONFIRMED;
  }

  // If the campus visit is changed to no, then the final conversion can not be changed.
  if (isCampusVisitChangedToNo) {
    updateData.finalConversion = FinalConversionType.NO_FOOTFALL;
  }

  // If the campus visit is no, then the final conversion can not be changed.
  if ((updateData.footFall ?? existingLead.footFall) === false) {
    if (updateData.finalConversion !== FinalConversionType.NO_FOOTFALL) {
      throw createHttpError(400, 'Final conversion can not be changed if campus visit is no.');
    }
  } else if (updateData.finalConversion === FinalConversionType.NO_FOOTFALL) {
    // if footfall is yes, then final conversion can not be no footfall.
    throw createHttpError(400, 'Final conversion can not be no footfall if campus visit is yes.');
  }

  const updatedYellowLead = await LeadMaster.findByIdAndUpdate(updateData._id, updateData, {
    new: true,
    runValidators: true
  });

  updateOnlyOneValueInDropDown(DropDownType.FIX_CITY, updatedYellowLead?.city);
  updateOnlyOneValueInDropDown(DropDownType.CITY, updatedYellowLead?.city);
  updateOnlyOneValueInDropDown(DropDownType.FIX_COURSE, updatedYellowLead?.course);
  updateOnlyOneValueInDropDown(DropDownType.COURSE, updatedYellowLead?.course);

  if (!updatedYellowLead) {
    throw createHttpError(404, 'Yellow lead not found.');
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

    query.leadType = LeadType.INTERESTED;

    if (search.trim()) {
      query.$and = [
        ...(query.$and || []), // Preserve existing AND conditions if any
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

  query.leadType = LeadType.INTERESTED;

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
          $sum: { $cond: [{ $eq: ['$finalConversion', FinalConversionType.DEAD] }, 1, 0] }
        },
        admissions: {
          $sum: { $cond: [{ $eq: ['$finalConversion', FinalConversionType.CONVERTED] }, 1, 0] }
        },
        unconfirmed: {
          $sum: { $cond: [{ $eq: ['$finalConversion', FinalConversionType.UNCONFIRMED] }, 1, 0] }
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
        unconfirmed: 1
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
        unconfirmed: 0
      };

  return formatResponse(res, 200, 'Yellow leads analytics fetched successfully', true, result);
});
