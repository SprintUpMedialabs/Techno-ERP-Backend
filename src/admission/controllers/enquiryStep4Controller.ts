import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { ApplicationStatus } from "../../config/constants";
import { formatResponse } from "../../utils/formatResponse";
import { updateFeeDetails } from "../helpers/updateFeeDetails";
import { IFeesUpdateSchema } from "../validators/studentFees";
import { Response } from "express";

export const updateEnquiryStep4ById = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const feesDraftUpdateData: IFeesUpdateSchema = req.body;
  
    const feesDraft = await updateFeeDetails([ApplicationStatus.STEP_1, ApplicationStatus.STEP_2, ApplicationStatus.STEP_3], feesDraftUpdateData);
    return formatResponse(res, 200, 'Fees Draft updated successfully', true, feesDraft);
  });