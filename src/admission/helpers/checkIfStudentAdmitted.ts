import createHttpError from "http-errors";
import { Types } from "mongoose";
import { Enquiry } from "../models/enquiry";
import { ApplicationStatus } from "aws-sdk/clients/kinesisanalytics";

export const checkIfStudentAdmitted = async (enquiryId: Types.ObjectId, expectedApplicationStatus?: ApplicationStatus) => {
  const student = await Enquiry.findById(enquiryId);
  if (student?.universityId != null && (student?.applicationStatus === expectedApplicationStatus || !expectedApplicationStatus)) {
    throw createHttpError(400, 'Student is already admitted');
  }
}