"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStudentPhysicalDocumentById = exports.updateStudentDataById = exports.getStudentDataById = exports.getStudentDataBySearch = exports.createStudent = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const studentFees_1 = require("../../admission/models/studentFees");
const constants_1 = require("../../config/constants");
const course_1 = require("../../course/models/course");
const getCurrentAcademicYear_1 = require("../../course/utils/getCurrentAcademicYear");
const studentSchema_1 = require("../validators/studentSchema");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const student_1 = require("../models/student");
const http_errors_1 = __importDefault(require("http-errors"));
const formatResponse_1 = require("../../utils/formatResponse");
const user_1 = require("../../auth/models/user");
const createStudent = (studentData) => __awaiter(void 0, void 0, void 0, function* () {
    const { courseCode, feeId, dateOfAdmission } = studentData;
    const studentBaseInformation = Object.assign({}, studentData);
    console.log("Student INformation is : ", studentBaseInformation);
    const course = yield course_1.Course.findOne({ courseCode: courseCode, startingYear: dateOfAdmission.getFullYear() });
    console.log("Course is : ", course);
    const feesCourse = yield studentFees_1.StudentFeesModel.findOne({ _id: feeId });
    const semSubjectIds = yield course_1.Course.aggregate([
        {
            $match: {
                _id: new mongoose_1.default.Types.ObjectId(course === null || course === void 0 ? void 0 : course.id)
            }
        },
        {
            $project: {
                semester: {
                    $map: {
                        input: "$semester",
                        as: "sem",
                        in: {
                            semesterId: "$$sem._id",
                            academicYear: "$$sem.academicYear",
                            courseYear: {
                                $switch: {
                                    branches: [
                                        { case: { $eq: [{ $ceil: { $divide: ["$$sem.semesterNumber", 2] } }, 1] }, then: "First" },
                                        { case: { $eq: [{ $ceil: { $divide: ["$$sem.semesterNumber", 2] } }, 2] }, then: "Second" },
                                        { case: { $eq: [{ $ceil: { $divide: ["$$sem.semesterNumber", 2] } }, 3] }, then: "Third" },
                                        { case: { $eq: [{ $ceil: { $divide: ["$$sem.semesterNumber", 2] } }, 4] }, then: "Fourth" },
                                        { case: { $eq: [{ $ceil: { $divide: ["$$sem.semesterNumber", 2] } }, 5] }, then: "Fifth" },
                                        { case: { $eq: [{ $ceil: { $divide: ["$$sem.semesterNumber", 2] } }, 6] }, then: "Sixth" },
                                    ],
                                    default: "Unknown"
                                }
                            },
                            subjectIds: {
                                $map: {
                                    input: "$$sem.subjects",
                                    as: "sub",
                                    in: "$$sub._id"
                                }
                            }
                        }
                    }
                }
            }
        }
    ]);
    const courseId = course === null || course === void 0 ? void 0 : course.id;
    const courseName = course === null || course === void 0 ? void 0 : course.courseName;
    const departmentMetaDataId = course === null || course === void 0 ? void 0 : course.departmentMetaDataId;
    const currentSemester = 1;
    const currentAcademicYear = (0, getCurrentAcademicYear_1.getCurrentAcademicYear)();
    const totalSemesters = course === null || course === void 0 ? void 0 : course.totalSemesters;
    const semSubIds = semSubjectIds[0].semester;
    const semesterArray = [];
    for (let i = 1; i <= totalSemesters; i++) {
        const semesterInfo = semSubIds[i - 1];
        const semesterId = semesterInfo.semesterId;
        const semesterNumber = i;
        const academicYear = semesterInfo.academicYear;
        const courseYear = semesterInfo.courseYear;
        const subjects = [];
        for (let j = 1; j <= semesterInfo.subjectIds.length; j++) {
            const subjectId = semesterInfo.subjectIds[j - 1];
            const attendance = [];
            const exams = [];
            subjects.push({
                subjectId: subjectId,
                attendance: attendance,
                exams: exams
            });
        }
        const fees = createSemesterFee(i, feesCourse);
        semesterArray.push({
            // _id : semesterId,
            semesterId: semesterId,
            semesterNumber: semesterNumber,
            academicYear: academicYear,
            courseYear: courseYear,
            subjects: subjects,
            fees: fees
        });
    }
    const student = {
        studentInfo: studentBaseInformation,
        courseId: courseId,
        departmentMetaDataId: departmentMetaDataId,
        courseName: courseName,
        courseCode: courseCode,
        startingYear: dateOfAdmission.getFullYear(),
        currentSemester: currentSemester,
        currentAcademicYear: currentAcademicYear,
        totalSemester: totalSemesters,
        semester: semesterArray,
    };
    return student;
});
exports.createStudent = createStudent;
const createSemesterFee = (semesterNumber, feesCourse) => {
    var _a;
    const otherFees = feesCourse.otherFees || [];
    const semWiseFees = feesCourse.semWiseFees || [];
    const getFeeDetail = (type) => {
        return otherFees.find((fee) => fee.type === type);
    };
    let requiredFeeTypes = [];
    if (semesterNumber === 1) {
        requiredFeeTypes = [
            constants_1.FinanceFeeType.HOSTEL,
            constants_1.FinanceFeeType.TRANSPORT,
            constants_1.FinanceFeeType.PROSPECTUS,
            constants_1.FinanceFeeType.STUDENTID,
            constants_1.FinanceFeeType.UNIFORM,
            constants_1.FinanceFeeType.STUDENTWELFARE,
            constants_1.FinanceFeeType.BOOKBANK,
            constants_1.FinanceFeeType.EXAMFEES,
            constants_1.FinanceFeeType.MISCELLANEOUS,
        ];
    }
    else if (semesterNumber % 2 === 1) {
        requiredFeeTypes = [
            constants_1.FinanceFeeType.HOSTEL,
            constants_1.FinanceFeeType.TRANSPORT,
            constants_1.FinanceFeeType.STUDENTWELFARE,
            constants_1.FinanceFeeType.BOOKBANK,
            constants_1.FinanceFeeType.EXAMFEES,
            constants_1.FinanceFeeType.MISCELLANEOUS,
        ];
    }
    else {
        requiredFeeTypes = [
            constants_1.FinanceFeeType.BOOKBANK,
            constants_1.FinanceFeeType.EXAMFEES,
            constants_1.FinanceFeeType.MISCELLANEOUS,
        ];
    }
    const createFeeUpdateHistory = (amount) => ({
        updatedAt: new Date(),
        updatedFee: amount,
    });
    const details = requiredFeeTypes.map((type) => {
        var _a;
        const feeDetail = getFeeDetail(type);
        let actualFee = 0;
        let finalFee = 0;
        let paidAmount = 0;
        const feeUpdateHistory = [];
        if (feeDetail) {
            if (semesterNumber % 2 === 0) {
                if (type === constants_1.FinanceFeeType.HOSTEL ||
                    type === constants_1.FinanceFeeType.TRANSPORT ||
                    type === constants_1.FinanceFeeType.PROSPECTUS ||
                    type === constants_1.FinanceFeeType.STUDENTID ||
                    type === constants_1.FinanceFeeType.UNIFORM ||
                    type === constants_1.FinanceFeeType.STUDENTWELFARE) {
                    actualFee = 0;
                    finalFee = 0;
                    paidAmount = 0;
                }
                else {
                    actualFee = feeDetail.feeAmount;
                    finalFee = feeDetail.finalFee;
                    paidAmount = feeDetail.feesDepositedTOA || 0;
                }
            }
            else {
                actualFee = feeDetail.feeAmount;
                finalFee = feeDetail.finalFee;
                paidAmount = feeDetail.feesDepositedTOA || 0;
            }
            feeUpdateHistory.push(createFeeUpdateHistory(finalFee));
        }
        return {
            type: type,
            schedule: (_a = constants_1.FinanceFeeSchedule[type]) !== null && _a !== void 0 ? _a : "YEARLY",
            actualFee,
            finalFee,
            paidAmount,
            remark: "",
            feeUpdateHistory
        };
    });
    const semFeeInfo = semWiseFees[semesterNumber - 1] || null;
    if (semFeeInfo) {
        details.push({
            type: constants_1.FinanceFeeType.SEMESTERFEE,
            schedule: (_a = constants_1.FinanceFeeSchedule[constants_1.FinanceFeeType.SEMESTERFEE]) !== null && _a !== void 0 ? _a : "YEARLY",
            actualFee: semFeeInfo.actualFee || 0,
            finalFee: semFeeInfo.finalFee || 0,
            paidAmount: semFeeInfo.feesPaid || 0,
            remark: "",
            feeUpdateHistory: [{
                    updatedAt: new Date(),
                    updatedFee: semFeeInfo.finalFee || 0
                }]
        });
    }
    const totalFinalFee = details.reduce((sum, item) => sum + item.finalFee, 0);
    const totalPaidAmount = details.reduce((sum, item) => sum + item.paidAmount, 0);
    return {
        details: details,
        dueDate: undefined,
        paidAmount: totalPaidAmount,
        totalFinalFee: totalFinalFee,
    };
};
exports.getStudentDataBySearch = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;
    if (page < 1 || limit < 1) {
        throw (0, http_errors_1.default)(400, 'Page and limit must be positive integers');
    }
    const skip = (page - 1) * limit;
    // Fetch students with pagination
    const [students, total] = yield Promise.all([
        student_1.Student.aggregate([
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    universityId: '$studentInfo.universityId',
                    studentName: '$studentInfo.studentName',
                    studentPhoneNumber: '$studentInfo.studentPhoneNumber',
                    fatherName: '$studentInfo.fatherName',
                    fatherPhoneNumber: '$studentInfo.fatherPhoneNumber',
                    courseName: 1,
                    currentAcademicYear: 1,
                    currentSemester: 1,
                },
            },
        ]),
        student_1.Student.countDocuments()
    ]);
    // Send response
    return (0, formatResponse_1.formatResponse)(res, 200, 'Students information fetched successfully', true, {
        students,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
}));
exports.getStudentDataById = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw (0, http_errors_1.default)(400, 'Invalid student ID');
    }
    const student = yield student_1.Student.findById(id)
        .populate({ path: 'departmentMetaDataId', select: 'departmentName' })
        .lean();
    if (!student) {
        throw (0, http_errors_1.default)(404, 'Student not found');
    }
    const { departmentMetaDataId } = student, rest = __rest(student, ["departmentMetaDataId"]);
    const course = yield course_1.Course.findById(student.courseId).lean();
    if (!course) {
        throw (0, http_errors_1.default)(404, 'Course does not exist');
    }
    // Update student.semester with subject details and instructors
    for (let i = 0; i < student.semester.length; i++) {
        const studentSem = student.semester[i];
        const courseSem = course.semester[i];
        if (!courseSem)
            continue;
        for (let j = 0; j < studentSem.subjects.length; j++) {
            const studentSubject = studentSem.subjects[j];
            const matchedCourseSubject = courseSem.subjects.find(courseSub => courseSub._id.toString() === studentSubject.subjectId.toString());
            if (matchedCourseSubject) {
                studentSubject.subjectName = matchedCourseSubject.subjectName;
                studentSubject.subjectCode = matchedCourseSubject.subjectCode;
                // Populate instructor names
                const instructorList = [];
                for (const instructorId of matchedCourseSubject.instructor) {
                    const instructor = yield user_1.User.findById(instructorId).lean();
                    if (instructor) {
                        instructorList.push(`${instructor.firstName} ${instructor.lastName}`);
                    }
                }
                studentSubject.instructor = instructorList;
            }
        }
    }
    const responseData = Object.assign(Object.assign({}, rest), { semester: student.semester, departmentName: (_a = departmentMetaDataId === null || departmentMetaDataId === void 0 ? void 0 : departmentMetaDataId.departmentName) !== null && _a !== void 0 ? _a : null });
    return (0, formatResponse_1.formatResponse)(res, 200, 'ok', true, responseData);
}));
exports.updateStudentDataById = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validation = studentSchema_1.updateStudentDetailsRequestSchema.safeParse(req.body);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const _a = validation.data, { id } = _a, studentDetails = __rest(_a, ["id"]);
    const updatedStudent = yield student_1.Student.findByIdAndUpdate(id, { $set: studentDetails }, {
        new: true,
        runValidators: true,
    });
    if (!updatedStudent) {
        throw (0, http_errors_1.default)(404, 'Student not found');
    }
    return (0, formatResponse_1.formatResponse)(res, 200, 'Student details updated successfully', true, updatedStudent);
}));
exports.updateStudentPhysicalDocumentById = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const validation = studentSchema_1.updateStudentPhysicalDocumentRequestSchema.safeParse(req.body);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const _a = validation.data, { id } = _a, physicalDocumentList = __rest(_a, ["id"]);
    const updatedStudent = yield student_1.Student.findByIdAndUpdate(id, { $set: { physicalDocumentNote: physicalDocumentList } }, {
        new: true,
        runValidators: true,
    });
    if (!updatedStudent) {
        throw (0, http_errors_1.default)(404, 'Student not found');
    }
    return (0, formatResponse_1.formatResponse)(res, 200, 'Student details updated successfully', true, updatedStudent);
}));
