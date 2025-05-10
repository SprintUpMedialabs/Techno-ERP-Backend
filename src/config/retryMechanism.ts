import mongoose from "mongoose";
import { sendEmail } from "./mailer";
import { DEVELOPER_EMAIL } from "../secrets";
import createHttpError from "http-errors";

export async function retryMechanism ( handler : (session : mongoose.ClientSession) => Promise<void>, emailSubject : any, emailMessage : any, maxRetries = 5, delayMs = 500 ){
    for(let attempt = 1; attempt <= maxRetries; attempt++){
        const session = await mongoose.startSession();
        try {
            session.startTransaction();
            await handler(session);
            await session.commitTransaction();
            session.endSession();
            return;
        } 
        catch (error : any) {
            await session.abortTransaction();
            session.endSession();
            if(attempt == maxRetries){
                await sendEmail(DEVELOPER_EMAIL, emailSubject, emailMessage);
                throw createHttpError(400, error.message);
            }
            await new Promise(res => setTimeout(res, delayMs));
        }
    }
}