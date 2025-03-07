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
import { formatName } from '../utils/formatName';

export const uploadData = expressAsyncHandler(async (_: AuthenticatedRequest, res: Response) => {
  try {
    const latestData = await readFromGoogleSheet();
    if (!latestData) {
      res.status(200).json({ message: 'There is no data to update :)' });
    } else {
      try {
        await saveDataToDb(latestData);
        res.status(200).json({ message: 'Data updated in database' });
      } catch (error) {
        logger.error('Error occurred in saving sheet data to db', error);
        res.status(500).json({ message: 'Error occurred in saving sheet data to db' });
      }
    }
  } catch (error) {
    logger.error("Couldn't fetch leads.", error);
    res.status(500).json({ message: 'Error occurred in fetching leads.' });
  }
});

export const fetchData = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userIDMap: Map<String, String> = new Map();

    const decodedData = req.data;
    if (!decodedData || !decodedData.id || !decodedData.roles) {
      res.status(401).json({ message: 'Please login!' });
    } else {
      const { id, roles } = decodedData;

      let leads: ILead[] = [];

      if (roles.includes(UserRoles.ADMIN) || roles.includes(UserRoles.LEAD_MARKETING)) {
        leads = await Lead.find().lean();
      } else if (roles.includes(UserRoles.EMPLOYEE_MARKETING)) {
        leads = await Lead.find({ assignedTo: id }).lean();
      } else {
        res.status(403).json({ message: 'Unauthorized access!' });
      }

      const totalLeads: number = leads.length;
      const openLeads: number = leads.filter((lead) => lead.leadType === LeadType.ORANGE).length;

      // await Promise.all(
      //   leads.map(async (lead) => {
      //     if (lead.assignedTo) {
      //       if (userIDMap.has(lead.assignedTo)) {
      //         lead.assignedTo = userIDMap.get(lead.assignedTo)?.toString();
      //       } else {
      //         const existingUser = await User.findById(lead.assignedTo);
      //         if (existingUser) {
      //           let name = formatName(existingUser.firstName, existingUser.lastName);
      //           const assignedToInfo = `${name} - ${existingUser.email}`;
      //           lead.assignedTo = assignedToInfo;
      //           userIDMap.set(lead.assignedTo, assignedToInfo);
      //         }
      //       }
      //     }
      //   })
      // );

      res.status(200).json({
        leadStats: {
          totalLeads,
          openLeads
        },
        leads
      });
    }
  } catch (error) {
    res.status(404).json({ message: 'Could not fetch leads' });
  }
});

export const fetchFilteredData = expressAsyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const decodedData = req.data;
      if (!decodedData || !decodedData.id || !decodedData.roles) {
        res.status(401).json({ message: 'Please login!' });
      } else {
        const { id, roles } = decodedData;

        let leads;

        if (roles.includes(UserRoles.ADMIN) || roles.includes(UserRoles.LEAD_MARKETING)) {
          leads = await Lead.find();
        } else if (roles.includes(UserRoles.EMPLOYEE_MARKETING)) {
          leads = await Lead.find({ assignedTo: id });
        } else {
          res.status(403).json({ message: 'Unauthorized access!' });
        }

        res.status(200).json({ leads });
      }
    } catch (error) {
      res.status(404).json({ message: 'Could not fetch leads' });
    }
  }
);

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
      assignedTo: leadData.assignedTo || existingLead.assignedTo,
      remarks: leadData.remarks || existingLead.remarks,
      nextDueDate: leadData.nextDueDate || existingLead.nextDueDate
    };

    if (existingLeadType != leadData.leadType) {
      if (existingLeadType === LeadType.YELLOW) {
        res.status(404).json({
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
      // logger.info('Data updated successfully');
      res.status(200).json({ message: 'Data Updated Successfully!' });
      return;
    } catch (error) {
      logger.error('Error occurred in updating database : ', error);
      res.status(404).json({ message: 'Error occurred in updating to database!' });
    }
  } else {
    res.status(404).json({
      message:
        ' You cannot update this lead, as it no longer exist! Please take care that you are not updating ph number'
    });
  }
});
