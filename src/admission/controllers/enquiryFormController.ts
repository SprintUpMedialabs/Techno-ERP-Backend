import { Response } from 'express';
import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from '../../auth/validators/authenticatedRequest';
import { enquiryRequestSchema, IEnquiryRequestSchema } from '../validators/enquiryForm';
import createHttpError from 'http-errors';

export const createEnquiryForm = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data: IEnquiryRequestSchema = req.body;
    const validation = enquiryRequestSchema.safeParse(data);

    if (!validation.success) {
        throw createHttpError(400, validation.error.errors[0]);
    }
});