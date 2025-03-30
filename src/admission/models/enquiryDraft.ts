import createHttpError from "http-errors";
import mongoose, { Schema } from "mongoose"
import { convertToDDMMYYYY, convertToMongoDate } from "../../utils/convertDateToFormatedDate";
import { AdmissionMode, AdmissionReference, Category, Course, Gender } from "../../config/constants";
import { IEnquirySchema } from "../validators/enquiry";
import { contactNumberSchema, emailSchema } from "../../validators/commonSchema";
import { academicDetailFormSchema } from "./academicDetail";
import { addressSchema } from "./address";

export interface IEnquiryDraftDocument extends IEnquirySchema, Document { }


export const enquiryDraftSchema = new Schema<IEnquiryDraftDocument>(
    {
        admissionMode: {
            type: String,
            enum: {
                values: Object.values(AdmissionMode),
                message: 'Invalid Admission Mode value'
            },
            required: false,
            default: AdmissionMode.OFFLINE
        },
        dateOfEnquiry: {
            type: Date,
            default: new Date(),
            set: (value: string) => {
                return convertToMongoDate(value);
            },
            required: false

        },
        studentName: {
            type: String,
            required: true
        },
        studentPhoneNumber: {
            type: String,
            required: true,
            validate: {
                validator: (stuPhNum: string) => contactNumberSchema.safeParse(stuPhNum).success,
                message: 'Invalid Phone Number'
            },
        },
        emailId: {
            type: String,
            validate: {
                validator: (email: string) => emailSchema.safeParse(email).success,
                message: 'Invalid email format'
            },
            required: false
        },
        fatherName: {
            type: String,
            required: false
        },
        fatherPhoneNumber: {
            type: String,
            validate: {
                validator: (stuPhNum: string) => contactNumberSchema.safeParse(stuPhNum).success,
                message: 'Invalid Father Phone Number'
            },
            required: false
        },
        fatherOccupation: {
            type: String,
            required: false
        },
        motherName: {
            type: String,
            required: false
        },
        motherPhoneNumber: {
            type: String,
            validate: {
                validator: (stuPhNum: string) => contactNumberSchema.safeParse(stuPhNum).success,
                message: 'Invalid Mother Phone Number'
            },
            required: false
        },
        motherOccupation: {
            type: String,
            required: false
        },
        dateOfBirth: {
            type: Date,
            set: (value: string) => {
                return convertToMongoDate(value);
            },
            required: false
        },
        category: {
            type: String,
            enum: {
                values: Object.values(Category),
                message: 'Invalid Category value'
            },
            required: false
        },
        course: {
            type: String,
            enum: {
                values: Object.values(Course),
                message: 'Invalid Course value'
            },
            required: false
        },
        reference: {
            type: String,
            enum: {
                values: Object.values(AdmissionReference),
                message: 'Invalid Admission Reference value'
            },
            required: false
        },
        address: {
            type: addressSchema,
            minlength: [5, 'Address must be at least 5 characters long'],
            required: false
        },
        academicDetails: {
            type: [academicDetailFormSchema],
            default: [],
            required: false
        },
        // DTODO: here we have id and other 2 value [so type should be according to that]
        counsellor: {
            type: Schema.Types.Mixed, // Allows ObjectId or String
            validate: {
                validator: function (value) {
                    // Allow null or undefined
                    if (value === null || value === undefined) return true;

                    // Check for valid ObjectId
                    const isObjectId = mongoose.Types.ObjectId.isValid(value);

                    // Allow string 'other'
                    const isOther = value === 'other';

                    return isObjectId || isOther;
                },
                message: props => `'${props.value}' is not a valid counsellor (must be ObjectId or 'other')`
            },
            required: false,
        },
        // DTODO: here we have id and other 2 value [so type should be according to that]
        // this change need to be done in other models [studentFeesDraft, studentFees, enquiry]
        telecaller: {
            type: Schema.Types.Mixed, // Allows ObjectId or String
            validate: {
                validator: function (value) {
                    // Allow null or undefined
                    if (value === null || value === undefined) return true;

                    // Check for valid ObjectId
                    const isObjectId = mongoose.Types.ObjectId.isValid(value);

                    // Allow string 'other'
                    const isOther = value === 'other';

                    return isObjectId || isOther;
                },
                message: props => `'${props.value}' is not a valid counsellor (must be ObjectId or 'other')`
            },
            required: false,
        },
        dateOfCounselling: {
            type: Date,
            required: false,
            set: (value: string) => {
                return convertToMongoDate(value);
            }
        },
        remarks: {
            type: String
        },

        gender: {
            type: String,
            enum: {
                values: Object.values(Gender),
                message: 'Invalid gender value'
            }
        },
    },
    { timestamps: true }
);



const handleDraftMongooseError = (error: any, next: Function) => {
    if (error.name === 'ValidationError') {
        const firstError = error.errors[Object.keys(error.errors)[0]];
        throw createHttpError(400, firstError.message);
    } else {
        next(error);
    }
};

enquiryDraftSchema.post('save', function (error: any, doc: any, next: Function) {
    handleDraftMongooseError(error, next);
});

enquiryDraftSchema.post('findOneAndUpdate', function (error: any, doc: any, next: Function) {
    handleDraftMongooseError(error, next);
});


const transformDates = (_: any, ret: any) => {
    ['dateOfEnquiry', 'dateOfBirth', 'dateOfCounselling'].forEach((key) => {
        if (ret[key]) {
            ret[key] = convertToDDMMYYYY(ret[key]);
        }
    });
    return ret;
};

enquiryDraftSchema.set('toJSON', { transform: transformDates });
enquiryDraftSchema.set('toObject', { transform: transformDates });

export const EnquiryDraft = mongoose.model<IEnquiryDraftDocument>('EnquiryDraft', enquiryDraftSchema);
