import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { ApplicationStatus } from "../../config/constants";
import { formatResponse } from "../../utils/formatResponse";
import { updateFeeDetails } from "../helpers/updateFeeDetails";
import { IFeesUpdateSchema } from "../validators/studentFees";
import { Response } from "express";
import { functionLevelLogger } from "../../config/functionLevelLogging";

export const updateEnquiryStep4ById = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {
    const feesDraftUpdateData: IFeesUpdateSchema = req.body;
  
    // DA: will update this after having discussion with vb.
    const feesDraft = await updateFeeDetails([ApplicationStatus.STEP_4], feesDraftUpdateData);
    return formatResponse(res, 200, 'Fees Draft updated successfully', true, feesDraft);
}));