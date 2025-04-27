import { AuthenticatedRequest } from "../../../auth/validators/authenticatedRequest";

import expressAsyncHandler from "express-async-handler";
import { functionLevelLogger } from "../../../config/functionLevelLogging";
import { Response } from "express";

export const getDocumentTypeByCourseCode = expressAsyncHandler(functionLevelLogger(async (req: AuthenticatedRequest, res: Response) => {
    const { courseCode } = req.params;
}));


