import createHttpError from 'http-errors';
import mongoose, { Schema, Types } from 'mongoose';
import { AdmissionMode, AdmissionReference, AdmittedThrough, ApplicationStatus, AreaType, BloodGroup, Category, COLLECTION_NAMES, Course, Gender, Religion, StatesOfIndia } from '../../config/constants';
import { convertToDDMMYYYY, convertToMongoDate } from '../../utils/convertDateToFormatedDate';
import { contactNumberSchema, emailSchema } from '../../validators/commonSchema';
import { IEnquirySchema } from '../validators/enquiry';
import { academicDetailFormSchema } from './academicDetail';
import { addressSchema } from './address';
import { previousCollegeDataSchema } from './previousCollegeData';
import { singleDocumentSchema } from './singleDocument';
import { entranceExamDetailSchema } from './entranceExamDetail';

export interface IEnquiryDocument extends IEnquirySchema, Document {
  formNo: string;
  date: Date;
  photoNo: number;
  universityId: string;
  admittedThrough: string;
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
    bloodGroup: {
      type: String,
      enum: Object.values(BloodGroup)
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
      validate: {
        validator: (stuPhNum: string) => {
          if (!stuPhNum) return true; // Skip validation if not provided
          return contactNumberSchema.safeParse(stuPhNum).success;
        },
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
    aadharNumber: {
      type: String,
      validate: {
        validator: (aadhar: string) => aadhar.length === 12,
        message: 'Invalid Aadhar Number'
      }
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
      type: [Schema.Types.Mixed], // Allows ObjectId or String
      validate: {
        validator: function (values) {
          if (!Array.isArray(values)) return false; // Ensure it's an array

          return values.every(value => {
            // Allow null or undefined
            if (value === null || value === undefined) return true;

            // Check for valid ObjectId
            const isObjectId = mongoose.Types.ObjectId.isValid(value);

            // Allow string 'Other'
            const isOther = value === 'Other';

            return isObjectId || isOther;
          });
        },
        message: props => `'${props.value}' contains an invalid counsellor (must be ObjectId or 'Other')`
      },
      required: true,
    },
    remarks: {
      type: String
    },
    admittedBy: {
      type: Schema.Types.Mixed, // Allows ObjectId or String
      validate: {
        validator: function (value) {
          // Allow null or undefined
          if (value === null || value === undefined) return true;

          // Check for valid ObjectId
          const isObjectId = Types.ObjectId.isValid(value);

          // Allow string 'Other'
          const isOther = value === 'Other';

          return isObjectId || isOther;
        },
        message: props => `'${props.value}' is not a valid counsellor (must be ObjectId or 'Other')`
      },
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
    stateOfDomicile: {
      type: String,
      enum: {
        values: Object.values(StatesOfIndia),
        message: 'Invalid state of domicile value'
      }
    },
    areaType: {
      type: String,
      enum: {
        values: Object.values(AreaType),
        message: 'Invalid area type'
      }
    },
    nationality: {
      type: String
    },
    entranceExamDetails: {
      type: entranceExamDetailSchema
    },
    studentFee: {
      type: Schema.Types.ObjectId,
      ref: COLLECTION_NAMES.STUDENT_FEE, // Refer to FeesDraft model
      required: false
    },
    studentFeeDraft: {
      type: Schema.Types.ObjectId,
      ref: COLLECTION_NAMES.STUDENT_FEE_DRAFT,
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
    counsellor: {
      type: [Schema.Types.Mixed],
      validate: {
        validator: function (values) {
          if (!Array.isArray(values)) return false; // Ensure it's an array

          return values.every(value => {
            // Allow null or undefined
            if (value === null || value === undefined) return true;

            // Check for valid ObjectId
            const isObjectId = mongoose.Types.ObjectId.isValid(value);

            // Allow string 'Other' 
            const isOther = value === 'Other';

            return isObjectId || isOther;
          });
        },
        message: props => `'${props.value}' contains an invalid counsellor (must be ObjectId or 'Other')`
      },
    },
    religion: {
      type: String,
      enum: Object.values(Religion)
    },
    admittedThrough: {
      type: String,
      enum: Object.values(AdmittedThrough)
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
  ['dateOfEnquiry', 'dateOfAdmission', 'dateOfBirth', 'dueBy'].forEach((key) => {
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

export const Enquiry = mongoose.model<IEnquiryDocument>(COLLECTION_NAMES.ENQUIRY, enquirySchema);