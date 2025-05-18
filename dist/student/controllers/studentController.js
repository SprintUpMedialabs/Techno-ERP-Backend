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
exports.updateStudentDocumentsById = exports.updateStudentPhysicalDocumentById = exports.updateStudentDataById = exports.getStudentDataById = exports.getStudentDataBySearch = exports.createStudent = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const http_errors_1 = __importDefault(require("http-errors"));
const mongoose_1 = __importDefault(require("mongoose"));
const studentFees_1 = require("../../admission/models/studentFees");
const physicalDocumentNoteSchema_1 = require("../../admission/validators/physicalDocumentNoteSchema");
const user_1 = require("../../auth/models/user");
const constants_1 = require("../../config/constants");
const course_1 = require("../../course/models/course");
const getCurrentAcademicYear_1 = require("../../course/utils/getCurrentAcademicYear");
const formatResponse_1 = require("../../utils/formatResponse");
const student_1 = require("../models/student");
const studentSchema_1 = require("../validators/studentSchema");
const singleDocumentSchema_1 = require("../../admission/validators/singleDocumentSchema");
const s3Upload_1 = require("../../config/s3Upload");
const createStudent = (id, studentData) => __awaiter(void 0, void 0, void 0, function* () {
    const { courseCode, feeId, dateOfAdmission } = studentData;
    const studentBaseInformation = Object.assign({}, studentData);
    const course = yield course_1.Course.findOne({ courseCode: courseCode, startingYear: dateOfAdmission.getFullYear() });
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
    let transactionAmount = 0;
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
        const _a = createSemesterFee(id, i, feesCourse), { amountForTransaction } = _a, fees = __rest(_a, ["amountForTransaction"]);
        if (semesterNumber === 1)
            transactionAmount = amountForTransaction;
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
    ;
    const allSemestersSettled = semesterArray.every((sem) => {
        var _a, _b, _c;
        if (!((_a = sem.fees) === null || _a === void 0 ? void 0 : _a.dueDate))
            return true;
        return (((_b = sem.fees) === null || _b === void 0 ? void 0 : _b.paidAmount) || 0) >= (((_c = sem.fees) === null || _c === void 0 ? void 0 : _c.totalFinalFee) || 0);
    });
    const feeStatus = allSemestersSettled ? constants_1.FeeStatus.PAID : constants_1.FeeStatus.DUE;
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
        feeStatus: feeStatus,
        collegeName: studentData.collegeName,
        transactionAmount: transactionAmount
    };
    return student;
});
exports.createStudent = createStudent;
const createSemesterFee = (id, semesterNumber, feesCourse) => {
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
        extraAmount: amount,
        updatedBy: id,
        updatedFee: amount,
    });
    let amountForTransaction = 0;
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
                    // paidAmount = feeDetail.feesDepositedTOA || 0;
                    paidAmount = 0;
                }
            }
            else {
                actualFee = feeDetail.feeAmount;
                finalFee = feeDetail.finalFee;
                if (semesterNumber !== 1)
                    paidAmount = 0;
                else {
                    paidAmount = feeDetail.feesDepositedTOA || 0;
                    amountForTransaction = amountForTransaction + (feeDetail.feesDepositedTOA || 0);
                }
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
        amountForTransaction = semesterNumber == 1 ? (amountForTransaction + semFeeInfo.feesPaid || 0) : 0;
        details.push({
            type: constants_1.FinanceFeeType.SEMESTERFEE,
            schedule: (_a = constants_1.FinanceFeeSchedule[constants_1.FinanceFeeType.SEMESTERFEE]) !== null && _a !== void 0 ? _a : "YEARLY",
            actualFee: semFeeInfo.actualFee || 0,
            finalFee: semFeeInfo.finalFee || 0,
            paidAmount: semesterNumber == 1 ? getFeeDetail("SEM1FEE").feesDepositedTOA || 0 : 0,
            remark: "",
            feeUpdateHistory: [{
                    updatedAt: new Date(),
                    extraAmount: semFeeInfo.finalFee || 0,
                    updatedFee: semFeeInfo.finalFee || 0,
                    updatedBy: id
                }]
        });
    }
    const totalFinalFee = details.reduce((sum, item) => sum + item.finalFee, 0);
    const totalPaidAmount = details.reduce((sum, item) => sum + item.paidAmount, 0);
    return {
        details: details,
        dueDate: semesterNumber == 1 ? new Date() : undefined,
        paidAmount: totalPaidAmount,
        totalFinalFee: totalFinalFee,
        amountForTransaction: amountForTransaction
    };
};
const yearMapping = {
    First: 1,
    Second: 2,
    Third: 3,
    Fourth: 4,
    Fifth: 5,
    Sixth: 6,
};
exports.getStudentDataBySearch = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.body.page) || 1;
    const limit = parseInt(req.body.limit) || 10;
    const { academicYear, courseCode, courseYear, search } = req.body;
    const matchStage = {};
    if (courseCode) {
        matchStage.courseCode = courseCode;
    }
    if (academicYear) {
        matchStage.currentAcademicYear = academicYear;
    }
    if (courseYear) {
        const yearNumber = yearMapping[courseYear];
        if (yearNumber) {
            const semRange = [yearNumber * 2 - 1, yearNumber * 2];
            matchStage.currentSemester = { $in: semRange };
        }
    }
    console.log("Match Stage : ", matchStage);
    if (search) {
        matchStage.$or = [
            { 'studentInfo.universityId': { $regex: search, $options: 'i' } },
            { 'studentInfo.studentPhoneNumber': { $regex: search, $options: 'i' } },
            { 'studentInfo.studentName': { $regex: search, $options: 'i' } }
        ];
    }
    if (page < 1 || limit < 1) {
        throw (0, http_errors_1.default)(400, 'Page and limit must be positive integers');
    }
    const skip = (page - 1) * limit;
    const [students, total] = yield Promise.all([
        student_1.Student.aggregate([
            { $match: matchStage },
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
                    courseCode: 1,
                    currentAcademicYear: 1,
                    currentSemester: 1,
                },
            }
        ]),
        student_1.Student.countDocuments(matchStage),
    ]);
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
    const responseData = yield buildStudentResponseData(student);
    const cleanedData = (0, student_1.removeExtraInfo)(null, responseData);
    return (0, formatResponse_1.formatResponse)(res, 200, 'ok', true, cleanedData);
}));
exports.updateStudentDataById = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const validation = studentSchema_1.updateStudentDetailsRequestSchema.safeParse(req.body);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const _b = validation.data, { id } = _b, studentDetails = __rest(_b, ["id"]);
    const updateFields = {};
    for (const [key, value] of Object.entries(studentDetails)) {
        updateFields[`studentInfo.${key}`] = value;
    }
    const data = yield student_1.Student.findByIdAndUpdate(id, { $set: updateFields }, { runValidators: true });
    // Refetch and populate to return same structure as getStudentDataById
    const updatedStudent = (_a = (yield student_1.Student.findById(id)
        .populate({ path: 'departmentMetaDataId', select: 'departmentName' }))) === null || _a === void 0 ? void 0 : _a.toObject();
    if (!updatedStudent) {
        throw (0, http_errors_1.default)(404, 'Student not found');
    }
    const responseData = yield buildStudentResponseData(updatedStudent);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Student details updated successfully', true, responseData);
}));
exports.updateStudentPhysicalDocumentById = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const validation = physicalDocumentNoteSchema_1.updateStudentPhysicalDocumentRequestSchema.safeParse(req.body);
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const _c = validation.data, { id } = _c, physicalDocumentList = __rest(_c, ["id"]);
    const isStudentExist = yield student_1.Student.exists({ _id: id, 'studentInfo.physicalDocumentNote.type': physicalDocumentList.type });
    let updatedStudent;
    if (isStudentExist) {
        const updateFields = {};
        for (const [key, value] of Object.entries(physicalDocumentList)) {
            updateFields[`studentInfo.physicalDocumentNote.$[elem].${key}`] = value;
        }
        updatedStudent = (_a = (yield student_1.Student.findByIdAndUpdate(id, { $set: Object.assign({}, updateFields) }, {
            new: true,
            runValidators: true,
            arrayFilters: [{ 'elem.type': physicalDocumentList.type }]
        }).populate({ path: 'departmentMetaDataId', select: 'departmentName' }))) === null || _a === void 0 ? void 0 : _a.toObject();
    }
    else {
        updatedStudent = (_b = (yield student_1.Student.findByIdAndUpdate(id, { $push: { 'studentInfo.physicalDocumentNote': physicalDocumentList } }, { new: true, runValidators: true }).populate({ path: 'departmentMetaDataId', select: 'departmentName' }))) === null || _b === void 0 ? void 0 : _b.toObject();
    }
    if (!updatedStudent) {
        throw (0, http_errors_1.default)(404, 'Student not found');
    }
    const responseData = yield buildStudentResponseData(updatedStudent);
    return (0, formatResponse_1.formatResponse)(res, 200, 'Student details updated successfully', true, responseData);
}));
exports.updateStudentDocumentsById = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { id, type, dueBy } = req.body;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw (0, http_errors_1.default)(400, 'Invalid enquiry ID');
    }
    const file = req.file;
    const validation = singleDocumentSchema_1.singleDocumentSchema.safeParse({
        id: id,
        type: type,
        dueBy: dueBy,
        file: file
    });
    if (!validation.success) {
        throw (0, http_errors_1.default)(400, validation.error.errors[0]);
    }
    const isStudentExist = yield student_1.Student.exists({ _id: id });
    if (!isStudentExist) {
        throw (0, http_errors_1.default)(404, 'Student not found');
    }
    const existingDocument = yield student_1.Student.findOne({ _id: id, 'studentInfo.documents.type': type }, { 'studentInfo.documents.$': 1 });
    let fileUrl;
    let finalDueBy;
    if (existingDocument === null || existingDocument === void 0 ? void 0 : existingDocument.studentInfo.documents) {
        fileUrl = (_a = existingDocument === null || existingDocument === void 0 ? void 0 : existingDocument.studentInfo.documents[0]) === null || _a === void 0 ? void 0 : _a.fileUrl;
        finalDueBy = (_b = existingDocument === null || existingDocument === void 0 ? void 0 : existingDocument.studentInfo.documents[0]) === null || _b === void 0 ? void 0 : _b.dueBy;
    }
    if (file) {
        fileUrl = yield (0, s3Upload_1.uploadToS3)(id.toString(), constants_1.ADMISSION, type, file);
        if (req.file) {
            req.file.buffer = null;
        }
    }
    if (dueBy) {
        finalDueBy = dueBy;
    }
    if (existingDocument) {
        if (!file && !dueBy) {
            throw (0, http_errors_1.default)(400, 'No new data provided to update');
        }
        const updateFields = {};
        if (fileUrl) {
            updateFields['studentInfo.documents.$[elem].fileUrl'] = fileUrl;
        }
        if (finalDueBy) {
            updateFields['studentInfo.documents.$[elem].dueBy'] = finalDueBy;
        }
        const updatedData = yield student_1.Student.findOneAndUpdate({ _id: id, 'studentInfo.documents.type': type }, {
            $set: Object.assign({}, updateFields)
        }, {
            new: true,
            runValidators: true,
            arrayFilters: [{ 'elem.type': type }]
        }).select('studentInfo.documents');
        return (0, formatResponse_1.formatResponse)(res, 200, 'Document updated successfully', true, updatedData);
    }
    else {
        const documentData = { type, fileUrl };
        if (finalDueBy) {
            documentData.dueBy = finalDueBy;
        }
        const updatedData = yield student_1.Student.findByIdAndUpdate(id, { $push: { 'studentInfo.documents': documentData } }, { new: true, runValidators: true }).select('studentInfo.documents');
        return (0, formatResponse_1.formatResponse)(res, 200, 'New document created successfully', true, updatedData);
    }
}));
const buildStudentResponseData = (student) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { departmentMetaDataId } = student, rest = __rest(student, ["departmentMetaDataId"]);
    const course = yield course_1.Course.findById(student.courseId);
    if (!course) {
        throw (0, http_errors_1.default)(404, 'Course does not exist');
    }
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
    return Object.assign(Object.assign({}, rest), { semester: student.semester, departmentName: (_a = departmentMetaDataId === null || departmentMetaDataId === void 0 ? void 0 : departmentMetaDataId.departmentName) !== null && _a !== void 0 ? _a : null });
});
