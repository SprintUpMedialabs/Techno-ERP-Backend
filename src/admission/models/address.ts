import { Schema } from "mongoose";
import { IAddressSchema } from "../../validators/commonSchema";
import { Countries, Districts, StatesOfIndia } from "../../config/constants";

export interface IAddressDocument extends IAddressSchema, Document {}

export const addressSchema = new Schema<IAddressDocument>({
  addressLine1 : { type: String },
  addressLine2 : { type: String },
  district: { type: String,
    enum : {
      values : Object.values(Districts),
      message: 'Invalid District value'
    }
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
    enum: {
      values: Object.values(StatesOfIndia),
      message: 'Invalid State value'
    },
  },
  country: { type: String,
    enum : {
      values : Object.values(Countries),
      message: 'Invalid Country value'
    }
   }
});
