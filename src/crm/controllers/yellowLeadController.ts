import { Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { yellowLeadSchema, IYellowLead, YellowLeadFilter } from '../validators/yellowLead';
import { FilterQuery } from 'mongoose';
import { YellowLead } from '../models/yellowLead';
import { FinalConversionType } from '../../config/constants';
import logger from '../../config/logger';
import createHttpError from 'http-errors';
import { convertToDDMMYYYY, convertToMongoDate } from '../utils/convertDateToFormatedDate';

// TODO: convert this to internal call function
export const createYellowLead = expressAsyncHandler(async (req: Request, res: Response) => {
  const leadData: IYellowLead = req.body;

  leadData.leadTypeChangeDate = convertToMongoDate(leadData.leadTypeChangeDate);
  leadData.nextCallDate = convertToMongoDate(leadData.nextCallDate);

  const validation = yellowLeadSchema.safeParse(leadData);
  if (!validation.success) {
    throw createHttpError(400, { error: validation.error.errors[0] });
  }

  const newYellowLead = await YellowLead.create(leadData);

  const responseData = {
    ...newYellowLead.toObject(),
    leadTypeChangeDate: convertToDDMMYYYY(newYellowLead.leadTypeChangeDate as Date),
    nextCallDate: convertToDDMMYYYY(newYellowLead.nextCallDate as Date)
  };

  res.status(201).json({
    message: 'Yellow lead created successfully.',
    data: responseData
  });
});
// TODO: remove global try/catch
export const updateYellowLead = expressAsyncHandler(async (req: Request, res: Response) => {
  const { _id } = req.body;
  const updateData: Partial<IYellowLead> = req.body;

  updateData.leadTypeChangeDate = convertToMongoDate(updateData.leadTypeChangeDate as string);
  updateData.nextCallDate = convertToMongoDate(updateData.nextCallDate as string);

  const validation = yellowLeadSchema.partial().safeParse(updateData);
  if (!validation.success) {
    throw createHttpError(400, { error: validation.error.errors[0] });
  }

  const updatedYellowLead = await YellowLead.findByIdAndUpdate(_id, updateData, { new: true });

  if (!updatedYellowLead) {
    throw createHttpError(404, 'Yellow lead not found.');
  }

  const responseData = {
    ...updatedYellowLead.toObject(),
    leadTypeChangeDate: convertToDDMMYYYY(updatedYellowLead.leadTypeChangeDate as Date),
    nextCallDate: convertToDDMMYYYY(updatedYellowLead.nextCallDate as Date)
  };

  res.status(200).json({
    message: 'Yellow lead updated successfully.',
    data: responseData
  });
});

// TODO: array will be here for course,location,assigednTO,finalConversionType
export const getFilteredYellowLeads = expressAsyncHandler(async (req: Request, res: Response) => {
  const {
    leadTypeChangeDateStart,
    leadTypeChangeDateEnd,
    finalConversionType,
    course,
    location,
    assignedTo,
    page = 1,
    limit = 10
  } = req.query;

  const filter: FilterQuery<YellowLeadFilter> = {};

  if (finalConversionType) {
    const finalConversionTypes = Array.isArray(finalConversionType)
      ? finalConversionType
      : [finalConversionType];
    filter.finalConversion = { $in: finalConversionTypes as FinalConversionType[] };
  }

  if (course) {
    const courses = Array.isArray(course) ? course : [course];
    filter.course = { $in: courses };
  }

  if (location) {
    const locations = Array.isArray(location) ? location : [location];
    filter.location = { $in: locations };
  }

  if (assignedTo) {
    const assignedTos = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
    filter.assignedTo = { $in: assignedTos };
  }

  if (leadTypeChangeDateStart && leadTypeChangeDateEnd) {
    filter.leadTypeChangeDate = {
      $gte: convertToMongoDate(leadTypeChangeDateStart as string),
      $lte: convertToMongoDate(leadTypeChangeDateEnd as string)
    };
  } else {
    const today = new Date();
    const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    filter.leadTypeChangeDate = {
      $gte: oneMonthAgo,
      $lte: today
    };
  }

  const pageNumber = parseInt(page as string, 10);
  const limitNumber = parseInt(limit as string, 10);
  const skip = (pageNumber - 1) * limitNumber;

  const [leads, totalLeads] = await Promise.all([
    YellowLead.find(filter).skip(skip).limit(limitNumber),
    YellowLead.countDocuments(filter)
  ]);

  const formattedLeads = leads.map((lead) => ({
    ...lead.toObject(),
    leadTypeChangeDate: convertToDDMMYYYY(lead.leadTypeChangeDate as Date),
    nextCallDate: convertToDDMMYYYY(lead.nextCallDate as Date)
  }));

  res.status(200).json({
    message: 'Filtered yellow leads fetched successfully.',
    data: {
      leads: formattedLeads,
      totalLeads,
      totalPages: Math.ceil(totalLeads / limitNumber),
      currentPage: pageNumber
    }
  });
});

export const getYellowLeadsAnalytics = expressAsyncHandler(async (req: Request, res: Response) => {
  const {
    leadTypeChangeDateStart,
    leadTypeChangeDateEnd,
    finalConversionType,
    course,
    location,
    assignedTo
  } = req.query;

  const filter: FilterQuery<YellowLeadFilter> = {};

  if (finalConversionType) {
    const finalConversionTypes = Array.isArray(finalConversionType)
      ? finalConversionType
      : [finalConversionType];
    filter.finalConversion = { $in: finalConversionTypes as FinalConversionType[] };
  }

  if (course) {
    const courses = Array.isArray(course) ? course : [course];
    filter.course = { $in: courses };
  }

  if (location) {
    const locations = Array.isArray(location) ? location : [location];
    filter.location = { $in: locations };
  }

  if (assignedTo) {
    const assignedTos = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
    filter.assignedTo = { $in: assignedTos };
  }

  if (leadTypeChangeDateStart && leadTypeChangeDateEnd) {
    filter.leadTypeChangeDate = {
      $gte: convertToMongoDate(leadTypeChangeDateStart as string),
      $lte: convertToMongoDate(leadTypeChangeDateEnd as string)
    };
  } else {
    const today = new Date();
    const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    filter.leadTypeChangeDate = {
      $gte: oneMonthAgo,
      $lte: today
    };
  }

  const analytics = await YellowLead.aggregate([
    { $match: filter },
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
