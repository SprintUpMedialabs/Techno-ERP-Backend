import { Schema } from "mongoose";
import { Countries } from "../../config/constants";
import { IAddressSchema } from "../../validators/commonSchema";

export interface IAddressDocument extends IAddressSchema, Document { }

export const addressSchema = new Schema<IAddressDocument>({
  addressLine1: { type: String, default: '' },
  addressLine2: { type: String, default: '' },
  district: {
    type: String,
    default: ''
  },
  pincode: {
    type: String,
    validate: {
      validator: (value: string) => /^[1-9][0-9]{5}$/.test(value),
      message: 'Pincode must be a 6-digit number starting with a non-zero digit'
    }
  },
  state: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    enum: {
      values: Object.values(Countries),
      message: 'Invalid Country value'
    },
    default: Countries.India
  }
});
