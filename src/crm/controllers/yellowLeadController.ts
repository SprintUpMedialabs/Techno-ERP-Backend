import { Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import createHttpError from 'http-errors';
import { AuthenticatedRequest } from '../../auth/validators/authenticatedRequest';
import { FinalConversionType, LeadType } from '../../config/constants';
import { parseFilter } from '../helpers/parseFilter';
import { formatResponse } from '../../utils/formatResponse';
import { LeadMaster } from '../models/lead';
import { IYellowLeadUpdate, yellowLeadUpdateSchema } from '../validators/leads';

export const updateYellowLead = expressAsyncHandler(async (req: Request, res: Response) => {
  const updateData: IYellowLeadUpdate = req.body;

  const validation = yellowLeadUpdateSchema.safeParse(updateData);
  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  const updatedYellowLead = await LeadMaster.findByIdAndUpdate(updateData._id, updateData, {
    new: true,
    runValidators: true
  });

  if (!updatedYellowLead) {
    throw createHttpError(404, 'Yellow lead not found.');
  }

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
          $sum: { $cond: [{ $eq: ['$campusVisit', true] }, 1, 0] }
        },
        activeYellowLeadsCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ['$finalConversion', FinalConversionType.DEAD] },
                  { $ne: ['$finalConversion', FinalConversionType.CONVERTED] }
                ]
              },
              1,
              0
            ]
          }
        },
        deadLeadCount: {
          $sum: { $cond: [{ $eq: ['$finalConversion', FinalConversionType.DEAD] }, 1, 0] }
        },
        convertedLeadCount: {
          $sum: { $cond: [{ $eq: ['$finalConversion', FinalConversionType.CONVERTED] }, 1, 0] }
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
        convertedLeadCount : 1
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
        convertedLeadCount : 0
      };

  return formatResponse(res, 200, 'Yellow leads analytics fetched successfully', true, result);
});
