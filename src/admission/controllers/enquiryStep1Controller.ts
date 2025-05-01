import { Response } from "express";
import expressAsyncHandler from "express-async-handler";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { AdmittedThrough, ApplicationStatus, Course, DropDownType } from "../../config/constants";
import { functionLevelLogger } from "../../config/functionLevelLogging";
import { updateOnlyOneValueInDropDown } from "../../utilityModules/dropdown/dropDownMetadataController";
import { formatResponse } from "../../utils/formatResponse";
import { checkIfStudentAdmitted } from "../helpers/checkIfStudentAdmitted";
import { Enquiry } from "../models/enquiry";
import { EnquiryDraft } from "../models/enquiryDraft";
import { enquiryStep1RequestSchema, enquiryStep1UpdateRequestSchema } from "../validators/enquiry";

export const createEnquiry = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {

  const data = req.body;
  const { _id: id, ...enquiryData } = data;
  const validation = enquiryStep1RequestSchema.safeParse(enquiryData);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  const admittedThrough = enquiryData.course === Course.BED ? AdmittedThrough.COUNSELLING : AdmittedThrough.DIRECT;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    //Delete enquiry draft only if saving enquiry is successful.
    if (id) {
      const deletedDraft = await EnquiryDraft.findByIdAndDelete(id, { session });
      if (!deletedDraft) {
        throw formatResponse(res, 404, 'Error occurred while deleting the enquiry draft', true);
      }
    }
    const savedResult = await Enquiry.create([{ ...enquiryData, _id: id, admittedThrough, applicationStatus: ApplicationStatus.STEP_2 }], { session });
    const enquiry = savedResult[0];

    updateOnlyOneValueInDropDown(DropDownType.DISTRICT, enquiry.address?.district);

    await session.commitTransaction();
    return formatResponse(res, 201, 'Enquiry created successfully', true, enquiry);
  } catch (error: any) {
    await session?.abortTransaction();
    session?.endSession();
    throw createHttpError(error);
  }

}));



export const updateEnquiryStep1ById = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {
  const validation = enquiryStep1UpdateRequestSchema.safeParse(req.body);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  const { id, ...data } = validation.data;

  await checkIfStudentAdmitted(id);

  const updatedData = await Enquiry.findByIdAndUpdate(
    { _id: id },
    { $set: data },
    { new: true, runValidators: true }
  );

  return formatResponse(res, 200, 'Enquiry data updated successfully', true, updatedData);

}));