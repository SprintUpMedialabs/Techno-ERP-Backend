import { Request, Response } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { yellowLeadSchema, IYellowLead } from '../validators/yellowLead';
import { FilterQuery } from 'mongoose';
import { YellowLead } from '../models/yellowLead';
import { convertDateToFormatedDate } from '../utils/convertDateToFormatedDate';
import { compareDates } from '../utils/compareFormatedDate';
import { FinalConversionType } from '../../config/constants';

export const createYellowLead = expressAsyncHandler(async (req: Request, res: Response) => {
  try {
    const leadData: IYellowLead = req.body;

    const validation = yellowLeadSchema.safeParse(leadData);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors });
      return;
    }

    const newYellowLead = await YellowLead.create(leadData);

    res.status(201).json({
      message: 'Yellow lead created successfully.',
      data: newYellowLead
    });
  } catch (error) {
    console.error('Error in createYellowLead:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

export const getFilteredYellowLeads = expressAsyncHandler(async (req: Request, res: Response) => {
  try {
    const {
      leadTypeChangeDateStart,
      leadTypeChangeDateEnd,
      finalConversionType,
      course,
      location,
      assignedTo
    } = req.query;

    const filter: FilterQuery<IYellowLead> = {};

    if (finalConversionType) {
      filter.finalConversion = finalConversionType as FinalConversionType;
    }

    if (course) {
      filter.course = course;
    }

    if (location) {
      filter.location = location;
    }

    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    const allLeads: IYellowLead[] = await YellowLead.find(filter);

    let filteredLeads = allLeads;

    if (leadTypeChangeDateStart && leadTypeChangeDateEnd) {
      filteredLeads = allLeads.filter((lead) => {
        const leadDate = lead.leadTypeChangeDate!;
        return (
          compareDates(leadDate, leadTypeChangeDateStart as string) >= 0 &&
          compareDates(leadDate, leadTypeChangeDateEnd as string) <= 0
        );
      });
    } else {
      const today = new Date();
      const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

      const startDate = convertDateToFormatedDate(oneMonthAgo);
      const endDate = convertDateToFormatedDate(today);

      filteredLeads = allLeads.filter((lead) => {
        const leadDate = lead.leadTypeChangeDate!;
        return compareDates(leadDate, startDate) >= 0 && compareDates(leadDate, endDate) <= 0;
      });
    }

    res.status(200).json({
      message: 'Filtered yellow leads fetched successfully.',
      data: filteredLeads
    });
  } catch (error) {
    console.error('Error in getFilteredYellowLeads:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

export const updateYellowLead = expressAsyncHandler(async (req: Request, res: Response) => {
  try {
    const { _id } = req.body;
    const updateData: Partial<IYellowLead> = req.body;

    const validation = yellowLeadSchema.partial().safeParse(updateData);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.errors });
      return;
    }

    const updatedYellowLead = await YellowLead.findByIdAndUpdate(_id, updateData, { new: true });

    if (!updatedYellowLead) {
      res.status(404).json({ error: 'Yellow lead not found.' });
      return;
    }

    res.status(200).json({
      message: 'Yellow lead updated successfully.',
      data: updatedYellowLead
    });
  } catch (error) {
    console.error('Error in updateYellowLead:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

export const getYellowLeadsAnalytics = expressAsyncHandler(async (req: Request, res: Response) => {
  try {
    const {
      leadTypeChangeDateStart,
      leadTypeChangeDateEnd,
      finalConversionType,
      course,
      location,
      assignedTo
    } = req.query;

    const filter: FilterQuery<IYellowLead> = {};

    if (leadTypeChangeDateStart && leadTypeChangeDateEnd) {
      filter.leadTypeChangeDate = {
        $gte: leadTypeChangeDateStart as string,
        $lte: leadTypeChangeDateEnd as string
      };
    }

    if (finalConversionType) {
      filter.finalConversion = finalConversionType as FinalConversionType;
    }

    if (course) {
      filter.course = course;
    }

    if (location) {
      filter.location = location;
    }

    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    const filteredLeads = await YellowLead.find(filter);

    const allLeadsCount = filteredLeads.length;
    const campusVisitTrueCount = filteredLeads.filter((lead) => lead.campusVisit).length;
    const activeYellowLeadsCount = filteredLeads.filter(
      (lead) =>
        ![FinalConversionType.RED, FinalConversionType.GREEN].includes(
          lead.finalConversion as FinalConversionType
        )
    ).length;
    const deadLeadCount = filteredLeads.filter(
      (lead) => lead.finalConversion === FinalConversionType.RED
    ).length;

    const analytics = {
      allLeadsCount,
      campusVisitTrueCount,
      activeYellowLeadsCount,
      deadLeadCount
    };

    res.status(200).json({
      message: 'Yellow leads analytics fetched successfully.',
      data: analytics
    });
  } catch (error) {
    console.error('Error in getYellowLeadsAnalytics:', error);
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});
