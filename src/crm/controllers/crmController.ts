import { Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import createHttpError from 'http-errors';
import axiosInstance from '../../api/axiosInstance';
import { Endpoints } from '../../api/endPoints';
import { safeAxiosPost } from '../../api/safeAxios';
import { AuthenticatedRequest } from '../../auth/validators/authenticatedRequest';
import { DropDownType, LeadType, RequestAction } from '../../config/constants';
import { formatResponse } from '../../utils/formatResponse';
import { readFromGoogleSheet } from '../helpers/googleSheetOperations';
import { parseFilter } from '../helpers/parseFilter';
import { saveDataToDb } from '../helpers/updateAndSaveToDb';
import { LeadMaster } from '../models/lead';
import { IUpdateLeadRequestSchema, updateLeadRequestSchema } from '../validators/leads';
import { updateOnlyOneValueInDropDown } from '../../utilityModules/dropdown/dropDownMetadataController';

export const uploadData = expressAsyncHandler(async (_: AuthenticatedRequest, res: Response) => {
  const latestData = await readFromGoogleSheet();
  if (!latestData) {
    return formatResponse(res, 200, 'There is no data to update.', true);
  } else {
    await saveDataToDb(latestData.RowData, latestData.LastSavedIndex);
    return formatResponse(res, 200, 'Data updated in Database!', true);
  }
});

export const getFilteredLeadData = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { query, search, page, limit, sort } = parseFilter(req);

    if (search.trim()) {
      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { phoneNumber: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    const skip = (page - 1) * limit;

    let leadsQuery = LeadMaster.find(query);

    if (Object.keys(sort).length > 0) {
      leadsQuery = leadsQuery.sort(sort);
    }

    const [leads, totalLeads] = await Promise.all([
      leadsQuery.skip(skip).limit(limit),
      LeadMaster.countDocuments(query),
    ]);

    return formatResponse(res, 200, 'Filtered leads fetched successfully', true, {
      leads,
      total: totalLeads,
      totalPages: Math.ceil(totalLeads / limit),
      currentPage: page
    });
  }
);

export const getAllLeadAnalytics = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { query } = parseFilter(req);
    // 🔹 Running Aggregate Pipeline
    const analytics = await LeadMaster.aggregate([
      { $match: query }, // Apply Filters

      {
        $group: {
          _id: null,
          totalLeads: { $sum: 1 }, // Count total leads
          openLeads: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.OPEN] }, 1, 0] } }, // Count OPEN leads
          interestedLeads: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.INTERESTED] }, 1, 0] } }, // Count INTERESTED leads
          notInterestedLeads: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.DEAD] }, 1, 0] } }, // Count NOT_INTERESTED leads,
          neutralLeads: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.NO_CLARITY] }, 1, 0] } }
        }
      }
    ]);

    return formatResponse(res, 200, 'Lead analytics fetched successfully', true, {
      totalLeads: analytics[0]?.totalLeads ?? 0,
      openLeads: analytics[0]?.openLeads ?? 0,
      interestedLeads: analytics[0]?.interestedLeads ?? 0,
      notInterestedLeads: analytics[0]?.notInterestedLeads ?? 0,
      neutralLeads: analytics[0]?.neutralLeads ?? 0
    });
  }
);

export const updateData = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const leadRequestData: IUpdateLeadRequestSchema = req.body;

  const validation = updateLeadRequestSchema.safeParse(leadRequestData);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  const existingLead = await LeadMaster.findById(leadRequestData._id);

  if (existingLead) {
    // if (existingLead.leadType === LeadType.INTERESTED) {
    //   throw createHttpError(
    //     400,
    //     'Sorry, this lead can only be updated from the yellow leads tracker!'
    //   );
    // }

    let leadTypeModifiedDate = existingLead.leadTypeModifiedDate;

    if (leadRequestData.leadType && existingLead.leadType != leadRequestData.leadType) {
      leadTypeModifiedDate = new Date();
    }

    const updatedData = await LeadMaster.findByIdAndUpdate(
      existingLead._id,
      { ...leadRequestData, leadTypeModifiedDate },
      {
        new: true,
        runValidators: true
      }
    );

    updateOnlyOneValueInDropDown(DropDownType.FIX_CITY, updatedData?.city);
    updateOnlyOneValueInDropDown(DropDownType.CITY, updatedData?.city);
    updateOnlyOneValueInDropDown(DropDownType.FIX_COURSE, updatedData?.course);
    updateOnlyOneValueInDropDown(DropDownType.COURSE, updatedData?.course);


    safeAxiosPost(axiosInstance, `${Endpoints.AuditLogService.MARKETING.SAVE_LEAD}`, {
      documentId: updatedData?._id,
      action: RequestAction.POST,
      payload: updatedData,
      performedBy: req.data?.id,
      restEndpoint: '/api/edit/crm',
    });

    return formatResponse(res, 200, 'Data Updated Successfully!', true, updatedData);
  }
  else {
    throw createHttpError(404, 'Lead does not found with the given ID.');
  }
});
