import { Response } from "express";
import expressAsyncHandler from "express-async-handler";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { User } from "../../auth/models/user";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Actions, MarketingAnalyticsEnum, UserRoles } from "../../config/constants";
import { formatResponse } from "../../utils/formatResponse";
import { getISTDate } from "../../utils/getISTDate";
import { MarketingAnalyticsModel } from "../models/marketingAnalytics";
import { MarketingFollowUpModel } from "../models/marketingFollowUp";
import { MarketingUserWiseAnalytics } from "../models/marketingUserWiseAnalytics";

export const createMarketingAnalytics = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const marketingEmployees = await User.find({ roles: UserRoles.EMPLOYEE_MARKETING }).select('_id').session(session);
    const marketingEmployeeIds = marketingEmployees.map(user => user._id);

    if (marketingEmployeeIds.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return formatResponse(res, 200, "No marketing employees found", true, null);
    }

    const today = new Date();
    const type = MarketingAnalyticsEnum.NO_OF_CALLS;
    const dateKey = today.toDateString();
    const detailsMap: Record<string, { userId: any; noOfCalls: number }[]> = {
      [dateKey]: []
    };

    for (const empId of marketingEmployeeIds) {
      const followUps = await MarketingFollowUpModel.find({ currentLoggedInUser: empId }).session(session);

      const leadStats: Record<string, { increaments: number; decreaments: number }> = {};
      for (const followUp of followUps) {
        const leadIdStr = followUp.leadId?.toString();
        if (!leadIdStr)
          continue;

        if (!leadStats[leadIdStr]) {
          leadStats[leadIdStr] = { increaments: 0, decreaments: 0 };
        }

        if (followUp.action === Actions.INCREAMENT) {
          leadStats[leadIdStr].increaments += 1;
        }
        else if (followUp.action === Actions.DECREAMENT) {
          leadStats[leadIdStr].decreaments += 1;
        }
      }

      let netPositiveLeadCount = 0;
      for (const leadId in leadStats) {
        const netCount = leadStats[leadId].increaments - leadStats[leadId].decreaments;
        if (netCount > 0)
          netPositiveLeadCount += 1;
      }

      detailsMap[dateKey].push({
        userId: empId,
        noOfCalls: netPositiveLeadCount
      });
    }

    const dataForToday = detailsMap[dateKey];

    const updatedAnalytics = await MarketingAnalyticsModel.updateOne(
      { type },
      {
        $push: {
          details: {
            date: today,
            data: dataForToday
          }
        },
        $set: {
          lastUpdatedAt: new Date()
        }
      },
      { upsert: true, session }
    );

    if (updatedAnalytics.acknowledged)
      await MarketingFollowUpModel.deleteMany({}, { session });

    await session.commitTransaction();
    session.endSession();

    return formatResponse(res, 200, "Call follow-up data saved and cleared successfully", true, null);
  }
  catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error during marketing analytics transaction:", error);
    return formatResponse(res, 500, "Failed to save marketing analytics", false, null);
  }
});




export const getCallAnalytics = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const callAnalytics = await MarketingAnalyticsModel.findOne({ type: MarketingAnalyticsEnum.NO_OF_CALLS });

  if (!callAnalytics || callAnalytics.details.length === 0) {
    return formatResponse(res, 200, "No analytics data found", true, {});
  }
  const latestEntry = callAnalytics.details[callAnalytics.details.length - 1];
  const userIds = latestEntry.data.map(item => item.userId);

  const users = await User.find({ _id: { $in: userIds } }).select('firstName lastName email');

  const userMap = users.reduce((acc: Record<string, string>, user: any) => {
    acc[user._id.toString()] = `${user.firstName} ${user.lastName} - ${user.email}`;
    return acc;
  }, {});

  const updatedData = latestEntry.data.map(item => ({
    user: userMap[item.userId.toString()] || 'Unknown User',
    noOfCalls: item.noOfCalls
  }));

  const response = {
    date: latestEntry.date,
    data: updatedData
  };

  return formatResponse(res, 200, "Analytics fetched successfully", true, response);
});

export const updateMarketingRemark = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { analyticsRemark } = req.body;
  const todayStart = getISTDate();
  const userAnalyticsDoc = await MarketingUserWiseAnalytics.findOne({
    date: { $gte: todayStart },
    data: { $elemMatch: { userId: req.data?.id } },
  });
  if (!userAnalyticsDoc)
    throw createHttpError(404, 'User analytics not found.');
  const userIndex = userAnalyticsDoc.data.findIndex((entry) =>
    entry.userId.toString() === req.data?.id.toString()
  );

  if (userIndex === -1)
    throw createHttpError(404, 'User not found in analytics data.');
  userAnalyticsDoc.data[userIndex].analyticsRemark = analyticsRemark;
  await userAnalyticsDoc.save();

  return formatResponse(res, 200, "Marketing remark updated successfully", true, null);
});
