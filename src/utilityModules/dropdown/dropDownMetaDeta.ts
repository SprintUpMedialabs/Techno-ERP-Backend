import { model, Schema } from "mongoose";
import { COLLECTION_NAMES, DropDownType } from "../../config/constants";

export interface IDropDownMetaData extends Document {
    type: DropDownType;
    value: string[];
}

const dropDownMetaDataSchema = new Schema<IDropDownMetaData>({
    type: {
        type: String,
        enum: {
            values: Object.values(DropDownType),
            message: 'Invalid config name'
        },
        required: [true, 'Name is required'],
        unique: true //
    },
    value: {
        type: [String],
        default: ['other'],
        validate: {
            validator: (arr: string[]) => arr.every(v => typeof v === 'string'),
            message: 'All values must be strings'
        }
    }
}, { timestamps: true });

const removeExtraFields = (_: any, ret: any) => {
    delete ret.__v;
    delete ret.createdAt;
    delete ret.updatedAt;
    return ret;
}

dropDownMetaDataSchema.set('toJSON', {
    transform: removeExtraFields
});
dropDownMetaDataSchema.set('toObject', {
    transform: removeExtraFields
});

export const DropDownMetaData = model<IDropDownMetaData>(COLLECTION_NAMES.DROP_DOWN_META_DATA, dropDownMetaDataSchema);
