import expressAsyncHandler from "express-async-handler";
import createHttpError from "http-errors";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { ApplicationStatus, FeeType } from "../../config/constants";
import { fetchOtherFees, fetchCourseFeeByCourse } from "../../fees/courseAndOtherFees.controller";
import { formatResponse } from "../../utils/formatResponse";
import { Enquiry } from "../models/enquiry";
import { StudentFeesDraftModel } from "../models/studentFeesDraft";
import { IFeesDraftRequestSchema, feesDraftRequestSchema, IFeesDraftUpdateSchema, feesDraftUpdateSchema } from "../validators/studentFees";
import { Response } from "express";
import { functionLevelLogger } from "../../config/functionLevelLogging";

export const createFeeDraft = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {

    const data: IFeesDraftRequestSchema = req.body;
    const validation = feesDraftRequestSchema.safeParse(data);
  
    if (!validation.success) 
    {
      throw createHttpError(400, validation.error.errors[0].message);
    }
  
    const enquiry = await Enquiry.findOne(  
        { _id: data.enquiryId, 
          applicationStatus: ApplicationStatus.STEP_2 
        }, { course: 1 })
      .lean();
  

    if (!enquiry) 
    {
      throw createHttpError(400, 'Valid enquiry does not exist. Please complete step 1 first!');
    }
  
  
    const otherFees = await fetchOtherFees();
    const semWiseFee = await fetchCourseFeeByCourse(enquiry.course.toString());
  
  
    const feeData = {
      ...validation.data,
      otherFees: validation.data.otherFees?.map(fee => {
        let feeAmount = fee.feeAmount;
  
        if (fee.type === FeeType.SEM1FEE) 
        {
          feeAmount = semWiseFee?.fee[0] ?? 0;
        } 
        else 
        {
          feeAmount = feeAmount ?? otherFees?.find(otherFee => otherFee.type === fee.type)?.fee ?? 0;
        }
        return {
          ...fee,
          feeAmount,
          finalFee: fee.finalFee ?? 0,
          feesDepositedTOA: fee.feesDepositedTOA ?? 0
        };
      }) || [],
      semWiseFees: validation.data.semWiseFees?.map((semFee, index) => ({
        feeAmount: semFee.feeAmount ?? semWiseFee?.fee[index] ?? 0,
        finalFee: semFee.finalFee ?? 0
      })) || []
    };
  
    const feesDraft = await StudentFeesDraftModel.create(feeData);
  
    await Enquiry.findByIdAndUpdate(
      data.enquiryId,
      { $set: { studentFeeDraft: feesDraft._id } }
    );

    return formatResponse(res, 201, 'Fees Draft created successfully', true, feesDraft);

}));
  
  
  export const updateFeeDraft = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {
  
    let data: IFeesDraftUpdateSchema = req.body;
  
    let { id, enquiryId, ...feesDraftUpdateData } = data;
  
    const validation = feesDraftUpdateSchema.safeParse(feesDraftUpdateData);
  
    if (!validation.success) 
    {
      throw createHttpError(400, validation.error.errors[0].message);
    }
  
    const enquiry = await Enquiry.findOne(
      {
        _id: data.enquiryId,
        applicationStatus: ApplicationStatus.STEP_2
      },{ course: 1 })
      .lean();
  
    if (!enquiry) 
    {
      throw createHttpError(400, 'Not a valid enquiry');
    }
  
    const otherFees = await fetchOtherFees();
    const semWiseFee = await fetchCourseFeeByCourse(enquiry.course.toString());
  
  
    const updateData: any = {
      ...validation.data,
      otherFees: validation.data.otherFees?.map(fee => {
        let feeAmount = fee.feeAmount;
  
        if (fee.type === FeeType.SEM1FEE) 
        {
          feeAmount = semWiseFee?.fee[0] ?? 0;
        } 
        else 
        {
          feeAmount = feeAmount ?? otherFees?.find(otherFee => otherFee.type === fee.type)?.fee ?? 0;
        }
  
        return {
          ...fee,
          feeAmount,
          finalFee: fee.finalFee ?? 0,
          feesDepositedTOA: fee.feesDepositedTOA ?? 0
        };
      }) || [],
      semWiseFees: validation.data.semWiseFees?.map((semFee, index) => ({
        feeAmount: semFee.feeAmount ?? semWiseFee?.fee[index] ?? 0,
        finalFee: semFee.finalFee ?? 0
      })) || []
    };
  
  
    const updatedDraft = await StudentFeesDraftModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
  
    return formatResponse(res, 200, 'Fees Draft updated successfully', true, updatedDraft);
  }));
  