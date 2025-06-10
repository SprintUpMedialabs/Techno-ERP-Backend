import createHttpError from "http-errors";
import mongoose, { Schema } from "mongoose";
import { academicDetailFormSchema } from "../../admission/models/academicDetail";
import { addressSchema } from "../../admission/models/address";
import { entranceExamDetailSchema } from "../../admission/models/entranceExamDetail";
import { physicalDocumentNoteSchema } from "../../admission/models/physicalDocumentNoteSchema";
import { previousCollegeDataSchema } from "../../admission/models/previousCollegeData";
import { singleDocumentSchema } from "../../admission/models/singleDocument";
import { AdmissionReference, AdmittedThrough, AreaType, BloodGroup, Category, COLLECTION_NAMES, CourseYears, FeeStatus, Gender, Religion } from "../../config/constants";
import { convertToDDMMYYYY, convertToMongoDate } from "../../utils/convertDateToFormatedDate";
import { contactNumberSchema, emailSchema } from "../../validators/commonSchema";
import { IAttendanceSchema, IBaseAttendanceSchema, IBaseExamSchema, IExamSchema, ISemesterSchema, IStudentBaseInfoSchema, IStudentSchema, ISubjectSchema } from "../validators/studentSchema";
import { FeeModel } from "./fees";

export interface IStudentDocument extends IStudentSchema, Document { }
export interface IStudentBasicInfoDocument extends IStudentBaseInfoSchema, Document { }
export interface ISemesterDocument extends ISemesterSchema, Document { }
export interface ISubjectDocument extends ISubjectSchema, Document { }
export interface IAttendanceDocument extends IAttendanceSchema, Document { }
export interface IBaseAttendanceDocument extends IBaseAttendanceSchema, Document { }
export interface IExamDocument extends IExamSchema, Document { }
export interface IBaseExamDocument extends IBaseExamSchema, Document { }

const StudentBaseInfoSchema = new Schema<IStudentBasicInfoDocument>({
    universityId: { // changed from studentId to universityId
        type: String
    },
    photoNo: {
        type: Number,
    },
    formNo: {
        type: String,
    },
    lurnRegistrationNo: {
        type: String,
        default: 'Not Provided'
    },
    studentName: {
        type: String
    },
    studentPhoneNumber: {
        type: String
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
        type: String
    },
    motherName: {
        type: String,
        required: [true, "Mother's Name is required"]
    },
    motherPhoneNumber: {
        type: String,
        validate: {
            validator: (stuPhNum: string) => {
                if (!stuPhNum) return true;
                return contactNumberSchema.safeParse(stuPhNum).success;
            },
            message: 'Invalid Mother Phone Number'
        }
    },
    motherOccupation: {
        type: String
    },

    emailId: {
        type: String,
        validate: {
            validator: (email: string) => emailSchema.safeParse(email).success,
            message: 'Invalid email format'
        }
    },
    bloodGroup: {
        type: String,
        enum: Object.values(BloodGroup)
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date is required'],
        set: (value: string | Date) => {
            if (value instanceof Date) return value;
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
    references: {
        type: [String],
        enum: {
          values: Object.values(AdmissionReference),
          message: 'Invalid Admission Reference value'
        },
        required: true
    },
    srAmount: {
        type: Number
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
    entranceExamDetails: {
        type: entranceExamDetailSchema
    },
    previousCollegeData: {
        type: previousCollegeDataSchema
    },
    documents: {
        type: [singleDocumentSchema]
    },
    physicalDocumentNote: {
        type: [physicalDocumentNoteSchema]
    },
    stateOfDomicile: {
        type: String,
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
    gender: {
        type: String,
        enum: {
            values: Object.values(Gender),
            message: 'Invalid gender value'
        }
    },
    religion: {
        type: String,
        enum: Object.values(Religion)
    },
    admittedThrough: {
        type: String,
        enum: Object.values(AdmittedThrough)
    }
});

const BaseExamModel = new Schema<IBaseExamDocument>({
    type: {
        type: String
    },
    marks: {
        type: Number
    }
});

const ExamsModel = new Schema<IExamDocument>({
    theory: {
        type: [BaseExamModel],
        default: []
    },
    practical: {
        type: [BaseExamModel],
        default: []
    },
    totalMarks: {
        type: Number,
        default: 0
    }
});


const BaseAttendanceModel = new Schema<IBaseAttendanceDocument>({
    id: {
        type: Schema.Types.ObjectId
    },
    attended: {
        type: Boolean
    }
});

const AttendanceModel = new Schema<IAttendanceDocument>({
    lecturePlan: {
        type: [BaseAttendanceModel],
        default: []
    },
    practicalPlan: {
        type: [BaseAttendanceModel],
        default: []
    },
    totalLectureAttendance: {
        type: Number,
        default: 0
    },
    totalPracticalAttendance: {
        type: Number,
        default: 0
    }
});

const SubjectSchema = new Schema<ISubjectDocument>({
    subjectId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    attendance: {
        type: AttendanceModel,
        default: {}
    },
    exams: {
        type: [ExamsModel],
        default: []
    }
});

const SemesterSchema = new Schema<ISemesterDocument>({
    semesterId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    semesterNumber: {
        type: Number,
        required: true,
        min: 0
    },
    academicYear: {
        type: String,
        required: true
    },
    courseYear: {
        type: String,
        enum: Object.values(CourseYears),
        required: true
    },
    subjects: {
        type: [SubjectSchema],
        required: true
    },
    fees: {
        type: FeeModel,
        required: true
    }
});

const StudentModel = new Schema<IStudentDocument>({
    studentInfo: {
        type: StudentBaseInfoSchema,
        required: true
    },
    courseId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    departmentMetaDataId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: COLLECTION_NAMES.DEPARTMENT_META_DATA
    },
    courseName: {
        type: String,
        required: true
    },
    courseCode: {
        type: String,
        required: true
    },
    startingYear: {
        type: Number,
        required: true
    },
    currentSemester: {
        type: Number,
        required: true,
        min: 0
    },
    currentAcademicYear: {
        type: String,
        required: true
    },
    totalSemester: {
        type: Number,
        required: true,
        min: 0
    },
    semester: {
        type: [SemesterSchema],
        required: true
    },
    feeStatus: {
        type: String,
        enum: Object.values(FeeStatus),
        default: FeeStatus.DUE
    },
    extraBalance: {
        type: Number,
        default: 0
    },
    prevTotalDueAtSemStart: {
        type: Number,
        default: 0
    },
    transactionHistory: {
        type: [{
            type: Schema.Types.ObjectId,
            ref: COLLECTION_NAMES.TRANSACTION_HISTORY
        }],
        default: []
    }
}, { timestamps: true });

const handleMongooseError = (error: any, next: Function) => {
    if (error.name === 'ValidationError') {
        const firstError = error.errors[Object.keys(error.errors)[0]];
        throw createHttpError(400, firstError.message);
    } else if (error.name == 'MongooseError') {
        throw createHttpError(400, `${error.message}`);
    } else {
        next(error);
    }
};

StudentModel.post('save', function (error: any, doc: any, next: Function) {
    handleMongooseError(error, next);
});

StudentModel.post('findOneAndUpdate', function (error: any, doc: any, next: Function) {
    handleMongooseError(error, next);
});

export const removeExtraInfo = (_: any, ret: any) => {
    if (ret.studentInfo?.dateOfBirth) {
        ret.studentInfo.dateOfBirth = convertToDDMMYYYY(ret.studentInfo.dateOfBirth);
    }

    if (Array.isArray(ret.studentInfo?.documents)) {
        ret.studentInfo.documents = ret.studentInfo.documents.map((doc: any) => ({
            ...doc,
            dueBy: doc.dueBy ? convertToDDMMYYYY(doc.dueBy) : doc.dueBy,
        }));
    }

    if (Array.isArray(ret.studentInfo?.physicalDocumentNote)) {
        ret.studentInfo.physicalDocumentNote = ret.studentInfo.physicalDocumentNote.map((note: any) => ({
            ...note,
            dueBy: note.dueBy ? convertToDDMMYYYY(note.dueBy) : note.dueBy,
        }));
    }
    // delete ret.createdAt;
    // delete ret.updatedAt;
    delete ret.__v;
    return ret;
};

StudentModel.set('toJSON', { transform: removeExtraInfo });
StudentModel.set('toObject', { transform: removeExtraInfo });

export const Student = mongoose.model<IStudentDocument>(COLLECTION_NAMES.STUDENT, StudentModel);