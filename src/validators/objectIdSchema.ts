import mongoose from "mongoose";
import { z } from "zod";

export const objectIdSchema = z.string().refine((id) => mongoose.Types.ObjectId.isValid(id), {
    message: 'Invalid ObjectId'
});