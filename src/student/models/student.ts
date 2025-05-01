import mongoose, { Schema } from "mongoose";
import { IAttendanceSchema, IBaseAttendanceSchema, IBaseExamSchema, IExamSchema, ISemesterSchema, IStudentBaseInfoSchema, IStudentSchema, ISubjectSchema } from "../validators/studentSchema";
import { COLLECTION_NAMES, CourseYears, FeeStatus as FeeStatus } from "../../config/constants";
import { FeeModel } from "./fees";
import createHttpError from "http-errors";

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
    studentName: {
        type: String
    },
    studentPhoneNumber: {
        type: String
    },
    fatherName: {
        type: String
    },
    fatherPhoneNumber: {
        type: String
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
        type: [AttendanceModel],
        default: []
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
        required: true
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
        default: FeeStatus.NOT_PROVIDED
    },
    extraBalance: {
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
});

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

const removeExtraInfo = (_: any, ret: any) => {
    delete ret.createdAt;
    delete ret.updatedAt;
    delete ret.__v;
    return ret;
};

StudentModel.set('toJSON', { transform: removeExtraInfo });
StudentModel.set('toObject', { transform: removeExtraInfo });

export const Student = mongoose.model<IStudentDocument>(COLLECTION_NAMES.STUDENT, StudentModel);