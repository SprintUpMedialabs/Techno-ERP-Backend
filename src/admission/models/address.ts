import { Schema } from "mongoose";
import { IAddressSchema } from "../validators/addressSchema";

export interface IAddressDocument extends IAddressSchema, Document {}

export const addressSchema = new Schema<IAddressDocument>({
  permanentAddress: { type: String },
  district: { type: String },
  pincode: {
    type: String,
    validate: {
      validator: (value: string) => /^[1-9][0-9]{5}$/.test(value),
      message: 'Pincode must be a 6-digit number starting with a non-zero digit'
    }
  },
  state: { type: String },
  country: { type: String }
});
