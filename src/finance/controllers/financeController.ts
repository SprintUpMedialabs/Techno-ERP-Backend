import expressAsyncHandler from "express-async-handler";
import { transactionHistorySchema } from "../validators/transactionHistory";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Response } from "express";
import { TransactionHistory } from "../models/transactionHistory";
import createHttpError from "http-errors";

export const recordPayment = expressAsyncHandler(async (req: AuthenticatedRequest, res : Response)=>{
    console.log("Recording payment")
    const validatedData = transactionHistorySchema.safeParse(req.body);

    //TODO : We will have to verify OTP here.
    if(!validatedData.success)
        throw createHttpError(400, validatedData.error.errors[0]);

    const payment = await TransactionHistory.create(validatedData.data);
  
    res.status(201).json({ 
      success: true,
      message: 'Payment recorded successfully', 
      data: payment 
    });
});