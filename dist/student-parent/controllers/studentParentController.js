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
exports.getStudentInformation = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const student_1 = require("../../student/models/student");
const courseMetadata_1 = require("../../course/models/courseMetadata");
const formatResponse_1 = require("../../utils/formatResponse");
exports.getStudentInformation = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { universityId } = req.body;
    const student = yield student_1.Student.findOne({ 'studentInfo.universityId': universityId });
    const courseMetaData = yield courseMetadata_1.CourseMetaData.findOne({ 'courseCode': student === null || student === void 0 ? void 0 : student.courseCode });
    const courseId = student === null || student === void 0 ? void 0 : student.courseId;
    console.log("Student id : ", student === null || student === void 0 ? void 0 : student._id);
    const _c = yield getEnrolledSubjectsForStudent(student === null || student === void 0 ? void 0 : student._id), { semesterId } = _c, matchedSubjects = __rest(_c, ["semesterId"]);
    console.log("Matched subjects : ", matchedSubjects);
    const responseObject = {
        name: student === null || student === void 0 ? void 0 : student.studentInfo.studentName,
        courseId: courseId,
        semesterId: semesterId,
        lurnNumber: student === null || student === void 0 ? void 0 : student.studentInfo.lurnRegistrationNo,
        courseCode: student === null || student === void 0 ? void 0 : student.courseCode,
        currentSemester: student === null || student === void 0 ? void 0 : student.currentSemester,
        universityId: student === null || student === void 0 ? void 0 : student.studentInfo.universityId,
        studentInfo: {
            courseFullName: courseMetaData === null || courseMetaData === void 0 ? void 0 : courseMetaData.fullCourseName,
            studentEmail: student === null || student === void 0 ? void 0 : student.studentInfo.emailId,
            studentContactNumber: student === null || student === void 0 ? void 0 : student.studentInfo.studentPhoneNumber,
            dateOfBirth: student === null || student === void 0 ? void 0 : student.studentInfo.dateOfBirth,
            gender: student === null || student === void 0 ? void 0 : student.studentInfo.gender,
            aadharNumber: student === null || student === void 0 ? void 0 : student.studentInfo.aadharNumber
        },
        parentInfo: {
            fatherName: student === null || student === void 0 ? void 0 : student.studentInfo.fatherName,
            motherName: student === null || student === void 0 ? void 0 : student.studentInfo.motherName,
            contactNumber: (_a = student === null || student === void 0 ? void 0 : student.studentInfo.fatherPhoneNumber) !== null && _a !== void 0 ? _a : ((_b = student === null || student === void 0 ? void 0 : student.studentInfo.motherPhoneNumber) !== null && _b !== void 0 ? _b : ''),
        },
        academicInfo: matchedSubjects
    };
    return (0, formatResponse_1.formatResponse)(res, 200, "Student Fetched Successfully!", true, responseObject);
}));
function getEnrolledSubjectsForStudent(studentId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!studentId)
            throw new Error("Invalid student ID");
        const studentDoc = yield student_1.Student.findById(studentId).lean();
        const currentSem = studentDoc === null || studentDoc === void 0 ? void 0 : studentDoc.semester.find((s) => s.semesterNumber === studentDoc.currentSemester);
        const semesterId = currentSem === null || currentSem === void 0 ? void 0 : currentSem.semesterId;
        const studentData = yield student_1.Student.aggregate([
            {
                $match: { _id: studentId }
            },
            {
                $addFields: {
                    currentSemesterData: {
                        $first: {
                            $filter: {
                                input: "$semester",
                                as: "sem",
                                cond: { $eq: ["$$sem.semesterNumber", "$currentSemester"] }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    courseId: 1,
                    currentSemester: 1,
                    semesterId: "$currentSemesterData.semesterId",
                    subjects: "$currentSemesterData.subjects"
                }
            },
            {
                $lookup: {
                    from: "courses",
                    let: { courseId: "$courseId", semesterId: "$semesterId" },
                    pipeline: [
                        { $match: { $expr: { $eq: ["$_id", "$$courseId"] } } },
                        {
                            $project: {
                                semester: {
                                    $filter: {
                                        input: "$semester",
                                        as: "sem",
                                        cond: { $eq: ["$$sem._id", "$$semesterId"] }
                                    }
                                }
                            }
                        },
                        { $unwind: "$semester" },
                        { $unwind: "$semester.subjects" },
                        {
                            $replaceRoot: { newRoot: "$semester.subjects" }
                        }
                    ],
                    as: "courseSubjects"
                }
            },
            {
                $project: {
                    subjects: 1,
                    courseSubjects: {
                        $filter: {
                            input: "$courseSubjects",
                            as: "subject",
                            cond: {
                                $in: ["$$subject._id", {
                                        $map: {
                                            input: "$subjects",
                                            as: "s",
                                            in: "$$s.subjectId"
                                        }
                                    }]
                            }
                        }
                    }
                }
            },
            { $unwind: "$courseSubjects" },
            { $unwind: "$courseSubjects.instructor" },
            {
                $unwind: {
                    path: "$courseSubjects.schedule.lecturePlan",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: {
                        subjectId: "$courseSubjects._id",
                        instructorId: "$courseSubjects.instructor"
                    },
                    subjectName: { $first: "$courseSubjects.subjectName" },
                    subjectCode: { $first: "$courseSubjects.subjectCode" },
                    lectureCount: {
                        $sum: {
                            $cond: [
                                { $eq: ["$courseSubjects.schedule.lecturePlan.instructor", "$courseSubjects.instructor"] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id.instructorId",
                    foreignField: "_id",
                    as: "instructorInfo"
                }
            },
            {
                $unwind: {
                    path: "$instructorInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 0,
                    subjectId: "$_id.subjectId",
                    instructorId: "$_id.instructorId",
                    subjectName: 1,
                    subjectCode: 1,
                    numberOfLectures: "$lectureCount",
                    instructorName: {
                        $concat: ["$instructorInfo.firstName", " ", "$instructorInfo.lastName"]
                    }
                }
            }
        ]);
        return {
            semesterId,
            studentData
        };
    });
}
