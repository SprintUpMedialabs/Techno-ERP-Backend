import createHttpError from 'http-errors';
import mongoose, { Schema } from 'mongoose';
import { AdmissionReference, ApplicationIdPrefix, ApplicationStatus, Category, Course, Gender } from '../../config/constants';
import { convertToDDMMYYYY } from '../../utils/convertDateToFormatedDate';
import { contactNumberSchema, emailSchema } from '../../validators/commonSchema';
import { IEnquirySchema } from '../validators/enquiry';
import { academicDetailFormSchema } from './academicDetail';
import { addressSchema } from './address';
import { EnquiryApplicationId } from './enquiryApplicationIdSchema';
import { previousCollegeDataSchema } from './previousCollegeData';
import { singleDocumentSchema } from './singleDocument';

export interface IEnquiryDocument extends IEnquirySchema, Document {
  applicationId: string;
  date: Date;
}

const enquirySchema = new Schema<IEnquiryDocument>(
  {
    applicationId: {
      type: String,
      unique: true,
      // required: true,
      //We will not use required here as application Id is created in pre('save') hook so as order of execution the enquiry object is created first, which might fail as part of validation, the application ID is required which is created after the validations are done. Hence save is getting executed after validation, so we have the validator and not required as true.
      validate: {
        validator: function (value: string) {
          return !!value;
        },
        message: 'ApplicationId is required'
      },
      index: true
    },
    dateOfEnquiry: {
      type: Date,
      required: true,
    },
    dateOfAdmission: {
      type: Date,
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
  },
  { timestamps: true }
);

const getPrefixForCourse = (course: Course): ApplicationIdPrefix => {
  if (course === Course.MBA) return ApplicationIdPrefix.TIMS;
  if (course === Course.LLB) return ApplicationIdPrefix.TCL;
  return ApplicationIdPrefix.TIHS;
};


enquirySchema.pre<IEnquiryDocument>('save', async function (next) {
  // DTODO: just take a look at user [pre save middleware] first will check if course is modified or not. if its not modified then will skip this process. if its modified they will execute this. [will discuss it on call if required]
  const doc = this as IEnquiryDocument & Document;

  if (doc) {
    const prefix = getPrefixForCourse(doc.course as Course);

    let serial = await EnquiryApplicationId.findOne({ prefix: prefix });

    serial!.lastSerialNumber += 1;


    doc.applicationId = `${prefix}${serial!.lastSerialNumber}`;
  }

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
  ['dateOfEnquiry', 'dateOfBirth'].forEach((key) => {
    if (ret[key]) {
      ret[key] = convertToDDMMYYYY(ret[key]);
    }
  });
  return ret;
};

enquirySchema.set('toJSON', { transform: transformDates });
enquirySchema.set('toObject', { transform: transformDates });

export const Enquiry = mongoose.model<IEnquiryDocument>('Enquiry', enquirySchema);
