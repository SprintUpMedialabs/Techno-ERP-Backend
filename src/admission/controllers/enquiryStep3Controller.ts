import expressAsyncHandler from "express-async-handler";
import createHttpError from "http-errors";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { ADMISSION, ApplicationStatus } from "../../config/constants";
import { formatResponse } from "../../utils/formatResponse";
import { checkIfStudentAdmitted } from "../helpers/checkIfStudentAdmitted";
import { Enquiry } from "../models/enquiry";
import { IEnquiryDraftStep3Schema, enquiryDraftStep3Schema, enquiryStep3UpdateRequestSchema } from "../validators/enquiry";
import { Response } from "express";
import { functionLevelLogger } from "../../config/functionLevelLogging";
import mongoose from "mongoose";
import { uploadToS3 } from "../../config/s3Upload";
import { singleDocumentSchema } from "../validators/singleDocumentSchema";
import { DocumentType } from "../../config/constants";

export const saveStep3Draft = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {

  const data: IEnquiryDraftStep3Schema = req.body;

  const validation = enquiryDraftStep3Schema.safeParse(data);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  const { id, ...validatedData } = validation.data;

  const enquiry = await Enquiry.findByIdAndUpdate(
    id,
    { ...validatedData },
    { new: true, runValidators: true }
  );

  return formatResponse(res, 200, 'Created Step 3 draft successfully', true, enquiry);

}));



export const updateEnquiryStep3ById = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {

  const validation = enquiryStep3UpdateRequestSchema.safeParse(req.body);

  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0]);
  }

  const { id, ...data } = validation.data;

  await checkIfStudentAdmitted(id);

  const enquiry = await Enquiry.findOne({
    _id: id,
    applicationStatus: { $ne: ApplicationStatus.STEP_1 }
  }, { applicationStatus: 1 });

  if (!enquiry) {
    // is it can't happen that id was not exists so case which is possible is that ki student only did step1 and came to register [we are ignoring postman possibility here]
    throw createHttpError(400, "Please complete step 1 first");
  }


  const updatedData = await Enquiry.findByIdAndUpdate(id, { ...data, }, { new: true, runValidators: true });

  return formatResponse(res, 200, 'Enquiry data updated successfully', true, updatedData);

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

  await checkIfStudentAdmitted(id);


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

