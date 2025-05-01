import { Response } from "express";
import expressAsyncHandler from "express-async-handler";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { ApplicationStatus } from "../../config/constants";
import { functionLevelLogger } from "../../config/functionLevelLogging";
import { fetchCourseFeeByCourse, fetchOtherFees } from "../../fees/courseAndOtherFees.controller";
import { formatResponse } from "../../utils/formatResponse";
import { Enquiry } from "../models/enquiry";
import { StudentFeesDraftModel } from "../models/studentFeesDraft";
import { IFeesDraftRequestSchema, IFeesDraftUpdateSchema, feesDraftRequestSchema, feesDraftUpdateSchema } from "../validators/studentFees";

export const createFeeDraft = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {

  const data: IFeesDraftRequestSchema = req.body;
  const validation = feesDraftRequestSchema.safeParse(data);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0].message);
  }

  const enquiry = await Enquiry.findOne(
    {
      _id: data.enquiryId,
      applicationStatus: ApplicationStatus.STEP_2
    }, { course: 1 })
    .lean();


  if (!enquiry) {
    throw createHttpError(400, 'Valid enquiry does not exist. Please complete step 1 first!');
  }

  const otherFees = await fetchOtherFees();
  const semWiseFee = await fetchCourseFeeByCourse(enquiry.course);

  const { counsellor, telecaller, ...feeRelatedData } = validation.data;
  const feeData = {
    ...feeRelatedData,
    otherFees: feeRelatedData.otherFees?.map(fee => {
      let feeAmount = fee.feeAmount;
      feeAmount = feeAmount ?? otherFees?.find(otherFee => otherFee.type === fee.type)?.fee ?? 0;
      return {
        ...fee,
        feeAmount,
        finalFee: fee.finalFee ?? 0,
        feesDepositedTOA: fee.feesDepositedTOA ?? 0
      };
    }) || [],
    semWiseFees: feeRelatedData.semWiseFees?.map((semFee, index) => ({
      feeAmount: semFee.feeAmount ?? semWiseFee?.fee[index] ?? 0,
      finalFee: semFee.finalFee ?? 0
    })) || []
  };

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const feesDraftList = await StudentFeesDraftModel.create([feeData], { session });
    const feesDraft = feesDraftList[0];

    await Enquiry.findByIdAndUpdate(
      data.enquiryId,
      { $set: { studentFeeDraft: feesDraft._id, counsellor, telecaller } },
      { session }
    );
    await session.commitTransaction();
    session.endSession();
    return formatResponse(res, 201, 'Fees Draft created successfully', true, feesDraft);
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw createHttpError(error);
  }
}));


export const updateFeeDraft = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {

  let data: IFeesDraftUpdateSchema = req.body;

  const validation = feesDraftUpdateSchema.safeParse(data);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0].message);
  }

  const enquiry = await Enquiry.findOne(
    {
      _id: data.enquiryId,
      applicationStatus: ApplicationStatus.STEP_2
    }, { course: 1 })
    .lean();

  if (!enquiry) {
    throw createHttpError(404, 'Not a valid enquiry');
  }

  const otherFees = await fetchOtherFees();
  const semWiseFee = await fetchCourseFeeByCourse(enquiry.course);

  // DTODO: remove telecaller and counsellor from updatedData
  const { counsellor, telecaller, ...feeRelatedData } = validation.data;
  const updateData: any = {
    ...feeRelatedData,
    otherFees: feeRelatedData.otherFees?.map(fee => {
      let feeAmount = fee.feeAmount;

      feeAmount = feeAmount ?? otherFees?.find(otherFee => otherFee.type === fee.type)?.fee ?? 0;

      return {
        ...fee,
        feeAmount,
        finalFee: fee.finalFee ?? 0,
        feesDepositedTOA: fee.feesDepositedTOA ?? 0
      };
    }) || [],
    semWiseFees: feeRelatedData.semWiseFees?.map((semFee, index) => ({
      feeAmount: semFee.feeAmount ?? semWiseFee?.fee[index] ?? 0,
      finalFee: semFee.finalFee ?? 0
    })) || []
  };

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const updatedDraft = await StudentFeesDraftModel.findByIdAndUpdate(
      data.id,
      { $set: updateData },
      { new: true, runValidators: true, session }
    );
    await Enquiry.findByIdAndUpdate(
      data.enquiryId,
      { $set: { counsellor, telecaller } },
      { session }
    );
    await session.commitTransaction();
    session.endSession();
    return formatResponse(res, 200, 'Fees Draft updated successfully', true, updatedDraft);
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw createHttpError(error);
  }
}));
