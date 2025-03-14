import mongoose, { Schema } from 'mongoose';
import { IAcademicDetailSchema, IEnquiryRequestSchema } from '../validators/enquiryForm';
import { convertToDDMMYYYY, convertToMongoDate } from '../../utils/convertDateToFormatedDate';
import { contactNumberSchema, emailSchema } from '../../validators/commonSchema';
import {
  AcademicDetails,
  AdmissionReference,
  ApplicationIdPrefix,
  Category,
  Course
} from '../../config/constants';
import { EnquiryApplicationId } from './enquiryApplicationIdSchema';
import createHttpError from 'http-errors';

export interface IEnquiryFormDocument extends IEnquiryRequestSchema, Document {
  applicationId: string;
  date: Date;
}
export interface IAcademicDetailDocument extends IAcademicDetailSchema, Document {}

const academicDetailFormSchema = new Schema<IAcademicDetailDocument>({
  academicDetails: {
    type: String,
    enum: Object.values(AcademicDetails)
  },
  schoolCollegeName: {
    type: String
  },
  universityBoardName: {
    type: String
  },
  passingYear: {
    type: Number,
    validate: {
      validator: (year: number) => year.toString().length === 4,
      message: 'Passing Year must be a valid 4-digit year'
    }
  },
  percentageObtained: {
    type: Number,
    min: [0, 'Percentage must be at least 0'],
    max: [100, 'Percentage cannot exceed 100']
  },
  subjects: {
    type: [String]
  }
});

// export const AcademicDetailForm = mongoose.model<IAcademicDetailDocument>('AcademicDetailEnquiryForm', academicDetailFormSchema);

const enquiryFormSchema = new Schema<IEnquiryFormDocument>(
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
      required: [true, 'Student Phone Number is required.'],
      unique: true,
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
      type: String,
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
      type: String,
      required: true
    },
    academicDetails: {
      type: [academicDetailFormSchema],
      default: []
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
  const doc = this as IEnquiryFormDocument;
  if (doc) {
    // console.log(doc);
    const prefix = getPrefixForCourse(doc.course);
    console.log(prefix);

    // Find existing serial number for the prefix
    let serial = await EnquiryApplicationId.findOne({ prefix: prefix });

    console.log(serial);

    console.log(serial!.lastSerialNumber);
    serial!.lastSerialNumber += 1;
    // await serial.save(); => We will not do this here, as this can get updated even if validation of enquirySchema are failing, so we will update lastSerialNumber after the enquiry object is saved successfully.

    doc.applicationId = `${prefix}${serial!.lastSerialNumber}`;
  }
  next();
});

const handleMongooseError = (error: any, next: Function) => {
  if (error.code === 11000) {
    throw createHttpError(400, 'Phone Number already exists');
  } else if (error.name === 'ValidationError') {
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
  return ret;
};

enquiryFormSchema.set('toJSON', { transform: transformDates });
enquiryFormSchema.set('toObject', { transform: transformDates });

export const Enquiry = mongoose.model<IEnquiryFormDocument>('Enquiry', enquiryFormSchema);
