import mongoose, { Schema } from 'mongoose';
import { IEnquiryRequestSchema } from '../validators/enquiryForm';
import { convertToDDMMYYYY, convertToMongoDate } from '../../utils/convertDateToFormatedDate';
import { contactNumberSchema, emailSchema } from '../../validators/commonSchema';
import { AdmissionReference, ApplicationIdPrefix, Category, Course } from '../../config/constants';
import { EnquiryApplicationId } from './enquiryApplicationIdSchema';
import createHttpError from 'http-errors';

import { IAddressSchema } from '../validators/addressSchema';
import { singleDocumentSchema } from './singleDocument';
import { academicDetailFormSchema } from './academicDetail';
import { previousCollegeDataSchema } from './previousCollegeData';
import { addressSchema } from './address';

export interface IEnquiryFormDocument extends IEnquiryRequestSchema, Document {
  applicationId: string;
  date: Date;
}

const enquiryFormSchema = new Schema(
  {
    applicationId: {
      type: String,
      unique: true,
      required: false, 
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
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    studentName: {
      type: String,
      required: [true, 'Student Name is required']
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date is required'],
      set: (value: string) => {
        console.log(value);
        let convertedDate = convertToMongoDate(value);
        console.log(convertedDate);
        if (!convertedDate) throw new Error('Invalid date format, expected DD-MM-YYYY');
        return convertedDate;
      }
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
    feesDraftId: {
      type: Schema.Types.ObjectId,
      ref: 'FeesDraft', // Refer to FeesDraft model
      optional : true
    }
  },
  { timestamps: true }
);

const getPrefixForCourse = (course: Course): ApplicationIdPrefix => {
  if (course === Course.MBA) return ApplicationIdPrefix.TIMS;
  if (course === Course.LLB) return ApplicationIdPrefix.TCL;
  return ApplicationIdPrefix.TIHS;
};

enquiryFormSchema.pre<IEnquiryFormDocument>('save', async function (next) {
  const doc = this as IEnquiryFormDocument & Document;
  // DTODO: just take a look at user [pre save middleware] first will check if course is modified or not. if its not modified then will skip this process. if its modified they will execute this. [will discuss it on call if required]
  if (doc) {
    const prefix = getPrefixForCourse(doc.course);

    // Find existing serial number for the prefix
    let serial = await EnquiryApplicationId.findOne({ prefix: prefix });

    serial!.lastSerialNumber += 1;
    // await serial.save(); => We will not do this here, as this can get updated even if validation of enquirySchema are failing, so we will update lastSerialNumber after the enquiry object is saved successfully.

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

enquiryFormSchema.post('save', function (error: any, doc: any, next: Function) {
  handleMongooseError(error, next);
});

enquiryFormSchema.post('findOneAndUpdate', function (error: any, doc: any, next: Function) {
  handleMongooseError(error, next);
});

const transformDates = (_: any, ret: any) => {
  ['date', 'dateOfBirth'].forEach((key) => {
    if (ret[key]) {
      ret[key] = convertToDDMMYYYY(ret[key]);
    }
  });
  // console.log("TRansforming date")
  return ret;
};

enquiryFormSchema.set('toJSON', { transform: transformDates });
enquiryFormSchema.set('toObject', { transform: transformDates });

export const Enquiry = mongoose.model<IEnquiryFormDocument>('Enquiry', enquiryFormSchema);
