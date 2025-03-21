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

//Search in enquiry table using student name and student phone number
//Get the enquiry using the _id, if the feesDraft_id exists, then it means that we just need to update the draft, else in other case, we need to create the feeDraftObject.
// DTODO: shift this to getEnquiryData => Done


//Out of all enquiry IDs, we will select one enquiry ID to check for fee draft data.
export const getFeesDraftByEnquiryId = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

    const { enquiryId } = req.body;
    
    // DTODO: add validation => Done
    const validation = objectIdSchema.safeParse(enquiryId);
    if (!validation.success) {
        throw createHttpError(400, 'Invalid Enquiry Id');
    }

    const isFeeDraftExist = await Enquiry.exists({
        _id: enquiryId, 
        feesDraftId: { $exists: true, $ne: null }
    })


    let feesDraft;
    if(!isFeeDraftExist)
    {
        throw createHttpError(404, 'No fee draft exists, please create one!');
    }
    else
    {
        const enquiry = await Enquiry.findById(enquiryId);
        feesDraft = await FeesDraftModel.findById(enquiry!.feesDraftId);
    }

    return formatResponse(res, 200, 'Fees Draft Fetched successfully', true, feesDraft);
});



export const createFeesDraft = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

    const feesDraftData: IFeesDraftRequestSchema = req.body;

    const validation = feesDraftRequestSchema.safeParse(feesDraftData);

    if (!validation.success)
        throw createHttpError(400, validation.error.errors[0]);

    // DTODO: check here 1st enquiry is available or not => Done
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
    const feesDraftUpdateData : IFeesDraftUpdateSchema = req.body; 

    // DTODO: give var name as updateFeesDraftRequest and validate it using zod schema => Changed
    // DTODO: is this required?
    const validation = feesDraftUpdateSchema.safeParse(feesDraftUpdateData);

    if (!validation.success)
        throw createHttpError(404, validation.error.errors[0]);

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