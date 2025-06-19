import { Response } from "express";
import expressAsyncHandler from "express-async-handler";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { ApplicationStatus, Course } from "../../config/constants";
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

  const otherFees = await fetchOtherFees(enquiry.course as String);
  const semWiseFee = await fetchCourseFeeByCourse(enquiry.course as String);

  // if (!semWiseFee) {
  //   throw createHttpError(500, 'Semester-wise fee structure not found for the course');
  // }

  const { counsellor, telecaller, ...feeRelatedData } = validation.data;

  const sem1FeeDepositedTOA = feeRelatedData.otherFees?.find(fee => fee.type === 'SEM1FEE')?.feesDepositedTOA ?? 0;

  const feeData = {
    ...feeRelatedData,
    otherFees: feeRelatedData.otherFees?.map(fee => {
      let feeAmount = fee.feeAmount;
      // feeAmount = feeAmount ?? otherFees?.find(otherFee => otherFee.type === fee.type)?.fee ?? 0;
      feeAmount = otherFees?.find(otherFee => otherFee.type === fee.type)?.amount ?? 0;
      return {
        ...fee,
        feeAmount,
        finalFee: fee.finalFee ?? 0,
        feesDepositedTOA: fee.feesDepositedTOA ?? 0
      };
    }) || [],
    semWiseFees: feeRelatedData.semWiseFees?.map((semFee, index) => ({
      feeAmount: semFee.feeAmount ?? semWiseFee?.[index] ?? 0,
      finalFee: semFee.finalFee ?? 0,
      feesPaid: index === 0 ? sem1FeeDepositedTOA : 0
    })) || []
  };

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const feesDraftList = await StudentFeesDraftModel.create([feeData], { session });
    const feesDraft = feesDraftList[0];

    const enquiryDataUpdate: any = {
      studentFeeDraft: feesDraft._id, counsellor, telecaller
    }

    if (data.references != null) {
      enquiryDataUpdate.references = data.references;
    }

    if( data.srAmount != null ) {
      enquiryDataUpdate.srAmount = data.srAmount;
    }

    if(data.feeDetailsRemark != null)
      enquiryDataUpdate.feeDetailsRemark = data.feeDetailsRemark;

    if(data.isFeeApplicable != null)
      enquiryDataUpdate.isFeeApplicable = data.isFeeApplicable;

    await Enquiry.findByIdAndUpdate(
      data.enquiryId,
      { $set: enquiryDataUpdate },
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

  const otherFees = await fetchOtherFees(enquiry.course as String);
  const semWiseFee = await fetchCourseFeeByCourse(enquiry.course as String);

  // if (!semWiseFee) {
  //   throw createHttpError(500, 'Semester-wise fee structure not found for the course');
  // }

  const { counsellor, telecaller, ...feeRelatedData } = validation.data;
  const updateData: any = {
    ...feeRelatedData,
    otherFees: feeRelatedData.otherFees?.map(fee => {
      let feeAmount = fee.feeAmount;

      // feeAmount = otherFees?.find(otherFee => otherFee.type === fee.type)?.amount ?? 0;
      feeAmount = otherFees?.find(otherFee => otherFee.type === fee.type)?.amount ?? 0;

      return {
        ...fee,
        feeAmount,
        finalFee: fee.finalFee ?? 0,
        feesDepositedTOA: fee.feesDepositedTOA ?? 0
      };
    }) || [],
    semWiseFees: feeRelatedData.semWiseFees?.map((semFee, index) => ({
      // feeAmount: semFee.feeAmount ?? semWiseFee?.fee[index] ?? 0,
      feeAmount: semFee.feeAmount ?? semWiseFee[index] ?? 0,
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
    const enquiryData: any = { counsellor, telecaller };
    if (data.references != null) {
      enquiryData.references = data.references;
    }
    if(data.srAmount != null){
      enquiryData.srAmount = data.srAmount;
    }
    if(validation.data.feeDetailsRemark != null){
      enquiryData.feeDetailsRemark = validation.data.feeDetailsRemark;
    }
    if(validation.data.financeOfficeRemark != null){
      enquiryData.financeOfficeRemark = validation.data.financeOfficeRemark;
    }

    if(validation.data.isFeeApplicable != null){
      enquiryData.isFeeApplicable = validation.data.isFeeApplicable;
    }
    
      await Enquiry.findByIdAndUpdate(
      data.enquiryId,
      { $set: enquiryData },
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
