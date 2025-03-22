import createHttpError from "http-errors";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Enquiry } from "../models/enquiryForm";
import { formatResponse } from "../../utils/formatResponse";
import expressAsyncHandler from "express-async-handler";
import { Response } from "express";
import { FeesDraftModel } from "../models/feesDraft";
import { ApplicationStatus } from "../../config/constants";
import { feesDraftRequestSchema, feesDraftUpdateSchema, IFeesDraftRequestSchema, IFeesDraftUpdateSchema } from "../validators/feesDraftSchema";
import { objectIdSchema } from "../../validators/commonSchema";

//Get fee draft using enquiry id
export const getFeesDraftByEnquiryId = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

    const { enquiryId } = req.body;

    const validation = objectIdSchema.safeParse(enquiryId);
    if (!validation.success) {
        throw createHttpError(400, validation.error.errors[0]);
    }

    let feesDraft;
    const enquiry = await Enquiry.findById(enquiryId).select("feesDraftId");

    if (!enquiry){
        throw createHttpError(404, 'Fee draft does not exist for this enquiry!');
    }
    else {
        feesDraft = await FeesDraftModel.findById(enquiry.feesDraftId);
    }

    return formatResponse(res, 200, 'Fees Draft Fetched successfully', true, feesDraft);
});


// TODO : Here we need to add the feeAmount as metadata.
export const createFeesDraft = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

    const feesDraftData: IFeesDraftRequestSchema = req.body;

    const validation = feesDraftRequestSchema.safeParse(feesDraftData);

    if (!validation.success){
        throw createHttpError(400, validation.error.errors[0]);
    }

    const isExist = await Enquiry.exists({
        _id: feesDraftData.enquiryId
    });

    let feesDraft;
    if (isExist) {
        //This means that enquiry is existing
        feesDraft = await FeesDraftModel.create(validation.data);
        await Enquiry.findByIdAndUpdate(
            feesDraftData.enquiryId,
            {
                $set: {
                    feesDraftId: feesDraft._id,
                    applicationStatus: ApplicationStatus.STEP_2
                }
            },
        );
    }
    else {
        //Enquiry does not exist, we have to create enquiry first.
        //This will never be true as we are getting from UI so we will land into this call if and only if enquiry Id is existing.
        throw createHttpError(400, 'Enquiry doesnot exist');
    }

    return formatResponse(res, 201, 'Fees Draft created successfully', true, feesDraft);
});



export const updateFeesDraft = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const feesDraftUpdateData: IFeesDraftUpdateSchema = req.body;

    const validation = feesDraftUpdateSchema.safeParse(feesDraftUpdateData);

    if (!validation.success){
        throw createHttpError(404, validation.error.errors[0]);
    }

    const feesDraft = await FeesDraftModel.findByIdAndUpdate(
        feesDraftUpdateData.feesDraftId,
        { $set: validation.data },
        { new: true, runValidators: true }
    );

    if (!feesDraft) {
        throw createHttpError(404, 'Failed to update Fees Draft');
    }
    return formatResponse(res, 200, 'Fees Draft updated successfully', true, feesDraft);
});



export const getEnquiryDataForApproval = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { enquiryId } = req.body;
    const enquiry = await Enquiry.findById(enquiryId)
        .populate({
            path: 'feesDraftId',
        });

    if (!enquiry){
        throw createHttpError(404, 'Cannot get enquiry');
    }

    return formatResponse(res, 200, 'Approved Enquiry', true, enquiry);
});
