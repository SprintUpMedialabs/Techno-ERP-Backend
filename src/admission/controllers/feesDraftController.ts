import createHttpError from "http-errors";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Enquiry } from "../models/enquiryForm";
import { formatResponse } from "../../utils/formatResponse";
import expressAsyncHandler from "express-async-handler";
import { Response } from "express";
import { FeesDraftModel } from "../models/feesDraft";
import { ApplicationStatus } from "../../config/constants";
import { feesDraftSchema } from "../validators/feesDraftSchema";

//Search in enquiry table using student name and student phone number
//Get the enquiry using the _id, if the feesDraft_id exists, then it means that we just need to update the draft, else in other case, we need to create the feeDraftObject.
// DTODO: shift this to getEnquiryData
export const searchEnquiries = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    
    const { search } = req.body;

    // DTODO: its not mandatory if its not there give all the queries. apply pagination and limit here as well.
    if (!search) {
        throw createHttpError(400, 'Please search by phone number or name!');
    }

    const enquiries = await Enquiry.find({
        $or: [
            { studentName: { $regex: search, $options: 'i' } },
            { studentPhoneNumber: { $regex: search, $options: 'i' } }
        ]
    });// DTODO: name,mobileNo,applicationId,clgId,_id,feesDraftId ... other if you think IMP

    if (enquiries.length > 0) {
        return formatResponse(res, 200, 'Enquiries corresponding to your search', true, enquiries);
    } else {
        return formatResponse(res, 200, 'No enquiries found with this information', true);
    }
}
);

//Out of all enquiry IDs, we will select one enquiry ID to check for fee draft data.
export const getFeesDraftByEnquiryId = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

    const { enquiryId } = req.body;
    // DTODO: add validation
    if (!enquiryId) {
        throw createHttpError(400, 'Enquiry ID is required');
    }

    const enquiry = await Enquiry.findById(enquiryId);

    if (!enquiry) {
        throw createHttpError(404, 'Enquiry not found');
    }

    if (!enquiry.feesDraftId) {
        throw createHttpError(404, 'No fee draft exists, please create one!');
    }

    const feesDraft = await FeesDraftModel.findById(enquiry.feesDraftId);

    if (!feesDraft) {
        throw createHttpError(404, 'FeesDraft not found');
    }

    return formatResponse(res, 200, 'Fees Draft Fetched successfully', true, feesDraft);
});



export const createFeesDraft = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { enquiryId, feesDraftData } = req.body;

    // DTODO: give var name as createFeesDraftRequest and validate it using zod schema
    if (!enquiryId) {
        throw createHttpError(400, 'Enquiry ID is required');
    }

    // DTODO: is this required?
    if (!feesDraftData) {
        throw createHttpError(400, 'Fees draft data is required');
    }

    const validation = feesDraftSchema.safeParse(feesDraftData);

    if (!validation.success)
        throw createHttpError(400, validation.error.errors[0]);

    // DTODO: use isExist
    const enquiry = await Enquiry.findById(enquiryId);
    // DTODO: check here 1st enquiry is available or not
    
    const feesDraft = await FeesDraftModel.create(validation.data);

    //There are no chances of enquiry being null, as we are getting from frontend.
    enquiry!.feesDraftId = feesDraft._id;
    //Update the application status of enquiry form.
    enquiry!.applicationStatus = ApplicationStatus.STEP_2
    await enquiry!.save();

    return formatResponse(res, 201, 'Fees Draft created successfully', true, feesDraft);
});



export const updateFeesDraft = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { feeDraftId, feesDraftData } = req.body;

    // DTODO: give var name as updateFeesDraftRequest and validate it using zod schema
    if (!feeDraftId) {
        throw createHttpError(400, 'Fee Draft ID is missing');
    }

    // DTODO: is this required?
    if (!feesDraftData) {
        throw createHttpError(400, 'Fees draft data is required');
    }

    const validation = feesDraftSchema.safeParse(feesDraftData);

    if (!validation.success)
        throw createHttpError(404, validation.error.errors[0]);

    const feesDraft = await FeesDraftModel.findByIdAndUpdate(
        feeDraftId,
        { $set: validation.data },
        { new: true, runValidators: true }
    );

    if (!feesDraft) {
        throw createHttpError(404, 'Failed to update Fees Draft');
    }
    return formatResponse(res, 200, 'Fees Draft updated successfully', true, feesDraft);
});