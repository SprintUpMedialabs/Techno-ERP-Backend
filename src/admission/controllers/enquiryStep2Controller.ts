import { Response } from "express";
import expressAsyncHandler from "express-async-handler";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { ApplicationStatus, Course, FeeType } from "../../config/constants";
import { functionLevelLogger } from "../../config/functionLevelLogging";
import { fetchCourseFeeByCourse, fetchOtherFees } from "../../fees/courseAndOtherFees.controller";
import { formatResponse } from "../../utils/formatResponse";
import { Enquiry } from "../models/enquiry";
import { StudentFeesModel } from "../models/studentFees";
import { StudentFeesDraftModel } from "../models/studentFeesDraft";
import { feesRequestSchema, IFeesRequestSchema, IStudentFeesSchema } from "../validators/studentFees";

export const createEnquiryStep2 = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {

  const data: IFeesRequestSchema = req.body;

  const validation = feesRequestSchema.safeParse(data);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }
  const enquiry = await Enquiry.findOne(
    {
      _id: validation.data.enquiryId,
      applicationStatus: ApplicationStatus.STEP_2
    },
    {
      course: 1,
      studentFeeDraft: 1,
    }
  ).lean();

  if (!enquiry) {
    throw createHttpError(404, 'Enquiry with particular ID not found!')
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const otherFees = await fetchOtherFees(enquiry?.course as String);
    const semWiseFee = await fetchCourseFeeByCourse(enquiry?.course as String);

    // console.log("Other fees is : ", otherFees);
    // console.log("Semwise fee is : ", semWiseFee);

    if (!semWiseFee) {
      throw createHttpError(500, 'Semester-wise fee structure not found for the course');
    }

    const { counsellor, telecaller, ...feeRelatedData } = validation.data;

    const sem1FeeDepositedTOA = feeRelatedData.otherFees?.find(fee => fee.type === 'SEM1FEE')?.feesDepositedTOA ?? 0;

    const feeData: IStudentFeesSchema = {
      ...feeRelatedData,
      otherFees: feeRelatedData.otherFees?.map(fee => {
        let feeAmount;
        feeAmount = otherFees?.find(otherFee => otherFee.type === fee.type)?.amount ?? 0;
        return {
          ...fee,
          feeAmount,
          finalFee: fee.finalFee ?? 0,
          feesDepositedTOA: fee.feesDepositedTOA ?? 0
        };
      }) || [],
      semWiseFees: feeRelatedData.semWiseFees.map((semFee, index: number) => ({
        finalFee: semFee.finalFee,
        feeAmount: semWiseFee[index].amount ?? 0,
        feesPaid: index === 0 ? sem1FeeDepositedTOA : 0, 
      })),
    };

    const feesDraftList = await StudentFeesModel.create([feeData], { session });
    const feesDraft = feesDraftList[0];

    const enquiryUpdatePayload: Record<string, any> = {
      studentFee: feesDraft._id,
      studentFeeDraft: null,
      applicationStatus: ApplicationStatus.STEP_3
    };

    if (data.counsellor) {
      enquiryUpdatePayload.counsellor = data.counsellor;
    }
    if (data.telecaller) {
      enquiryUpdatePayload.telecaller = data.telecaller;
    }

    if (data.reference != null) {
      enquiryUpdatePayload.reference = data.reference;
    }
    if(data.remarks!=null){
      enquiryUpdatePayload.remarks = data.remarks
    }
    if(data.isFeeApplicable!=null){
      enquiryUpdatePayload.isFeeApplicable = data.isFeeApplicable
    }


    await Enquiry.findByIdAndUpdate(
      data.enquiryId,
      { $set: enquiryUpdatePayload },
      { new: true, session }
    );

    if (enquiry?.studentFeeDraft) {
      await StudentFeesDraftModel.findByIdAndDelete(enquiry.studentFeeDraft, { session });
    }

    await session.commitTransaction();
    session.endSession();
    return formatResponse(res, 201, 'Fees created successfully', true, feesDraft);
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw createHttpError(error);
  }
}));

export const updateEnquiryStep2ById = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {
  // const feesDraftUpdateData: IFeesUpdateSchema = req.body;

  // const feesDraft = await updateFeeDetails([ApplicationStatus.STEP_1, ApplicationStatus.STEP_3, ApplicationStatus.STEP_4], feesDraftUpdateData);
  // return formatResponse(res, 200, 'Fees Draft updated successfully', true, feesDraft);
}));