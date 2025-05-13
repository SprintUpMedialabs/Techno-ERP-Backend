import { Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import createHttpError from 'http-errors';
import axiosInstance from '../../api/axiosInstance';
import { Endpoints } from '../../api/endPoints';
import { safeAxiosPost } from '../../api/safeAxios';
import { User } from '../../auth/models/user';
import { getCurrentLoggedInUser } from '../../auth/utils/getCurrentLoggedInUser';
import { AuthenticatedRequest } from '../../auth/validators/authenticatedRequest';
import { Actions, DropDownType, LeadType, RequestAction } from '../../config/constants';
import { updateOnlyOneValueInDropDown } from '../../utilityModules/dropdown/dropDownMetadataController';
import { formatResponse } from '../../utils/formatResponse';
import { readFromGoogleSheet } from '../helpers/googleSheetOperations';
import { parseFilter } from '../helpers/parseFilter';
import { saveDataToDb } from '../helpers/updateAndSaveToDb';
import { LeadMaster } from '../models/lead';
import { MarketingFollowUpModel } from '../models/marketingFollowUp';
import { normaliseText } from '../validators/formators';
import ExcelJS from 'exceljs';
import { IUpdateLeadRequestSchema, updateLeadRequestSchema } from '../validators/leads';
import { convertToDDMMYYYY } from '../../utils/convertDateToFormatedDate';
import moment from 'moment-timezone';

export const uploadData = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = await User.findById(req.data?.id);
  const marketingSheet = user?.marketingSheet;

  if (marketingSheet && marketingSheet.length > 0) {
    for (const sheet of marketingSheet) {
      const latestData = await readFromGoogleSheet(sheet.id, sheet.name);
      if (latestData) {
        await saveDataToDb(latestData.rowData, latestData.lastSavedIndex, sheet.id, sheet.name, latestData.requiredColumnHeaders);
      }
    }
    return formatResponse(res, 200, 'Data updated in Database!', true);
  } else {
    return formatResponse(res, 400, 'No data found in the sheet!', false);
  }
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

export const updateData = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const leadRequestData: IUpdateLeadRequestSchema = req.body;

  const validation = updateLeadRequestSchema.safeParse(leadRequestData);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  console.log("Validation error : ", validation.error)
  const existingLead = await LeadMaster.findById(leadRequestData._id);

  if (existingLead) {
    // if (existingLead.leadType === LeadType.INTERESTED) {
    //   throw createHttpError(
    //     400,
    //     'Sorry, this lead can only be updated from the yellow leads tracker!'
    //   );
    // }

    let leadTypeModifiedDate = existingLead.leadTypeModifiedDate;

    let existingRemark = existingLead.remarks?.length;
    let leadRequestDataRemark = leadRequestData.remarks?.length;

    let existingFollowUpCount = existingLead.followUpCount;
    let leadRequestDataFollowUpCount = leadRequestData.followUpCount;

    const isRemarkChanged = existingRemark !== leadRequestDataRemark;
    const isFollowUpCountChanged = existingFollowUpCount !== leadRequestDataFollowUpCount;

    if (isRemarkChanged && !isFollowUpCountChanged) {
      leadRequestData.followUpCount = existingLead.followUpCount + 1;
    }

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

    const currentLoggedInUser = getCurrentLoggedInUser(req);

    const updatedFollowUpCount = updatedData?.followUpCount ?? 0;


    if (updatedFollowUpCount > existingFollowUpCount) {
      logFollowUpChange(existingLead._id, currentLoggedInUser, Actions.INCREAMENT)
    }
    else if (updatedFollowUpCount < existingFollowUpCount) {
      logFollowUpChange(existingLead._id, currentLoggedInUser, Actions.DECREAMENT)
    }


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

    return formatResponse(res, 200, 'Data Updated Successfully!', true, updatedData);
  }
  else {
    throw createHttpError(404, 'Lead does not found with the given ID.');
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
  const user = await User.findById(req.data?.id);
  const marketingSheet = user?.marketingSheet;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(marketingSheet?.[0]?.name ?? 'Leads');

  // Define headers
  worksheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Name', key: 'name', width: 20 },
    { header: 'Phone Number', key: 'phoneNumber', width: 15 },
    { header: 'Alt Phone Number', key: 'altPhoneNumber', width: 15 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Course', key: 'course', width: 20 },
    { header: 'Lead Type', key: 'leadType', width: 15 },
    { header: 'Remarks', key: 'remarks', width: 30 },
    { header: 'Area', key: 'area', width: 20 },
    { header: 'City', key: 'city', width: 20 },
    { header: 'Final Conversion', key: 'finalConversion', width: 20 },
    { header: 'Gender', key: 'gender', width: 10 },
    { header: 'School Name', key: 'schoolName', width: 20 },
    { header: 'Lead Type Modified Date', key: 'leadTypeModifiedDate', width: 20 },
    { header: 'Next Due Date', key: 'nextDueDate', width: 20 },
    { header: 'Foot Fall', key: 'footFall', width: 10 },
    { header: 'Follow Up Count', key: 'followUpCount', width: 10 },
    { header: 'Assigned To', key: 'assignedTo', width: 30 },
  ];
  

  const leads = await LeadMaster.find({
    assignedTo: { $in: [req.data?.id] }
  }).populate({
    path: 'assignedTo',
    select: 'firstName lastName'
  });

  leads.forEach(lead => {
    worksheet.addRow({
      date: lead.date ? convertToDDMMYYYY(lead.date) : '',
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
      assignedTo: Array.isArray(lead.assignedTo)
        ? lead.assignedTo
          .map((user: any) => `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim())
          .join(', ')
        : '',
      // source: lead.source || '',
    });
  });
  const formattedDate = moment().tz('Asia/Kolkata').format('DD-MM-YY');

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=${user?.firstName ?? ''} ${user?.lastName ?? ''} - ${formattedDate}.xlsx`
  );

  // ✅ Write the Excel file to response
  await workbook.xlsx.write(res);
  res.end(); // ✅ Must end the response
});
