import expressAsyncHandler from "express-async-handler"
import { deleteFromS3 } from "../config/s3Delete"
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Response } from "express";
import { formatResponse } from "../../utils/formatResponse";

export const deleteFileFromS3UsingUrl = expressAsyncHandler(async (req : AuthenticatedRequest, res: Response) => {

    const { documentUrl } = req.body;
    await deleteFromS3(documentUrl);

    return formatResponse(res, 200, 'Removed successfully from AWS', true);
})