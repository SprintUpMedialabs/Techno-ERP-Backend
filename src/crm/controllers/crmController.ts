import { Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import createHttpError from 'http-errors';
import { AuthenticatedRequest } from '../../auth/validators/authenticatedRequest';
import { LeadType, UserRoles } from '../../config/constants';
import { convertToMongoDate } from '../../utils/convertDateToFormatedDate';
import { readFromGoogleSheet } from '../helpers/googleSheetOperations';
import { saveDataToDb } from '../helpers/updateAndSaveToDb';
import { Lead } from '../models/leads';
import { IAllLeadFilter } from '../types/marketingSpreadsheet';
import { IUpdateLeadRequestSchema, updateLeadRequestSchema } from '../validators/leads';

export const uploadData = expressAsyncHandler(async (_: AuthenticatedRequest, res: Response) => {
  const latestData = await readFromGoogleSheet(); // TODO: here there are few things inside this function which we need to take care
  if (!latestData) {
    res.status(200).json({ message: 'There is no data to update :)' });
  } else {

    await saveDataToDb(latestData);
    res.status(200).json({ message: 'Data updated in database' });
  }
});

export const getFilteredLeadData = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const {
      leadTypeChangeDateStart,
      leadTypeChangeDateEnd,
      leadType = [],
      course = [],
      location = [],
      assignedTo = [],
      page = 1,
      limit = 10,
      search = ''
    } = req.body;

    const filters: IAllLeadFilter = {
      leadTypeChangeDateStart,
      leadTypeChangeDateEnd,
      leadType,
      course,
      location,
      assignedTo
    };
    const query: any = {};

    if (filters.leadType.length > 0) {
      query.leadType = { $in: filters.leadType };
    }

    if (filters.course.length > 0) {
      query.course = { $in: filters.course };
    }

    if (filters.location.length > 0) {
      query.location = { $in: filters.location };
    }

    if (filters.assignedTo.length > 0) {
      if (
        req.data?.roles.includes(UserRoles.EMPLOYEE_MARKETING) &&
        !req.data?.roles.includes(UserRoles.LEAD_MARKETING)
      ) {
        filters.assignedTo = [req.data.id];
      }
      query.assignedTo = { $in: filters.assignedTo };
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

    // Fetch Leads from Database
    const leads = await Lead.find(query).skip(skip).limit(limit).lean();

    const totalLeads = await Lead.countDocuments(query);

    res.status(200).json({
      leads,
      total: totalLeads,
      totalPages: Math.ceil(totalLeads / limit),
      currentPage: page
    });
  }
);

export const getAllLeadAnalytics = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const {
      leadTypeChangeDateStart,
      leadTypeChangeDateEnd,
      leadType = [],
      course = [],
      location = [],
      assignedTo = []
    } = req.body;

    const filters: IAllLeadFilter = {
      leadTypeChangeDateStart,
      leadTypeChangeDateEnd,
      leadType,
      course,
      location,
      assignedTo
    };
    const query: any = {};

    if (filters.leadType.length > 0) {
      query.leadType = { $in: filters.leadType };
    }

    if (filters.course.length > 0) {
      query.course = { $in: filters.course };
    }

    if (filters.location.length > 0) {
      query.location = { $in: filters.location };
    }

    if (filters.assignedTo.length > 0) {
      if (
        req.data?.roles.includes(UserRoles.EMPLOYEE_MARKETING) &&
        !req.data?.roles.includes(UserRoles.LEAD_MARKETING)
      ) {
        filters.assignedTo = [req.data.id];
      }
      query.assignedTo = { $in: filters.assignedTo };
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

    // 🔹 Running Aggregate Pipeline
    const analytics = await Lead.aggregate([
      { $match: query }, // Apply Filters
      {
        $group: {
          _id: null,
          totalLeads: { $sum: 1 }, // Count total leads
          openLeads: { $sum: { $cond: [{ $eq: ['$leadType', 'OPEN'] }, 1, 0] } }, // Count OPEN leads
          interestedLeads: { $sum: { $cond: [{ $eq: ['$leadType', 'INTERESTED'] }, 1, 0] } }, // Count INTERESTED leads
          notInterestedLeads: { $sum: { $cond: [{ $eq: ['$leadType', 'NOT_INTERESTED'] }, 1, 0] } } // Count NOT_INTERESTED leads
        }
      }
    ]);

    res.status(200).json({
      totalLeads: analytics[0]?.totalLeads ?? 0,
      openLeads: analytics[0]?.openLeads ?? 0,
      interestedLeads: analytics[0]?.interestedLeads ?? 0,
      notInterestedLeads: analytics[0]?.notInterestedLeads ?? 0
    });
  }
);

// TODO: remain to test
export const updateData = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const leadRequestData: IUpdateLeadRequestSchema = req.body;

  const validation = updateLeadRequestSchema.safeParse(leadRequestData);
  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  const existingLead = await Lead.findById(leadRequestData._id);

  if (existingLead) {
    let updatedLeadData: IUpdateLeadRequestSchema = {
      email: leadRequestData.email ?? existingLead.email,
      phoneNumber: leadRequestData.phoneNumber ?? existingLead.phoneNumber,
      name: leadRequestData.name ?? existingLead.name,
      gender: leadRequestData.gender ?? existingLead.gender,
      altPhoneNumber: leadRequestData.altPhoneNumber ?? existingLead.altPhoneNumber,
      leadType: existingLead.leadType,
      location: leadRequestData.location ?? existingLead.location,
      course: leadRequestData.course ?? existingLead.course,
      remarks: leadRequestData.remarks ?? existingLead.remarks,
      nextDueDate: leadRequestData.nextDueDate ?? existingLead.nextDueDate
    };

    // nextDueDate is there than format it in Date
    updatedLeadData?.nextDueDate && (updatedLeadData.nextDueDate = convertToMongoDate(updatedLeadData.nextDueDate));

    if (existingLead.leadType != leadRequestData.leadType) {
      if (existingLead.leadType === LeadType.YELLOW) {
        throw createHttpError(
          400,
          'Sorry, this lead can only be updated from the yellow leads tracker!'
        );
      } else {
        updatedLeadData.leadType = leadRequestData.leadType;
        updatedLeadData.leadTypeModifiedDate = new Date();
      }
    } else {
      // leadTypeModifiedDate is there than format it in Date
      existingLead.leadTypeModifiedDate &&
        (updatedLeadData.leadTypeModifiedDate = convertToMongoDate(existingLead.leadTypeModifiedDate!));
    }

    const updatedData = await Lead.findByIdAndUpdate(existingLead._id, updatedLeadData, {
      new: true,
      runValidators: true
    }).lean();
    res.status(200).json({ message: 'Data Updated Successfully!', updatedData });
  } else {
    throw createHttpError(404, 'Lead does not found with the given ID.');
  }
});
