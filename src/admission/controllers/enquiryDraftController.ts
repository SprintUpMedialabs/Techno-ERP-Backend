import expressAsyncHandler from "express-async-handler";
import { formatResponse } from "../../utils/formatResponse";
import { enquiryDraftStep1RequestSchema, enquiryDraftStep1UpdateSchema, IEnquiryDraftStep1RequestSchema, IEnquiryDraftStep1UpdateSchema } from "../validators/enquiry";
import createHttpError from "http-errors";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { EnquiryDraft } from "../models/enquiryDraft";
import { Response } from "express";
import { functionLevelLogger } from "../../config/functionLevelLogging";
import { updateOnlyOneValueInDropDown } from "../../utilityModules/dropdown/dropDownMetadataController";
import { DropDownType } from "../../config/constants";

export const createEnquiryDraftStep1 = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {

    const data: IEnquiryDraftStep1RequestSchema = req.body;
    const validation = enquiryDraftStep1RequestSchema.safeParse(data);

    if (!validation.success) {
        throw createHttpError(400, validation.error.errors[0]);
    }

    const enquiryDraft = await EnquiryDraft.create(validation.data);

    updateOnlyOneValueInDropDown(DropDownType.DISTRICT, enquiryDraft?.address?.district);

    return formatResponse(res, 200, 'Draft created successfully', true, enquiryDraft);

}));


export const updateEnquiryDraftStep1 = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {

    const data: IEnquiryDraftStep1UpdateSchema = req.body;
    const validation = enquiryDraftStep1UpdateSchema.safeParse(data);

    if (!validation.success) {
        throw createHttpError(400, validation.error.errors[0]);
    }

    const { id, ...newData } = validation.data;

    const updatedDraft = await EnquiryDraft.findByIdAndUpdate(
        id,
        { $set: newData },
        { new: true, runValidators: true }
    );

    
    if (!updatedDraft) {
        throw createHttpError(404, 'Failed to update draft');
    }
    
    updateOnlyOneValueInDropDown(DropDownType.DISTRICT, updatedDraft?.address?.district);
    return formatResponse(res, 200, 'Draft updated successfully', true, updatedDraft);

}));
