import expressAsyncHandler from 'express-async-handler';
import { Response } from 'express';
import { AuthenticatedRequest } from '../../auth/validators/authenticatedRequest';
import { User } from '../../auth/models/user';
import { Gender, LeadType, UserRoles } from '../../config/constants';
import logger from '../../config/logger';
import { readFromGoogleSheet } from '../helpers/googleSheetOperations';
import { saveDataToDb } from '../helpers/updateAndSaveToDb';
import { ILead, leadSchema } from '../validators/leads';
import { Lead } from '../models/leads';


export const uploadData = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.data?.id;
    logger.info('ID is : ', id);
    const existingUser = await User.findById(id);
    if (!existingUser) {
      res.status(404).json({ message: 'Something went wrong. Please log in again.' });
      return;
    } else {
      const isAdminOrLead =
        existingUser.roles.includes(UserRoles.ADMIN) ||
        existingUser.roles.includes(UserRoles.MARKETING_LEAD);
      if (isAdminOrLead) {
        const latestData = await readFromGoogleSheet();
        // console.log('Latest Data :', latestData);
        if (!latestData) {
          res.status(200).json({ message: 'There is no data to update :) ' });
          return;
        } else {
          await saveDataToDb(latestData);
          res.status(200).json({ message: 'Data updated in Database!' });
          return;
        }
      }
    }
  } catch (error) {
    logger.error("Couldn't fetch leads.");
    logger.error(error);
    res.status(404).json({ message: 'Error occurred in fetching leads.' });
    return;
  }
});



export const updateData = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const leadData = req.body;

  const validation = leadSchema.safeParse(leadData);
  if (!validation.success) {
    res.status(400).json({ error: validation.error.errors });
    return;
  }

  const existingLead = await Lead.findOne({ phoneNumber: leadData.phoneNumber });
  if (existingLead) {
    if (existingLead.phoneNumber != leadData.phoneNumber) {
      res.status(404).json({ message: 'Sorry, phone number can never be updated!' });
      return;
    }

    const existingLeadType = existingLead.leadType;

    let updatedLead: ILead = {
      srNo: leadData.srNo || existingLead.srNo,
      date: existingLead.date,
      email: leadData.email || existingLead.email,
      name: leadData.name || existingLead.name,
      source: existingLead.source,
      gender: leadData.gender || existingLead.gender,
      altPhoneNumber: leadData.altPhoneNumber || existingLead.altPhoneNumber,
      leadType: existingLead.leadType,
      leadTypeModified: existingLead.leadTypeModified,
      phoneNumber: existingLead.phoneNumber,
      location: leadData.location || existingLead.location,
      course: leadData.course || existingLead.course,
      assignedTo: existingLead.assignedTo,
      remarks: leadData.remarks || existingLead.remarks,
      nextDueDate: leadData.nextDueDate || existingLead.nextDueDate
    };

    if (existingLeadType != leadData.leadType) {
      if (existingLeadType === LeadType.YELLOW) {
        res
          .status(404)
          .json({
            message: 'Sorry, this lead can only be updated from the yellow leads tracker! '
          });
        return;
      } else {
        updatedLead.leadType = leadData.leadType;
        updatedLead.leadTypeModified = new Date().toString();
      }
    }

    try {
      await Lead.updateOne({ phoneNumber: leadData.phoneNumber }, updatedLead);
      logger.info('Data updated successfully');
      res.status(200).json({ message: 'Data Updated Successfully!' });
      return;
    } catch (error) {
      logger.error('Error occurred in updating database : ', error);
      res.status(404).json({ message: 'Error occurred in updating to database!' });
    }
  } else {
    res.status(404).json({ message: ' You cannot update this lead, as it no longer exist! Please take care that you are not updating ph number' });
  }
});
