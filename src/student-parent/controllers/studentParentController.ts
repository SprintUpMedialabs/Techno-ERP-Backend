import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Response } from "express";
import { Student } from "../../student/models/student";
import { CourseMetaData } from "../../course/models/courseMetadata";
import mongoose from "mongoose";
import { formatResponse } from "../../utils/formatResponse";


export const getStudentInformation = expressAsyncHandler(async (req : AuthenticatedRequest, res: Response)=>{
    const { universityId } = req.body;

    const student = await Student.findOne({ 'studentInfo.universityId' : universityId });
    const courseMetaData = await CourseMetaData.findOne({ 'courseCode' : student?.courseCode });
    
    const courseId = student?.courseId;

    console.log("Student id : ", student?._id);
    const { semesterId, ...matchedSubjects} = await getEnrolledSubjectsForStudent(student?._id)
    console.log("Matched subjects : ", matchedSubjects);


    const responseObject = {
        name : student?.studentInfo.studentName,
        courseId : courseId,
        semesterId : semesterId,
        lurnNumber : student?.studentInfo.lurnRegistrationNo,
        courseCode : student?.courseCode,
        currentSemester : student?.currentSemester,
        universityId : student?.studentInfo.universityId,
        studentInfo : {
            courseFullName : courseMetaData?.fullCourseName,
            studentEmail : student?.studentInfo.emailId,
            studentContactNumber : student?.studentInfo.studentPhoneNumber,
            dateOfBirth : student?.studentInfo.dateOfBirth,
            gender : student?.studentInfo.gender,
            aadharNumber : student?.studentInfo.aadharNumber
        },
        parentInfo : {
            fatherName : student?.studentInfo.fatherName,
            motherName : student?.studentInfo.motherName,
            contactNumber : student?.studentInfo.fatherPhoneNumber ?? (student?.studentInfo.motherPhoneNumber ?? ''),
        },
        academicInfo : matchedSubjects
    };

    return formatResponse(res, 200, "Student Fetched Successfully!", true, responseObject);
})

async function getEnrolledSubjectsForStudent(studentId: mongoose.Types.ObjectId | undefined) {
  if (!studentId) throw new Error("Invalid student ID");
  
  const studentDoc = await Student.findById(studentId).lean();
  const currentSem = studentDoc?.semester.find(
    (s) => s.semesterNumber === studentDoc.currentSemester
  );
  const semesterId = currentSem?.semesterId;

  const studentData = await Student.aggregate([
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
        _id : 0,
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
}
