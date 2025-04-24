import createHttpError from 'http-errors';
import mongoose, { Schema, Types } from 'mongoose';
import { AdmissionMode, AdmissionReference, AdmittedThrough, ApplicationStatus, Category, COLLECTION_NAMES, Course, Gender } from '../../config/constants';
import { convertToDDMMYYYY } from '../../utils/convertDateToFormatedDate';
import { contactNumberSchema, emailSchema } from '../../validators/commonSchema';
import { IStudentSchema } from '../validators/student';
import { addressSchema } from '../../admission/models/address';
import { academicDetailFormSchema } from '../../admission/models/academicDetail';
import { singleDocumentSchema } from '../../admission/models/singleDocument';
import { previousCollegeDataSchema } from '../../admission/models/previousCollegeData';


export interface IStudentDocument extends IStudentSchema, Document {
  // formNo: string;
  // date: Date;
  // photoNo : number;
  // universityId : string; 
  preRegNumber: string;
  admittedThrough: string;
}

const studentSchema = new Schema<IStudentDocument>(
  {
    universityId: {
      type: String,
    },
    photoNo: {
      type: Number,
    },
    formNo: {
      type: String,
    },
    dateOfEnquiry: {
      type: Date,
      required: true,
      default: new Date(),   // DA Check : This won't come from input hence initialised it to new date.
    },
    dateOfAdmission: {
      type: Date,
    },
    admissionMode: {
      type: String,
      enum: {
        values: Object.values(AdmissionMode),
        message: 'Invalid Admission Mode value'
      }
    },
    studentName: {
      type: String,
      required: [true, 'Student Name is required']
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date is required'],
      // set: (value: string) => {
      //   let convertedDate = convertToMongoDate(value);
      //   if (!convertedDate) throw createHttpError(400,'Invalid date format, expected DD-MM-YYYY');
      //   return convertedDate;
      // }
    },
    studentPhoneNumber: {
      type: String,
      validate: {
        validator: (stuPhNum: string) => contactNumberSchema.safeParse(stuPhNum).success,
        message: 'Invalid Phone Number'
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
    category: {
      type: String,
      enum: {
        values: Object.values(Category),
        message: 'Invalid Category value'
      },
      required: true
    },
    address: {
      type: addressSchema,
      required: [true, 'Address is required'],
      minlength: [5, 'Address must be at least 5 characters long']
    },

    emailId: {
      type: String,
      validate: {
        validator: (email: string) => emailSchema.safeParse(email).success,
        message: 'Invalid email format'
      }
    },
    reference: {
      type: String,
      enum: {
        values: Object.values(AdmissionReference),
        message: 'Invalid Admission Reference value'
      },
      required: [true, 'Admission Reference is required']
    },
    course: {
      type: String,
      required: [true, 'Course is required']
    },
    remarks: {
      type: String
    },
    academicDetails: {
      type: [academicDetailFormSchema],
      default: []
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
      optional: true
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
        message: 'Invalid Course value'
      },
      required: true
    },
    preRegNumber: {
      type: String,
      optional: true
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
      }
    },
    admittedThrough: {
      type: String,
      enum: Object.values(AdmittedThrough)
    },
    semester: {
      type: Number,
      default: 1
    },
    academicYear: {
      type: String,
      match: /^\d{4}-\d{4}$/,
      default: () => {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        return `${currentYear}-${(currentYear + 1).toString()}`;
      }
    },
  },
  { timestamps: true }
);




studentSchema.pre<IStudentDocument>('save', async function (next) {
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

studentSchema.post('save', function (error: any, doc: any, next: Function) {
  handleMongooseError(error, next);
});

studentSchema.post('findOneAndUpdate', function (error: any, doc: any, next: Function) {
  handleMongooseError(error, next);
});

const transformDates = (_: any, ret: any) => {
  ['dateOfEnquiry', 'dateOfAdmission', 'dateOfBirth', 'dueBy'].forEach((key) => {
    if (ret[key]) {
      ret[key] = convertToDDMMYYYY(ret[key]);
    }
  });
  return ret;
};

studentSchema.set('toJSON', { transform: transformDates });
studentSchema.set('toObject', { transform: transformDates });

export const Student = mongoose.model<IStudentDocument>(COLLECTION_NAMES.STUDENT, studentSchema);
