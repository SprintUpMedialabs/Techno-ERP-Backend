import { Response } from "express";
import expressAsyncHandler from "express-async-handler";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { ADMISSION, ApplicationStatus, DocumentType, DropDownType } from "../../config/constants";
import { functionLevelLogger } from "../../config/functionLevelLogging";
import { uploadToS3 } from "../../config/s3Upload";
import { updateOnlyOneValueInDropDown } from "../../utilityModules/dropdown/dropDownMetadataController";
import { formatResponse } from "../../utils/formatResponse";
import { Enquiry } from "../models/enquiry";
import { IEnquiryDraftStep3Schema, enquiryDraftStep3Schema, enquiryStep3UpdateRequestSchema, otpSchemaForStep3 } from "../validators/enquiry";
import { singleDocumentSchema } from "../validators/singleDocumentSchema";
import { sendOTP, validateOTP } from "../../common/otpController";

export const saveStep3Draft = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {

  const data: IEnquiryDraftStep3Schema = req.body;

  const validation = enquiryDraftStep3Schema.safeParse(data);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }
  const { id, ...validatedData } = validation.data;

  const isEnquiryExists = await Enquiry.exists({
    _id: id,
    applicationStatus: ApplicationStatus.STEP_3
  });
  if (!isEnquiryExists) {
    throw createHttpError(400, 'Enquiry not found');
  }

  const enquiry = await Enquiry.findByIdAndUpdate(
    id,
    { ...validatedData, applicationStatus: ApplicationStatus.STEP_3 },
    { new: true, runValidators: true }
  );

  updateOnlyOneValueInDropDown(DropDownType.DISTRICT, enquiry?.address?.district);
  return formatResponse(res, 200, 'Created Step 3 draft successfully', true, enquiry);
}));



export const updateEnquiryStep3ById = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {

  const validation = enquiryStep3UpdateRequestSchema.safeParse(req.body);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  const { id, ...data } = validation.data;

  const isEnquiryExists = await Enquiry.exists({
    _id: id,
    applicationStatus: ApplicationStatus.STEP_3
  });

  if (!isEnquiryExists) {
    throw createHttpError(400, 'Enquiry not found');
  }

  const updatedData = await Enquiry.findByIdAndUpdate(id, { ...data, applicationStatus: ApplicationStatus.STEP_3 }, { new: true, runValidators: true });
  await sendOTP(updatedData!.emailId);

  updateOnlyOneValueInDropDown(DropDownType.DISTRICT, updatedData?.address?.district);
  return formatResponse(res, 200, 'Enquiry data updated successfully', true, updatedData);
}));

export const verifyOtpAndUpdateEnquiryStatus = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {

  const validation = otpSchemaForStep3.safeParse(req.body);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  const { id, otp } = validation.data;

  const enquiry = await Enquiry.findOne({ _id: id, applicationStatus: ApplicationStatus.STEP_3 });

  if (!enquiry) {
    throw createHttpError(400, 'Enquiry not found');
  }

  await validateOTP(enquiry.emailId, otp);

  await Enquiry.findByIdAndUpdate(id, { applicationStatus: ApplicationStatus.STEP_4 }, { runValidators: true });

  return formatResponse(res, 200, 'Enquiry status updated successfully', true);
}));

export const updateEnquiryDocuments = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {

  const { id, type, dueBy } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createHttpError(400, 'Invalid enquiry ID');
  }
  const file = req.file as Express.Multer.File | undefined;

  const validation = singleDocumentSchema.safeParse({
    id: id,
    type: type,
    dueBy: dueBy,
    file: file
  });

  const isEnquiryExists = await Enquiry.exists({
    _id: id,
    applicationStatus: ApplicationStatus.STEP_3
  });

  if (!isEnquiryExists) {
    throw createHttpError(400, 'Enquiry not found');
  }

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  // Fetch existing document details
  const existingDocument = await Enquiry.findOne(
    { _id: id, 'documents.type': type },
    { 'documents.$': 1 }
  );

  let fileUrl;
  let finalDueBy;
  if (existingDocument?.documents) {
    fileUrl = existingDocument?.documents[0]?.fileUrl;
    finalDueBy = existingDocument?.documents[0]?.dueBy;
  }


  if (file) {
    fileUrl = await uploadToS3(id.toString(), ADMISSION, type as DocumentType, file);
    if (req.file) {
      req.file.buffer = null as unknown as Buffer;
    }
  }

  if (dueBy) {
    finalDueBy = dueBy;
  }

  if (existingDocument) {
    if (!file && !dueBy) {
      throw createHttpError(400, 'No new data provided to update');
    }

    const updateFields: any = {};
    if (fileUrl) {
      updateFields['documents.$[elem].fileUrl'] = fileUrl;
    }
    if (finalDueBy) {
      updateFields['documents.$[elem].dueBy'] = finalDueBy;
    }

    const updatedData = await Enquiry.findOneAndUpdate(
      { _id: id, 'documents.type': type },
      { $set: updateFields },
      {
        new: true,
        runValidators: true,
        arrayFilters: [{ 'elem.type': type }],
      }
    );

    return formatResponse(res, 200, 'Document updated successfully', true, updatedData);
  }
  else {
    const documentData: Record<string, any> = { type, fileUrl };
    if (finalDueBy) {
      documentData.dueBy = finalDueBy;
    }
    const updatedData = await Enquiry.findByIdAndUpdate(id, { $push: { documents: documentData } }, { new: true, runValidators: true });
    return formatResponse(res, 200, 'New document created successfully', true, updatedData);
  }

}));