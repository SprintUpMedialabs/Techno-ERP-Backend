import { Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import {
  yellowLeadSchema,
  IYellowLead,
  IYellowLeadUpdate,
  yellowLeadUpdateSchema
} from '../validators/yellowLead';
import { YellowLead } from '../models/yellowLead';
import { FinalConversionType, Gender } from '../../config/constants';
import logger from '../../config/logger';
import createHttpError from 'http-errors';
import { convertToDDMMYYYY, convertToMongoDate } from '../../utils/convertDateToFormatedDate';
import { parseFilter } from '../helpers/parseFilter';
import { ILead } from '../validators/leads';
import { AuthenticatedRequest } from '../../auth/validators/authenticatedRequest';

export const createYellowLead = async (leadData: ILead) => {
  const yellowLead: IYellowLead = {
    date: leadData.date,
    name: leadData.name,
    phoneNumber: leadData.phoneNumber,
    email: leadData.email ?? '',
    gender: leadData.gender,
    campusVisit: false,
    assignedTo: leadData.assignedTo,
    ltcDate: new Date()
  };

  if (leadData.nextDueDate && convertToMongoDate(leadData.nextDueDate) > new Date()) {
    yellowLead.nextDueDate = convertToMongoDate(leadData.nextDueDate);
  } else {
    yellowLead.nextDueDate = undefined;
  }

  const validation = yellowLeadSchema.safeParse(yellowLead);
  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  await YellowLead.create(yellowLead);

  logger.info('Yellow lead object created successfully');
};

export const updateYellowLead = expressAsyncHandler(async (req: Request, res: Response) => {
  const { _id } = req.body;
  // IYellow
  // sql injection
  //

  const updateData: IYellowLeadUpdate = req.body;

  const validation = yellowLeadUpdateSchema.safeParse(updateData);
  if (!validation.success) {
    throw createHttpError(400, validation.error.errors.map((error) => error.message).join(', '));
  }

  const updatedYellowLead = await YellowLead.findByIdAndUpdate(_id, updateData, {
    new: true,
    runValidators: true
  });

  if (!updatedYellowLead) {
    throw createHttpError(404, 'Yellow lead not found.');
  }

  const responseData = {
    ...updatedYellowLead.toJSON(),
    leadTypeChangeDate: updatedYellowLead.toJSON().date
  };

  res.status(200).json({
    message: 'Yellow lead updated successfully.',
    data: responseData
  });
});

export const getFilteredYellowLeads = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { query, search, page, limit, sort } = parseFilter(req);

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

    let leadsQuery = YellowLead.find(query);

    if (Object.keys(sort).length > 0) {
      console.log('Sort is : ', sort);
      leadsQuery = leadsQuery.sort(sort);
    }

    const yellowLeads = await leadsQuery.skip(skip).limit(limit);

    const totalLeads = await YellowLead.countDocuments(query);

    res.status(200).json({
      yellowLeads,
      total: totalLeads,
      totalPages: Math.ceil(totalLeads / limit),
      currentPage: page
    });
  }
);

export const getYellowLeadsAnalytics = expressAsyncHandler(async (req: Request, res: Response) => {
  const { query } = parseFilter(req);

  const analytics = await YellowLead.aggregate([
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
                  { $ne: ['$finalConversion', FinalConversionType.RED] },
                  { $ne: ['$finalConversion', FinalConversionType.GREEN] }
                ]
              },
              1,
              0
            ]
          }
        },
        deadLeadCount: {
          $sum: { $cond: [{ $eq: ['$finalConversion', FinalConversionType.RED] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        _id: 0,
        allLeadsCount: 1,
        campusVisitTrueCount: 1,
        activeYellowLeadsCount: 1,
        deadLeadCount: 1
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
          deadLeadCount: 0
        };

  res.status(200).json({
    message: 'Yellow leads analytics fetched successfully.',
    data: result
  });
});
