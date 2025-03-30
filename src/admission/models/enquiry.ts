import createHttpError from 'http-errors';
import mongoose, { Schema, Types } from 'mongoose';
import { AdmissionMode, AdmissionReference, AdmittedThrough, ApplicationStatus, Category, Course, Gender } from '../../config/constants';
import { convertToDDMMYYYY, convertToMongoDate } from '../../utils/convertDateToFormatedDate';
import { contactNumberSchema, emailSchema } from '../../validators/commonSchema';
import { IEnquirySchema } from '../validators/enquiry';
import { academicDetailFormSchema } from './academicDetail';
import { addressSchema } from './address';
import { previousCollegeDataSchema } from './previousCollegeData';
import { singleDocumentSchema } from './singleDocument';

export interface IEnquiryDocument extends IEnquirySchema, Document {
  formNo: string;
  date: Date;
  photoNo: number;
  universityId: string;
}

export const enquirySchema = new Schema<IEnquiryDocument>(
  {
    admissionMode: {
      type: String,
      enum: {
        values: Object.values(AdmissionMode),
        message: 'Invalid Admission Mode value'
      },
      default: AdmissionMode.OFFLINE
    },
    dateOfEnquiry: {
      type: Date,
      required: true,
      default: new Date(),
      set: (value: string) => {
        return convertToMongoDate(value);
      }
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
      required: [true, 'Date is required'],
      set: (value: string) => {
        return convertToMongoDate(value);
      }
      // set: (value: string) => {
      //   let convertedDate = convertToMongoDate(value);
      //   if (!convertedDate) throw createHttpError(400,'Invalid date format, expected DD-MM-YYYY');
      //   return convertedDate;
      // }
    },
    category: {
      type: String,
      enum: {
        values: Object.values(Category),
        message: 'Invalid Category value'
      },
      required: true
    },
    course: {
      type: String,
      enum: {
        values: Object.values(Course),
        message: 'Invalid Course value'
      },
      required: true
    },
    reference: {
      type: String,
      enum: {
        values: Object.values(AdmissionReference),
        message: 'Invalid Admission Reference value'
      },
      required: true
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
      required: true,
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

    dateOfAdmission: {
      type: Date,
      required: false
    },

    previousCollegeData: {
      type: previousCollegeDataSchema
    },
    documents: {
      type: [singleDocumentSchema]
    },
    studentFee: {
      type: Schema.Types.ObjectId,
      ref: 'studentFee', // Refer to FeesDraft model
      required: false
    },
    studentFeeDraft: {
      type: Schema.Types.ObjectId,
      ref: 'studentFeeDraft',
      required: false
    },
    gender: {
      type: String,
      enum: {
        values: Object.values(Gender),
        message: 'Invalid gender value'
      }
    },
    applicationStatus: {
      type: String,
      enum: {
        values: Object.values(ApplicationStatus),
        message: 'Invalid Application Status value'
      },
      default: ApplicationStatus.STEP_1,
      required: true
    },
    counsellor : {
      type: Schema.Types.Mixed,
      validate: {
        validator: function (value: any) {
          return (
            value === 'other' || 
            Types.ObjectId.isValid(value)
          );
        },
        message: 'Counsellor must be a valid ObjectId or "other"',
      },
    },
    admittedThrough : {
      type : String,
      enum : Object.values(AdmittedThrough)
    },
    //Below IDs will be system generated
    universityId: {
      type: String,
    },
    photoNo: {
      type: Number,
    },
    formNo: {
      type: String,
    },

  },

  { timestamps: true }
);




enquirySchema.pre<IEnquiryDocument>('save', async function (next) {
  next();
});

const handleMongooseError = (error: any, next: Function) => {
  if (error.name === 'ValidationError') {
    const firstError = error.errors[Object.keys(error.errors)[0]];
    throw createHttpError(400, firstError.message);
  } else if (error.name == 'MongooseError') {
    throw createHttpError(400, `${error.message}`);
  } else {
    next(error); // Pass any other errors to the next middleware
  }
};

enquirySchema.post('save', function (error: any, doc: any, next: Function) {
  handleMongooseError(error, next);
});

enquirySchema.post('findOneAndUpdate', function (error: any, doc: any, next: Function) {
  handleMongooseError(error, next);
});

const transformDates = (_: any, ret: any) => {
  ['dateOfEnquiry', 'dateOfAdmission', 'dateOfBirth', 'dateOfCounselling'].forEach((key) => {
    if (ret[key]) {
      ret[key] = convertToDDMMYYYY(ret[key]);
    }
  });
  delete ret.createdAt;
  delete ret.updatedAt;
  delete ret.__v;
  return ret;
};

enquirySchema.set('toJSON', { transform: transformDates });
enquirySchema.set('toObject', { transform: transformDates });

export const Enquiry = mongoose.model<IEnquiryDocument>('Enquiry', enquirySchema);
