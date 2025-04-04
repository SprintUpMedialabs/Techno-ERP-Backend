import expressAsyncHandler from "express-async-handler";
import createHttpError from "http-errors";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Course, AdmittedThrough, ApplicationStatus } from "../../config/constants";
import { functionLevelLogger } from "../../config/functionLevelLogging";
import { formatResponse } from "../../utils/formatResponse";
import { Enquiry } from "../models/enquiry";
import { EnquiryDraft } from "../models/enquiryDraft";
import { IEnquiryStep1RequestSchema, enquiryStep1RequestSchema, enquiryStep1UpdateRequestSchema } from "../validators/enquiry";
import { Response } from "express";
import { checkIfStudentAdmitted } from "../helpers/checkIfStudentAdmitted";

export const createEnquiry = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {

    const data: IEnquiryStep1RequestSchema = req.body;
    const validation = enquiryStep1RequestSchema.safeParse(data);

    if (!validation.success) 
    {
      throw createHttpError(400, validation.error.errors[0]);
    }

    const { id, ...enquiryData } = data;

    const admittedThrough = enquiryData.course === Course.BED ? AdmittedThrough.COUNSELLING : AdmittedThrough.DIRECT;

    let savedResult = await Enquiry.create({ ...enquiryData, admittedThrough });

    if (savedResult) 
    {
      //Delete enquiry draft only if saving enquiry is successful.
      if (id) 
      {
        const deletedDraft = await EnquiryDraft.findByIdAndDelete(id);
        if (!deletedDraft) 
        {
          throw formatResponse(res, 494, 'Error occurred while deleting the enquiry draft', true);
        }
      }
      return formatResponse(res, 201, 'Enquiry created successfully', true, savedResult);
    }
    else 
    {
      throw createHttpError(404, 'Error occurred creating enquiry');
    }

}));



export const updateEnquiryStep1ById = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {
  const validation = enquiryStep1UpdateRequestSchema.safeParse(req.body);

  if (!validation.success)
  {
    console.log(validation.error);
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