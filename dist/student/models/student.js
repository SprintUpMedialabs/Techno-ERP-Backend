"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Student = exports.removeExtraInfo = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const mongoose_1 = __importStar(require("mongoose"));
const academicDetail_1 = require("../../admission/models/academicDetail");
const address_1 = require("../../admission/models/address");
const entranceExamDetail_1 = require("../../admission/models/entranceExamDetail");
const physicalDocumentNoteSchema_1 = require("../../admission/models/physicalDocumentNoteSchema");
const previousCollegeData_1 = require("../../admission/models/previousCollegeData");
const singleDocument_1 = require("../../admission/models/singleDocument");
const constants_1 = require("../../config/constants");
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const commonSchema_1 = require("../../validators/commonSchema");
const fees_1 = require("./fees");
const StudentBaseInfoSchema = new mongoose_1.Schema({
    universityId: {
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
            validator: (stuPhNum) => commonSchema_1.contactNumberSchema.safeParse(stuPhNum).success,
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
            validator: (stuPhNum) => {
                if (!stuPhNum)
                    return true;
                return commonSchema_1.contactNumberSchema.safeParse(stuPhNum).success;
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
            validator: (email) => commonSchema_1.emailSchema.safeParse(email).success,
            message: 'Invalid email format'
        }
    },
    bloodGroup: {
        type: String,
        enum: Object.values(constants_1.BloodGroup)
    },
    dateOfBirth: {
        type: Date,
        required: [true, 'Date is required'],
        set: (value) => {
            if (value instanceof Date)
                return value;
            return (0, convertDateToFormatedDate_1.convertToMongoDate)(value);
        }
    },
    category: {
        type: String,
        enum: {
            values: Object.values(constants_1.Category),
            message: 'Invalid Category value'
        },
        required: true
    },
    references: {
        type: [String],
        enum: {
            values: Object.values(constants_1.AdmissionReference),
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
            validator: (aadhar) => aadhar.length === 12,
            message: 'Invalid Aadhar Number'
        }
    },
    address: {
        type: address_1.addressSchema,
        minlength: [5, 'Address must be at least 5 characters long']
    },
    academicDetails: {
        type: [academicDetail_1.academicDetailFormSchema],
        default: [],
        required: false
    },
    entranceExamDetails: {
        type: entranceExamDetail_1.entranceExamDetailSchema
    },
    previousCollegeData: {
        type: previousCollegeData_1.previousCollegeDataSchema
    },
    documents: {
        type: [singleDocument_1.singleDocumentSchema]
    },
    physicalDocumentNote: {
        type: [physicalDocumentNoteSchema_1.physicalDocumentNoteSchema]
    },
    stateOfDomicile: {
        type: String,
    },
    areaType: {
        type: String,
        enum: {
            values: Object.values(constants_1.AreaType),
            message: 'Invalid area type'
        }
    },
    nationality: {
        type: String
    },
    gender: {
        type: String,
        enum: {
            values: Object.values(constants_1.Gender),
            message: 'Invalid gender value'
        }
    },
    religion: {
        type: String,
        enum: Object.values(constants_1.Religion)
    },
    admittedThrough: {
        type: String,
        enum: Object.values(constants_1.AdmittedThrough)
    }
});
const BaseExamModel = new mongoose_1.Schema({
    type: {
        type: String
    },
    marks: {
        type: Number
    }
});
const ExamsModel = new mongoose_1.Schema({
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
const BaseAttendanceModel = new mongoose_1.Schema({
    id: {
        type: mongoose_1.Schema.Types.ObjectId
    },
    attended: {
        type: Boolean
    }
});
const AttendanceModel = new mongoose_1.Schema({
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
const SubjectSchema = new mongoose_1.Schema({
    subjectId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
const SemesterSchema = new mongoose_1.Schema({
    semesterId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        enum: Object.values(constants_1.CourseYears),
        required: true
    },
    subjects: {
        type: [SubjectSchema],
        required: true
    },
    fees: {
        type: fees_1.FeeModel,
        required: true
    }
});
const StudentModel = new mongoose_1.Schema({
    studentInfo: {
        type: StudentBaseInfoSchema,
        required: true
    },
    courseId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true
    },
    departmentMetaDataId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: constants_1.COLLECTION_NAMES.DEPARTMENT_META_DATA
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
        enum: Object.values(constants_1.FeeStatus),
        default: constants_1.FeeStatus.DUE
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
                type: mongoose_1.Schema.Types.ObjectId,
                ref: constants_1.COLLECTION_NAMES.TRANSACTION_HISTORY
            }],
        default: []
    }
}, { timestamps: true });
const handleMongooseError = (error, next) => {
    if (error.name === 'ValidationError') {
        const firstError = error.errors[Object.keys(error.errors)[0]];
        throw (0, http_errors_1.default)(400, firstError.message);
    }
    else if (error.name == 'MongooseError') {
        throw (0, http_errors_1.default)(400, `${error.message}`);
    }
    else {
        next(error);
    }
};
StudentModel.post('save', function (error, doc, next) {
    handleMongooseError(error, next);
});
StudentModel.post('findOneAndUpdate', function (error, doc, next) {
    handleMongooseError(error, next);
});
const removeExtraInfo = (_, ret) => {
    var _a, _b, _c;
    if ((_a = ret.studentInfo) === null || _a === void 0 ? void 0 : _a.dateOfBirth) {
        ret.studentInfo.dateOfBirth = (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(ret.studentInfo.dateOfBirth);
    }
    if (Array.isArray((_b = ret.studentInfo) === null || _b === void 0 ? void 0 : _b.documents)) {
        ret.studentInfo.documents = ret.studentInfo.documents.map((doc) => (Object.assign(Object.assign({}, doc), { dueBy: doc.dueBy ? (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(doc.dueBy) : doc.dueBy })));
    }
    if (Array.isArray((_c = ret.studentInfo) === null || _c === void 0 ? void 0 : _c.physicalDocumentNote)) {
        ret.studentInfo.physicalDocumentNote = ret.studentInfo.physicalDocumentNote.map((note) => (Object.assign(Object.assign({}, note), { dueBy: note.dueBy ? (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(note.dueBy) : note.dueBy })));
    }
    // delete ret.createdAt;
    // delete ret.updatedAt;
    delete ret.__v;
    return ret;
};
exports.removeExtraInfo = removeExtraInfo;
StudentModel.set('toJSON', { transform: exports.removeExtraInfo });
StudentModel.set('toObject', { transform: exports.removeExtraInfo });
exports.Student = mongoose_1.default.model(constants_1.COLLECTION_NAMES.STUDENT, StudentModel);
