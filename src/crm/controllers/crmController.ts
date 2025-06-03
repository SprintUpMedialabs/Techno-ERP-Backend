import ExcelJS from 'exceljs';
import { Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import createHttpError from 'http-errors';
import moment from 'moment-timezone';
import mongoose from 'mongoose';
import axiosInstance from '../../api/axiosInstance';
import { Endpoints } from '../../api/endPoints';
import { safeAxiosPost } from '../../api/safeAxios';
import { User } from '../../auth/models/user';
import { AuthenticatedRequest } from '../../auth/validators/authenticatedRequest';
import { Actions, DropDownType, LeadType, RequestAction, UserRoles } from '../../config/constants';
import { updateOnlyOneValueInDropDown } from '../../utilityModules/dropdown/dropDownMetadataController';
import { convertToDDMMYYYY } from '../../utils/convertDateToFormatedDate';
import { formatResponse } from '../../utils/formatResponse';
import { getISTDate } from '../../utils/getISTDate';
import { readFromGoogleSheet } from '../helpers/googleSheetOperations';
import { parseFilter } from '../helpers/parseFilter';
import { saveDataToDb } from '../helpers/updateAndSaveToDb';
import { LeadMaster } from '../models/lead';
import { MarketingFollowUpModel } from '../models/marketingFollowUp';
import { MarketingUserWiseAnalytics } from '../models/marketingUserWiseAnalytics';
import { IUpdateLeadRequestSchema, updateLeadRequestSchema } from '../validators/leads';

export const uploadData = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id, name } = req.body;

  if (id && name) {
    const latestData = await readFromGoogleSheet(id, name);
    if (latestData) {
      await saveDataToDb(latestData.rowData, latestData.lastSavedIndex, id, name, latestData.requiredColumnHeaders);
    }
  }
  return formatResponse(res, 200, 'Data updated in Database!', true);

});

export const getAssignedSheets = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await User.findById(req.data?.id);
  const marketingSheet = user?.marketingSheet;
  return formatResponse(res, 200, 'Assigned sheets fetched successfully', true, marketingSheet);
});

// THIS IS JUST TO UPDATE THE SOURCE OF THE LEADS | BE AWARE WHILE USING IT |
export const updateSource = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { currentSource, newSource } = req.body;

  if (!currentSource || !newSource) {
    return res.status(400).json({ message: 'Both currentSource and newSource are required' });
  }

  const result = await LeadMaster.updateMany(
    { source: { $regex: `^${currentSource}$`, $options: 'i' } }, // case-insensitive exact match
    { $set: { source: newSource } }
  );

  return formatResponse(res, 200, 'Source updated successfully', true, {
    message: `Updated ${result.modifiedCount} leads`,
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  });
});

export const getFilteredLeadData = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { query, search, page, limit, sort } = parseFilter(req);

    if (search?.trim()) {
      query.$and = [
        ...(query.$and ?? []),
        {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { phoneNumber: { $regex: search, $options: 'i' } },
            { altPhoneNumber: { $regex: search, $options: 'i' } }
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
          leftOverLeads: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.LEFT_OVER] }, 1, 0] } }, // Count OPEN leads
          didNotPickLeads: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.DID_NOT_PICK] }, 1, 0] } }, // Count OPEN leads
          activeLeads: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.ACTIVE] }, 1, 0] } }, // Count INTERESTED leads
          notInterestedLeads: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.NOT_INTERESTED] }, 1, 0] } }, // Count NOT_INTERESTED leads,
          neutralLeads: { $sum: { $cond: [{ $eq: ['$leadType', LeadType.NEUTRAL] }, 1, 0] } }
        }
      }
    ]);

    return formatResponse(res, 200, 'Lead analytics fetched successfully', true, {
      totalLeads: analytics[0]?.totalLeads ?? 0,
      leftOverLeads: analytics[0]?.leftOverLeads ?? 0,
      didNotPickLeads: analytics[0]?.didNotPickLeads ?? 0,
      activeLeads: analytics[0]?.activeLeads ?? 0,
      notInterestedLeads: analytics[0]?.notInterestedLeads ?? 0,
      neutralLeads: analytics[0]?.neutralLeads ?? 0
    });
  }
);

export const getAllLeadAnalyticsV1 = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { query } = parseFilter(req);
  const analytics = await LeadMaster.aggregate([
    { $match: query }, // Step 1: Apply Filters
  
    // Step 2: Group by unique identifier (name + phoneNumber + source)
    {
      $group: {
        _id: {
          name: '$name',
          phoneNumber: '$phoneNumber',
          source: '$source',
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
                case: {$in:[LeadType.ACTIVE, '$leadTypes']},
                then: LeadType.ACTIVE
              },
              {
                case: {$in:[LeadType.NEUTRAL, '$leadTypes']},
                then: LeadType.NEUTRAL
              },
              {
                case: {$in:[LeadType.DID_NOT_PICK, '$leadTypes']},
                then: LeadType.DID_NOT_PICK
              },
              {
                case: {$in:[LeadType.NOT_INTERESTED, '$leadTypes']},
                then: LeadType.NOT_INTERESTED
              },
              {
                case: {$in:[LeadType.LEFT_OVER, '$leadTypes']},
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
        totalLeads: { $sum: 1 },
        activeLeads: { $sum: { $cond: [{ $eq: ['$representativeLeadType', LeadType.ACTIVE] }, 1, 0] } },
        neutralLeads: { $sum: { $cond: [{ $eq: ['$representativeLeadType', LeadType.NEUTRAL] }, 1, 0] } },
        didNotPickLeads: { $sum: { $cond: [{ $eq: ['$representativeLeadType', LeadType.DID_NOT_PICK] }, 1, 0] } },
        notInterestedLeads: { $sum: { $cond: [{ $eq: ['$representativeLeadType', LeadType.NOT_INTERESTED] }, 1, 0] } },
        leftOverLeads: { $sum: { $cond: [{ $eq: ['$representativeLeadType', LeadType.LEFT_OVER] }, 1, 0] } }
      }
    }
  ]);

  // Step 6: Format output
  const leadAnalytics = {
    totalLeads: analytics[0]?.totalLeads ?? 0,
    activeLeads: analytics[0]?.activeLeads ?? 0,
    neutralLeads: analytics[0]?.neutralLeads ?? 0,
    didNotPickLeads: analytics[0]?.didNotPickLeads ?? 0,
    notInterestedLeads: analytics[0]?.notInterestedLeads ?? 0,
    leftOverLeads: analytics[0]?.leftOverLeads ?? 0
  };

  return formatResponse(res, 200, 'Lead analytics fetched successfully', true, leadAnalytics);  
});

export const updateData = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const leadRequestData: IUpdateLeadRequestSchema = req.body;

  const validation = updateLeadRequestSchema.safeParse(leadRequestData);
  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  const existingLead = await LeadMaster.findById(leadRequestData._id);
  if (!existingLead) {
    throw createHttpError(404, 'Lead does not found with the given ID.');
  }

  let leadTypeModifiedDate = existingLead.leadTypeModifiedDate;
  const existingRemarkLength = existingLead.remarks?.length || 0;
  const newRemarkLength = leadRequestData.remarks?.length || 0;

  const isRemarkChanged = existingRemarkLength < newRemarkLength;

  if (isRemarkChanged) {
    leadRequestData.followUpCount = existingLead.followUpCount + 1;
  }

  if (leadRequestData.leadType && existingLead.leadType !== leadRequestData.leadType) {
    leadTypeModifiedDate = new Date();
  }

  const currentLoggedInUser = req.data?.id;

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (isRemarkChanged && !existingLead.isCalledToday) {
      const isActive = existingLead.isActiveLead;

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

      const isFirstFollowUp = newRemarkLength == 1;
      userAnalyticsDoc.data[userIndex].totalCalls += 1;

      if (isFirstFollowUp) {
        userAnalyticsDoc.data[userIndex].newLeadCalls += 1;
      }
      if (isActive) {
        userAnalyticsDoc.data[userIndex].activeLeadCalls += 1;
      } else {
        userAnalyticsDoc.data[userIndex].nonActiveLeadCalls += 1;
      }
      leadRequestData.isCalledToday = true;

      await userAnalyticsDoc.save({ session });
    }

    const updatedData = await LeadMaster.findByIdAndUpdate(
      existingLead._id,
      { ...leadRequestData, leadTypeModifiedDate },
      { new: true, runValidators: true,session }
    );
    
    // const updatedFollowUpCount = updatedData?.followUpCount ?? 0;
    // if (updatedFollowUpCount > existingFollowUpCount) {
    //   logFollowUpChange(existingLead._id, currentLoggedInUser, Actions.INCREAMENT);
    // } else if (updatedFollowUpCount < existingFollowUpCount) {
    //   logFollowUpChange(existingLead._id, currentLoggedInUser, Actions.DECREAMENT);
    // }
    
    updateOnlyOneValueInDropDown(DropDownType.FIX_MARKETING_CITY, updatedData?.city);
    updateOnlyOneValueInDropDown(DropDownType.MARKETING_CITY, updatedData?.city);
    updateOnlyOneValueInDropDown(DropDownType.FIX_MARKETING_COURSE_CODE, updatedData?.course);
    updateOnlyOneValueInDropDown(DropDownType.MARKETING_COURSE_CODE, updatedData?.course);
  
    safeAxiosPost(axiosInstance, `${Endpoints.AuditLogService.MARKETING.SAVE_LEAD}`, {
      documentId: updatedData?._id,
      action: RequestAction.POST,
      payload: updatedData,
      performedBy: req.data?.id,
      restEndpoint: '/api/edit/crm',
    });

    await session.commitTransaction();

    return formatResponse(res, 200, 'Data Updated Successfully!', true, updatedData);
  }catch(error){
    await session.abortTransaction();
    throw error;
  }finally{
    await session.endSession();
  }
});




export const logFollowUpChange = (leadId: any, userId: any, action: Actions) => {
  MarketingFollowUpModel.create({
    currentLoggedInUser: userId,
    leadId,
    action
  })
    .then(() => console.log(`Follow-up ${action.toLowerCase()} logged for lead ${leadId} by ${userId}.`))
    .catch(err => console.error(`Error for lead ${leadId} by ${userId}. Error logging follow-up ${action.toLowerCase()}:`, err));
};


export const exportData = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

  const roles = req.data?.roles || [];
  const user = await User.findById(req.data?.id);

  const isAdminOrLead = roles.includes(UserRoles.ADMIN) || roles.includes(UserRoles.LEAD_MARKETING);

  const marketingSheet = user?.marketingSheet;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(marketingSheet?.[0]?.name ?? 'Leads');

  // Define headers
  const baseColumns = [
    { header: 'Date', key: 'date' },
    { header: 'Source', key: 'source' },
    { header: 'Name', key: 'name' },
    { header: 'Phone Number', key: 'phoneNumber' },
    { header: 'Alt Phone Number', key: 'altPhoneNumber' },
    { header: 'Email', key: 'email' },
    { header: 'Course', key: 'course' },
    { header: 'Lead Type', key: 'leadType' },
    { header: 'Remarks', key: 'remarks' },
    { header: 'Area', key: 'area' },
    { header: 'City', key: 'city' },
    { header: 'Final Conversion', key: 'finalConversion' },
    { header: 'Gender', key: 'gender' },
    { header: 'School Name', key: 'schoolName' },
    { header: 'Lead Type Modified Date', key: 'leadTypeModifiedDate' },
    { header: 'Next Due Date', key: 'nextDueDate' },
    { header: 'Foot Fall', key: 'footFall' },
    { header: 'Follow Up Count', key: 'followUpCount' },
  ];

  if (isAdminOrLead) {
    baseColumns.push({ header: 'Assigned To', key: 'assignedTo' });
  }

  worksheet.columns = baseColumns;
  const leads: any = await LeadMaster.find({
    assignedTo: { $in: [req.data?.id] }
  }).populate({
    path: 'assignedTo',
    select: 'firstName lastName'
  });

  leads.forEach((lead: any) => {
    const rowData: any = {
      date: lead.date ? convertToDDMMYYYY(lead.date) : '',
      source: lead.source || '',
      name: lead.name || '',
      phoneNumber: lead.phoneNumber || '',
      altPhoneNumber: lead.altPhoneNumber || '',
      email: lead.email || '',
      course: lead.course || '',
      leadType: lead.leadType || '',
      remarks: Array.isArray(lead.remarks) ? lead.remarks.join('\n') : '',
      area: lead.area || '',
      city: lead.city || '',
      finalConversion: lead.finalConversion || '',
      gender: lead.gender || '',
      schoolName: lead.schoolName || '',
      leadTypeModifiedDate: lead.leadTypeModifiedDate ? convertToDDMMYYYY(lead.leadTypeModifiedDate) : '',
      nextDueDate: lead.nextDueDate ? convertToDDMMYYYY(lead.nextDueDate) : '',
      footFall: lead.footFall ? 'Yes' : 'No',
      followUpCount: lead.followUpCount || 0,
    };

    if (isAdminOrLead) {
      rowData.assignedTo = lead.assignedTo.firstName + ' ' + lead.assignedTo.lastName;
    }

    worksheet.addRow(rowData);
  });

  worksheet.columns.forEach(column => {
    let maxLength = 10;
    column.eachCell?.({ includeEmpty: true }, cell => {
      const cellValue = cell.text ?? '';
      maxLength = Math.max(maxLength, cellValue.length);
    });
    column.width = maxLength + 2;
  });

  const formattedDate = moment().tz('Asia/Kolkata').format('DD-MM-YY');

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${user?.firstName ?? ''} ${user?.lastName ?? ''} - ${formattedDate}.xlsx"`
  );

  // ✅ Write the Excel file to response
  await workbook.xlsx.write(res);
  res.end(); // ✅ Must end the response
});
