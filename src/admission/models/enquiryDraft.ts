import createHttpError from "http-errors";
import mongoose, { Schema } from "mongoose"
import { convertToDDMMYYYY } from "../../utils/convertDateToFormatedDate";
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
            }
        },
        dateOfEnquiry: {
            type: Date,
            required: true,
            default: new Date(),
        },
        studentName: {
            type: String,
            required: [true, 'Student Name is required']
        },
        studentPhoneNumber: {
            type: String,
            validate: {
                validator: (stuPhNum: string) => contactNumberSchema.safeParse(stuPhNum).success,
                message: 'Invalid Phone Number'
            }
        },
        emailId: {
            type: String,
            validate: {
                validator: (email: string) => emailSchema.safeParse(email).success,
                message: 'Invalid email format'
            }
        },
        fatherName: {
            type: String,
            required: [true, "Father's Name is required"]
        },
        fatherPhoneNumber: {
            type: String,
            required: [true, 'Father Phone Number is required.'],
            validate: {
                validator: (stuPhNum: string) => contactNumberSchema.safeParse(stuPhNum).success,
                message: 'Invalid Father Phone Number'
            }
        },
        fatherOccupation: {
            type: String,
            required: [true, 'Father occupation is required']
        },
        motherName: {
            type: String,
            required: [true, "Mother's Name is required"]
        },
        motherPhoneNumber: {
            type: String,
            required: [true, 'Mother Phone Number is required.'],
            validate: {
                validator: (stuPhNum: string) => contactNumberSchema.safeParse(stuPhNum).success,
                message: 'Invalid Mother Phone Number'
            }
        },
        motherOccupation: {
            type: String,
            required: [true, 'Mother occupation is required']
        },
        dateOfBirth: {
            type: Date,
        },
        category: {
            type: String,
            enum: {
                values: Object.values(Category),
                message: 'Invalid Category value'
            }
        },
        course: {
            type: String,
            enum: {
                values: Object.values(Course),
                message: 'Invalid Course value'
            },
        },
        reference: {
            type: String,
            enum: {
                values: Object.values(AdmissionReference),
                message: 'Invalid Admission Reference value'
            },
        },
        address: {
            type: addressSchema,
            minlength: [5, 'Address must be at least 5 characters long']
        },
        academicDetails: {
            type: [academicDetailFormSchema],
            default: [],
            required: false
        },
        counsellorName: {
            type: Schema.Types.ObjectId,
            required: false
        },
        telecallerName: {
            type: Schema.Types.ObjectId,
            required: false
        },
        dateOfCounselling: {
            type: Date,
            required: false
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
        approvedBy: {
            type: Schema.Types.ObjectId,
            required: false
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
