import expressAsyncHandler from "express-async-handler";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { ApplicationStatus, FeeType } from "../../config/constants";
import { fetchOtherFees, fetchCourseFeeByCourse } from "../../fees/courseAndOtherFees.controller";
import { formatResponse } from "../../utils/formatResponse";
import { checkIfStudentAdmitted } from "../helpers/checkIfStudentAdmitted";
import { Enquiry } from "../models/enquiry";
import { StudentFeesModel } from "../models/studentFees";
import { IFeesRequestSchema, feesRequestSchema, IStudentFeesSchema, IFeesUpdateSchema } from "../validators/studentFees";
import { Response } from "express";
import { updateFeeDetails } from "../helpers/updateFeeDetails";
import { StudentFeesDraftModel } from "../models/studentFeesDraft";
import { functionLevelLogger } from "../../config/functionLevelLogging";

export const createEnquiryStep2 = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {

    const data: IFeesRequestSchema = req.body;
  
    const validation = feesRequestSchema.safeParse(data);
  
    console.log(validation.error);
    if (!validation.success) {
      throw createHttpError(400, validation.error.errors[0]);
    }
  
    const session = await mongoose.startSession();
    session.startTransaction();
  
  
    await checkIfStudentAdmitted(validation.data.enquiryId);
    let feesDraft;
    let feesDraftCreated;
    try {
      const enquiry = await Enquiry.findOne(
        {
          _id: data.enquiryId,
          applicationStatus: ApplicationStatus.STEP_2
        },
        {
          course: 1,
          studentFeeDraft: 1,
          // telecaller : 1,
          // counsellor : 1
        }
      ).session(session).lean();
  
      if (!enquiry) {
        throw createHttpError(404, 'Enquiry with particular ID not found!')
      }
  
  
      const otherFees = await fetchOtherFees();
      const semWiseFee = await fetchCourseFeeByCourse(enquiry?.course.toString() ?? '');
  
      const feeData: IStudentFeesSchema = {
        ...validation.data,
        otherFees: validation.data.otherFees?.map(fee => {
          let feeAmount;
          if (fee.type === FeeType.SEM1FEE) 
          {
            feeAmount = semWiseFee?.fee[0] ?? 0;
          } 
          else 
          {
            feeAmount = otherFees?.find(otherFee => otherFee.type === fee.type)?.fee ?? 0;
          }
  
          return {
            ...fee,
            feeAmount,
            finalFee: fee.finalFee ?? 0,
            feesDepositedTOA: fee.feesDepositedTOA ?? 0
          };
        }) || [],
        semWiseFees: validation.data.semWiseFees.map((semFee, index: number) => ({
          finalFee: semFee.finalFee,
          feeAmount: semWiseFee?.fee[index] ?? 0,
        })),
      };
  
      feesDraft = await StudentFeesModel.create([feeData], { session });
  
      feesDraftCreated = {
        ...feesDraft,
        telecaller : data.telecaller ? data.telecaller : enquiry.telecaller,
        counsellor : data.counsellor ? data.counsellor : enquiry.counsellor
      };

      if (!feesDraft) {
        throw createHttpError(404, 'Failed to update Fees');
      }
  
      const enquiryUpdatePayload: Record<string, any> = {
        studentFee: feesDraft[0]._id,
        studentFeeDraft: null,
      };
      
      if (data.counsellor){
        enquiryUpdatePayload.counsellor = data.counsellor;
      }
      if (data.telecaller) {
        enquiryUpdatePayload.telecaller = data.telecaller;
      }
      
      await Enquiry.findByIdAndUpdate(
        data.enquiryId,
        { $set: enquiryUpdatePayload },
        { new: true, session }
      );
      

      if (enquiry?.studentFeeDraft) 
      {
         await StudentFeesDraftModel.findByIdAndDelete(enquiry.studentFeeDraft, { session });
      }

      await session.commitTransaction();
      session.endSession();
    }

    catch (error) {
      console.log(error);
      await session.abortTransaction();
      session.endSession();
      throw createHttpError('Could not update successfully');
    }
    return formatResponse(res, 201, 'Fees created successfully', true, feesDraftCreated);
}));
  
  
  
export const updateEnquiryStep2ById = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {
    const feesDraftUpdateData: IFeesUpdateSchema = req.body;
  
    const feesDraft = await updateFeeDetails([ApplicationStatus.STEP_1, ApplicationStatus.STEP_3, ApplicationStatus.STEP_4], feesDraftUpdateData);
    return formatResponse(res, 200, 'Fees Draft updated successfully', true, feesDraft);
}));
  