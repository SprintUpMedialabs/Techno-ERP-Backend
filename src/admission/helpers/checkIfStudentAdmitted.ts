import createHttpError from "http-errors";
import { Types } from "mongoose";
import { Enquiry } from "../models/enquiry";

export const checkIfStudentAdmitted = async (enquiryId: Types.ObjectId) => {
    const student = await Enquiry.findById(enquiryId);
    if (student?.universityId != null) 
    {
      throw createHttpError(400, 'Student is already admitted');
    }
    return false;
}