import { ApplicationStatus } from "aws-sdk/clients/kinesisanalytics";
import createHttpError from "http-errors";
import { fetchCourseFeeByCourse, fetchOtherFees } from "../../fees/courseAndOtherFees.controller";
import { Enquiry } from "../models/enquiry";
import { StudentFeesModel } from "../models/studentFees";
import { feesUpdateSchema, IFeesUpdateSchema } from "../validators/studentFees";
import { checkIfStudentAdmitted } from "./checkIfStudentAdmitted";

export const updateFeeDetails = async (applicationStatusList: ApplicationStatus[], studentFeesData: IFeesUpdateSchema) => {
    const validation = feesUpdateSchema.safeParse(studentFeesData);
  
    if (!validation.success) 
    {
      throw createHttpError(400, validation.error.errors[0]);
    }
  
    const enquiry = await Enquiry.findOne({
      studentFee: studentFeesData.id,
      applicationStatus: { $nin: [...applicationStatusList] }
     }, 
     {
        course: 1, // Only return course field
        telecaller : 1,
        counsellor : 1
     })
     .lean();
  
    if (!enquiry) 
    {
      throw createHttpError(404, 'Could not find valid Enquiry');
    }
  
    await checkIfStudentAdmitted(enquiry._id);
 

    const otherFees = await fetchOtherFees();
    const semWiseFee = await fetchCourseFeeByCourse(enquiry?.course);
  
    const feeData = {
      ...validation.data,
      otherFees: validation.data.otherFees.map(fee => ({
        ...fee,
        feeAmount: otherFees?.find(otherFee => otherFee.type == fee.type)?.fee ?? 0
      })),
      semWiseFees: validation.data.semWiseFees.map((semFee, index: number) => ({
        finalFee: semFee.finalFee,
        feeAmount: (semWiseFee?.fee[index]) ?? 0
      })),
      // counsellor : validation.data.counsellor,
      // telecaller : validation.data.telecaller
    }
  
    const feesDraft = await StudentFeesModel.findByIdAndUpdate(
      studentFeesData.id,
      { $set: feeData },
      { new: true, runValidators: true }
    );

    const enquiryUpdatePayload: Record<string, any> = {};
    if (studentFeesData.counsellor) 
    {
      enquiryUpdatePayload.counsellor = studentFeesData.counsellor;
    }
    
    if (studentFeesData.telecaller) 
    {
      enquiryUpdatePayload.telecaller = studentFeesData.telecaller;
    }

    if (Object.keys(enquiryUpdatePayload).length > 0) {
      await Enquiry.findByIdAndUpdate(enquiry._id, {
        $set: enquiryUpdatePayload
      });
    }
    
    if (!feesDraft) 
    {
      throw createHttpError(404, 'Failed to update Fees Details');
    }
    return {
      ...feesDraft,
      telecaller : enquiryUpdatePayload.telecaller ?? enquiry.telecaller ,
      counsellor : enquiryUpdatePayload.counsellor ?? enquiry.counsellor
    };

}
  