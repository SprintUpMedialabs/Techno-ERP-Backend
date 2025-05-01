import createHttpError from "http-errors";
import { Types } from "mongoose";
import { Enquiry } from "../models/enquiry";
import { ApplicationStatus } from "aws-sdk/clients/kinesisanalytics";

// DA: need to revise this logic
export const checkIfStudentAdmitted = async (enquiryId: Types.ObjectId, expectedApplicationStatus?: ApplicationStatus) => {
  const student = await Enquiry.findById(enquiryId);
  if (student?.universityId != null && (student?.applicationStatus === expectedApplicationStatus || !expectedApplicationStatus)) {
    throw createHttpError(400, 'Student is already admitted');
  }
}

export const checkStudentByStatus = async (enquiryId: Types.ObjectId, expectedApplicationStatus?: ApplicationStatus) => {
  const student = await Enquiry.findById(enquiryId);
  if (student?.applicationStatus === expectedApplicationStatus || !expectedApplicationStatus) {
    throw createHttpError(400, 'Student form is not allowed to update.');
  }
}

