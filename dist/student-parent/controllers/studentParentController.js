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
exports.getScheduleInformation = exports.getStudentInformation = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const student_1 = require("../../student/models/student");
const courseMetadata_1 = require("../../course/models/courseMetadata");
const mongoose_1 = __importDefault(require("mongoose"));
const formatResponse_1 = require("../../utils/formatResponse");
const course_1 = require("../../course/models/course");
const user_1 = require("../../auth/models/user");
const http_errors_1 = __importDefault(require("http-errors"));
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
exports.getStudentInformation = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { universityId } = req.body;
    const student = yield student_1.Student.findOne({ 'studentInfo.universityId': universityId });
    const courseMetaData = yield courseMetadata_1.CourseMetaData.findOne({ 'courseCode': student === null || student === void 0 ? void 0 : student.courseCode });
    const courseId = student === null || student === void 0 ? void 0 : student.courseId;
    console.log("Student id : ", student === null || student === void 0 ? void 0 : student._id);
    const _c = yield getEnrolledSubjectsForStudent(student === null || student === void 0 ? void 0 : student._id), { semesterId, id } = _c, matchedSubjects = __rest(_c, ["semesterId", "id"]);
    console.log("Matched subjects : ", matchedSubjects);
    const responseObject = {
        id: id,
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
            id: studentDoc === null || studentDoc === void 0 ? void 0 : studentDoc._id,
            semesterId,
            studentData
        };
    });
}
exports.getScheduleInformation = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { studentId, courseId, semesterId, subjectId } = req.body;
    courseId = new mongoose_1.default.Types.ObjectId(courseId);
    semesterId = new mongoose_1.default.Types.ObjectId(semesterId);
    subjectId = new mongoose_1.default.Types.ObjectId(subjectId);
    const result = yield student_1.Student.aggregate([
        { $match: { _id: new mongoose_1.default.Types.ObjectId(studentId) } },
        {
            $project: {
                semester: {
                    $filter: {
                        input: "$semester",
                        as: "sem",
                        cond: { $eq: ["$$sem.semesterId", semesterId] }
                    }
                }
            }
        },
        { $unwind: "$semester" },
        {
            $project: {
                subjects: {
                    $filter: {
                        input: "$semester.subjects",
                        as: "subj",
                        cond: { $eq: ["$$subj.subjectId", subjectId] }
                    }
                }
            }
        },
        { $unwind: "$subjects" },
        {
            $project: {
                lecturePlan: "$subjects.attendance.lecturePlan",
                practicalPlan: "$subjects.attendance.practicalPlan"
            }
        }
    ]);
    const scheduleData = yield course_1.Course.aggregate([
        {
            $match: { _id: courseId }
        },
        {
            $project: {
                semester: {
                    $filter: {
                        input: "$semester",
                        as: "sem",
                        cond: { $eq: ["$$sem._id", semesterId] }
                    }
                }
            }
        },
        { $unwind: "$semester" },
        {
            $project: {
                subjects: {
                    $filter: {
                        input: "$semester.subjects",
                        as: "subj",
                        cond: { $eq: ["$$subj._id", subjectId] }
                    }
                }
            }
        },
        { $unwind: "$subjects" },
        {
            $project: {
                schedule: "$subjects.schedule"
            }
        }
    ]);
    const schedule = scheduleData[0].schedule || {};
    const studentSchedule = result[0] || { lecturePlan: [], practicalPlan: [] };
    const studentLecturePlan = studentSchedule.lecturePlan || [];
    const studentPracticalPlan = studentSchedule.practicalPlan || [];
    const lecturePlan = schedule.lecturePlan || [];
    const practicalPlan = schedule.practicalPlan || [];
    const additionalResources = schedule.additionalResources || [];
    const documents = [];
    const studentLectureMap = new Map(studentLecturePlan.map((entry) => { var _a; return [entry.id.toString(), (_a = entry.attended) !== null && _a !== void 0 ? _a : false]; }));
    const studentPracticalMap = new Map(studentPracticalPlan.map((entry) => { var _a; return [entry.id.toString(), (_a = entry.attended) !== null && _a !== void 0 ? _a : false]; }));
    const instructorMap = new Map();
    const getInstructorName = (instructorId) => __awaiter(void 0, void 0, void 0, function* () {
        if (instructorMap.has(instructorId)) {
            return instructorMap.get(instructorId);
        }
        const user = yield user_1.User.findById(instructorId).select("firstName lastName");
        if (!user) {
            throw (0, http_errors_1.default)("Invalid instructor ID found!");
        }
        const fullName = `${user.firstName} ${user.lastName}`;
        instructorMap.set(instructorId, fullName);
        return fullName;
    });
    const transformedLecturePlan = yield Promise.all(lecturePlan.map((lecture) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        const id = lecture._id.toString();
        const isAttended = studentLectureMap.has(id) ? studentLectureMap.get(id) : false;
        const headingName = `L-${lecture.lectureNumber}. ${lecture.topicName}`;
        if (lecture.documents) {
            lecture.documents.forEach((doc) => {
                documents.push({ headingName, fileUrl: doc });
            });
        }
        const instructorName = yield getInstructorName(lecture.instructor.toString());
        return {
            id: lecture._id,
            unitNumber: (_a = lecture.unit) !== null && _a !== void 0 ? _a : null,
            lectureNumber: (_b = lecture.lectureNumber) !== null && _b !== void 0 ? _b : null,
            topicName: (_c = lecture.topicName) !== null && _c !== void 0 ? _c : "",
            date: (_d = (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(lecture.actualDate)) !== null && _d !== void 0 ? _d : null,
            instructorName: instructorName,
            isAttended
        };
    })));
    const transformedPracticalPlan = yield Promise.all(practicalPlan.map((practical) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c;
        const id = practical._id.toString();
        const isAttended = studentPracticalMap.has(id) ? studentPracticalMap.get(id) : false;
        const headingName = `P-${practical.lectureNumber}. ${practical.topicName}`;
        if (practical.documents) {
            practical.documents.forEach((doc) => {
                documents.push({ headingName, fileUrl: doc });
            });
        }
        const instructorName = yield getInstructorName(practical.instructor.toString());
        return {
            id: practical._id,
            lectureNumber: (_a = practical.lectureNumber) !== null && _a !== void 0 ? _a : null,
            topicName: (_b = practical.topicName) !== null && _b !== void 0 ? _b : "",
            date: (_c = (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(practical.actualDate)) !== null && _c !== void 0 ? _c : null,
            instructorName: instructorName,
            isAttended
        };
    })));
    additionalResources.forEach((doc) => {
        documents.push({
            headingName: "General",
            fileUrl: doc
        });
    });
    const responseObject = {
        lecturePlan: transformedLecturePlan,
        practicalPlan: transformedPracticalPlan,
        documents
    };
    console.log("Response Object : ", responseObject);
    return (0, formatResponse_1.formatResponse)(res, 200, "Attendance fetched successfully", true, responseObject);
}));
