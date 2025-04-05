import { ApplicationStatus } from "aws-sdk/clients/kinesisanalytics";
import createHttpError from "http-errors";
import { fetchOtherFees, fetchCourseFeeByCourse } from "../../fees/courseAndOtherFees.controller";
import { Enquiry } from "../models/enquiry";
import { StudentFeesModel } from "../models/studentFees";
import { IFeesUpdateSchema, feesUpdateSchema, IStudentFeesSchema } from "../validators/studentFees";
import { checkIfStudentAdmitted } from "./checkIfStudentAdmitted";

export const updateFeeDetails = async (applicationStatusList: ApplicationStatus[], studentFeesData: IFeesUpdateSchema) => {
    const validation = feesUpdateSchema.safeParse(studentFeesData);
  
    console.log(validation.error);
  
    if (!validation.success) 
    {
      throw createHttpError(400, validation.error.errors[0]);
    }
  
    const enquiry = await Enquiry.findOne({
      studentFee: studentFeesData.id,
      applicationStatus: { $nin: [...applicationStatusList] }
     }, 
     {
        course: 1 // Only return course field
     })
     .lean();
  
    if (!enquiry) 
    {
      throw createHttpError(404, 'Could not find valid Enquiry');
    }
  
    await checkIfStudentAdmitted(enquiry._id);
  
    const otherFees = await fetchOtherFees();
    const semWiseFee = await fetchCourseFeeByCourse(enquiry?.course.toString() ?? '');
  
    const feeData: IStudentFeesSchema = {
      ...validation.data,
      otherFees: validation.data.otherFees.map(fee => ({
        ...fee,
        feeAmount: otherFees?.find(otherFee => otherFee.type == fee.type)?.fee ?? 0
      })),
      semWiseFees: validation.data.semWiseFees.map((semFee, index: number) => ({
        finalFee: semFee.finalFee,
        feeAmount: (semWiseFee?.fee[index]) ?? 0
      }))
    }
  
    const feesDraft = await StudentFeesModel.findByIdAndUpdate(
      studentFeesData.id,
      { $set: feeData },
      { new: true, runValidators: true }
    );
  
    if (!feesDraft) 
    {
      throw createHttpError(404, 'Failed to update Fees Details');
    }
    return feesDraft;

}
  