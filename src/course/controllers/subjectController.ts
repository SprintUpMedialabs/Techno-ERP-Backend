import expressAsyncHandler from "express-async-handler";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { Response } from "express";
import mongoose, { Mongoose } from "mongoose";
import { Course } from "../models/course";
import { formatResponse } from "../../utils/formatResponse";
import { createSubjectSchema, deleteSubjectSchema, ICreateSubjectSchema, IDeleteSubjectSchema, IUpdateSubjectSchema, updateSubjectSchema } from "../validators/subjectSchema";
import createHttpError from "http-errors";
import { deleteFromS3 } from "../config/s3Delete";
import { getCurrentAcademicYear } from "../utils/getCurrentAcademicYear";

export const getSubjectInformation = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  let { courseId, semesterId, search } = req.body;

  const responsePayload = await fetchSubjectInformation(courseId, semesterId, search);
  return formatResponse(res, 200, 'Subject Details fetched for course and semester', true, responsePayload);
});


export const createSubject = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const subjectData: ICreateSubjectSchema = req.body;

  const validation = createSubjectSchema.safeParse(subjectData);

  if (!validation.success)
    throw createHttpError(400, validation.error.errors[0]);

  let { courseId, semesterId } = subjectData;

  const { subjectName, subjectCode, instructor } = subjectData;

  courseId = new mongoose.Types.ObjectId(courseId);
  semesterId = new mongoose.Types.ObjectId(semesterId);

  const instructorIds = instructor || [];

  const instructorObjectIDs = instructorIds.map(id => new mongoose.Types.ObjectId(id));

  const updateSemesterInformation = await Course.updateOne(
    { _id: courseId, "semester._id": semesterId },
    {
      $push: {
        "semester.$.subjects": {
          subjectName,
          subjectCode,
          instructor: instructorObjectIDs,
        }
      }
    }
  );

  if (updateSemesterInformation.modifiedCount === 0) {
    throw createHttpError(404, 'Error occurred saving the subject information');
  }
  const responsePayload = await fetchSubjectInformation(courseId.toString(), semesterId.toString(),"");

  return formatResponse(res, 201, 'Successfully added subject information', true, responsePayload);
});


export const updateSubject = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const updateSubjectData: IUpdateSubjectSchema = req.body;

  const validation = updateSubjectSchema.safeParse(updateSubjectData);
  if (!validation.success) {
    throw createHttpError(400, validation.error.errors[0].message);
  }

  const { courseId, semesterId, subjectId, subjectName, subjectCode, instructor } = updateSubjectData;

  const updatedSubject = await Course.findOneAndUpdate(
    {
      _id: courseId,
      "semester._id": semesterId,
      "semester.subjects._id": subjectId,
    },
    {
      $set: {
        "semester.$[sem].subjects.$[subj].subjectName": subjectName,
        "semester.$[sem].subjects.$[subj].subjectCode": subjectCode,
        "semester.$[sem].subjects.$[subj].instructor": instructor,
      },
    },
    {
      new: true,
      arrayFilters: [
        { "sem._id": semesterId },
        { "subj._id": subjectId }
      ],
      runValidators: true
    }
  );

  if (!updatedSubject) {
    throw createHttpError(404, 'Subject not found in course');
  }

  // const responsePayload = await fetchSubjectInformation(courseId.toString(), semesterId.toString(), "", 1, 10);

  return formatResponse(res, 200, 'Subject updated successfully', true, null);
});


export const deleteSubject = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

  const deleteSubjectData: IDeleteSubjectSchema = req.body;
  const validation = deleteSubjectSchema.safeParse(deleteSubjectData);


  if (!validation.success)
    throw createHttpError(400, validation.error.errors[0]);

  let { courseId, semesterId, subjectId } = deleteSubjectData;

  courseId = new mongoose.Types.ObjectId(courseId);
  semesterId = new mongoose.Types.ObjectId(semesterId);
  subjectId = new mongoose.Types.ObjectId(subjectId);


  const session = await mongoose.startSession();
  try {

    //First update DB and then in S3 to keep DB consistent.
    session.startTransaction();

    await Course.updateOne(
      {
        _id: courseId,
        "semester._id": semesterId,
        "semester.subjects._id": subjectId
      },
      {
        $set: {
          "semester.$[sem].subjects.$[subj].isDeleted": true
        }
      },
      {
        arrayFilters: [
          { "sem._id": semesterId },
          { "subj._id": subjectId }
        ],
        session
      }
    );

    console.log("Object of subject updated in db");
    await session.commitTransaction();

    const result = await Course.aggregate([
      { $match: { _id: courseId } },
      { $unwind: "$semester" },
      { $match: { "semester._id": semesterId } },
      { $unwind: "$semester.subjects" },
      { $match: { "semester.subjects._id": subjectId } },
      {
        $project: {
          lecturePlan: {
            $reduce: {
              input: "$semester.subjects.schedule.lecturePlan",
              initialValue: [],
              in: {
                $concatArrays: [
                  "$$value",
                  { $ifNull: ["$$this.documents", []] }
                ]
              }
            }
          },
          practicalPlan: {
            $reduce: {
              input: "$semester.subjects.schedule.practicalPlan",
              initialValue: [],
              in: {
                $concatArrays: [
                  "$$value",
                  { $ifNull: ["$$this.documents", []] }
                ]
              }
            }
          },
          additionalResources: {
            $ifNull: ["$semester.subjects.schedule.additionalResources", []]
          }
        }
      }
    ]);

    let docs = result[0];
    let additionalResources = docs.additionalResources;
    let practicalPlanDocs = docs.practicalPlan;
    let lecturePlanDocs = docs.lecturePlan;
    let allDocs = [...additionalResources, ...practicalPlanDocs, ...lecturePlanDocs];

    console.log(allDocs);

    for (const docUrl of allDocs) {
      await deleteFromS3(docUrl);
    }

    session.endSession();

    // const responsePayload = await fetchSubjectInformation(courseId.toString(), semesterId.toString(), "", 1, 10);

    return formatResponse(res, 200, 'Subject Deleted Successfully', true, null);
  }
  catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Transaction Error:", error);
    throw createHttpError(500, "Failed to delete subject");
  }
  finally {
    await session.endSession();
  }
});



export const fetchSubjectInformationUsingFilters = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {

  let { courseCode, semester, academicYear = getCurrentAcademicYear(), search, page = 1, limit = 10 } = req.body;
  semester = parseInt(semester);

  const skip = (page - 1) * limit;

  const pipeline: any[] = [
    ...(courseCode ? [{ $match: { courseCode } }] : []),

    {
      $addFields: {
        semesterDetails: academicYear || semester ? {
          $filter: {
            input: "$semester",
            as: "sem",
            cond: {
              $and: [
                ...(academicYear ? [{ $eq: ["$$sem.academicYear", academicYear] }] : []),
                ...(semester ? [{ $eq: ["$$sem.semesterNumber", semester] }] : [])
              ]
            }
          }
        } : "$semester"
      }
    },


    { $unwind: "$semesterDetails" },

    {
      $addFields: {
        courseYear: {
          $switch: {
            branches: [
              { case: { $in: ["$semesterDetails.semesterNumber", [1, 2]] }, then: "First" },
              { case: { $in: ["$semesterDetails.semesterNumber", [3, 4]] }, then: "Second" },
              { case: { $in: ["$semesterDetails.semesterNumber", [5, 6]] }, then: "Third" },
              { case: { $in: ["$semesterDetails.semesterNumber", [7, 8]] }, then: "Fourth" },
              { case: { $in: ["$semesterDetails.semesterNumber", [9, 10]] }, then: "Fifth" },
              { case: { $in: ["$semesterDetails.semesterNumber", [11, 12]] }, then: "Sixth" }
            ],
            default: "Unknown"
          }
        }
      }
    },
    {
      $unwind: {
        path: "$semesterDetails.subjects",
        preserveNullAndEmptyArrays: true
      }
    },  
    {
      $match: {
        $or: [
          { "semesterDetails.subjects": null },
          {
            $and: [
              { "semesterDetails.subjects.isDeleted": { $ne: true } },
              ...(search ? [{
                $or: [
                  { "semesterDetails.subjects.subjectName": { $regex: search, $options: "i" } },
                  { "semesterDetails.subjects.subjectCode": { $regex: search, $options: "i" } }
                ]
              }] : [])
            ]
          }
        ]
      }
    },     
    {
      $lookup: {
        from: "users",
        localField: "semesterDetails.subjects.instructor",
        foreignField: "_id",
        as: "instructorDetails"
      }
    },
    { $unwind: { path: "$instructorDetails", preserveNullAndEmptyArrays: true } },

    {
      $project: {
        _id: 0,
        courseId: "$_id",
        semesterId: "$semesterDetails._id",
        subjectId: "$semesterDetails.subjects._id",
        instructorId: "$instructorDetails._id",
        departmentMetaDataId: "$departmentMetaDataId",
        subjectName: "$semesterDetails.subjects.subjectName",
        subjectCode: "$semesterDetails.subjects.subjectCode",
        instructor: "$instructorDetails.firstName",
        courseName: "$courseName",
        courseCode: "$courseCode",
        courseYear: "$courseYear",
        semester: "$semesterDetails.semesterNumber",
        academicYear: "$semesterDetails.academicYear"
      }
    }
  ];

  const subjectInformation = await Course.aggregate(pipeline);
  console.log("Subject Information is : ", subjectInformation);
  return formatResponse(res, 200, 'Subject information fetched successfully with filters', true, subjectInformation);
});

export const fetchSubjectInformation = async (crsId: string, semId: string, search: string, page: number = 1, limit: number = 10) => {
  console.log("Course ID : ", crsId);
  let courseId = new mongoose.Types.ObjectId(crsId);
  let semesterId = new mongoose.Types.ObjectId(semId);
  const skip = (page - 1) * limit;
  
  const pipeline = [
    { $match: { _id: courseId } },
  
    {
      $addFields: {
        semesterDetails: {
          $first: {
            $filter: {
              input: "$semester",
              as: "sem",
              cond: { $eq: ["$$sem._id", semesterId] },
            },
          },
        },
      },
    },
  
    {
      $lookup: {
        from: "departmentmetadatas",
        localField: "departmentMetaDataId",
        foreignField: "_id",
        as: "departmentMetaData",
      },
    },
    { $unwind: { path: "$departmentMetaData", preserveNullAndEmptyArrays: true } },
  
    {
      $addFields: {
        courseYear: {
          $switch: {
            branches: [
              {
                case: { $in: ["$semesterDetails.semesterNumber", [1, 2]] },
                then: "First",
              },
              {
                case: { $in: ["$semesterDetails.semesterNumber", [3, 4]] },
                then: "Second",
              },
              {
                case: { $in: ["$semesterDetails.semesterNumber", [5, 6]] },
                then: "Third",
              },
              {
                case: { $in: ["$semesterDetails.semesterNumber", [7, 8]] },
                then: "Fourth",
              },
              {
                case: { $in: ["$semesterDetails.semesterNumber", [9, 10]] },
                then: "Fifth",
              },
              {
                case: { $in: ["$semesterDetails.semesterNumber", [11, 12]] },
                then: "Sixth",
              },
            ],
            default: "Unknown",
          },
        },
      },
    },
  
    // 🔍 Filter subjects into filteredSubjects array
    {
      $addFields: {
        filteredSubjects: {
          $filter: {
            input: "$semesterDetails.subjects",
            as: "subject",
            cond: {
              $and: [
                { $ne: ["$$subject.isDeleted", true] },
                ...(search
                  ? [
                      {
                        $or: [
                          {
                            $regexMatch: {
                              input: "$$subject.subjectName",
                              regex: search,
                              options: "i",
                            },
                          },
                          {
                            $regexMatch: {
                              input: "$$subject.subjectCode",
                              regex: search,
                              options: "i",
                            },
                          },
                        ],
                      },
                    ]
                  : []),
              ],
            },
          },
        },
      },
    },
  
    { $unwind: { path: "$filteredSubjects", preserveNullAndEmptyArrays: true } },
  
    {
      $lookup: {
        from: "users",
        localField: "filteredSubjects.instructor",
        foreignField: "_id",
        as: "instructorDetails",
      },
    },
    { $unwind: { path: "$instructorDetails", preserveNullAndEmptyArrays: true } },
  
    {
      $addFields: {
        subjectDetails: {
          subjectId: "$filteredSubjects._id",
          subjectName: "$filteredSubjects.subjectName",
          subjectCode: "$filteredSubjects.subjectCode",
          instructorName: "$instructorDetails.firstName",
          instructorId: "$instructorDetails._id",
          numberOfLectures: {
            $cond: [
              { $isArray: "$filteredSubjects.schedule.lecturePlan" },
              {
                $size: {
                  $filter: {
                    input: "$filteredSubjects.schedule.lecturePlan",
                    as: "lecture",
                    cond: {
                      $eq: ["$$lecture.instructor", "$instructorDetails._id"],
                    },
                  },
                },
              },
              0,
            ],
          },
        },
      },
    },
  
    {
      $group: {
        _id: {
          courseId: "$_id",
          courseName: "$courseName",
          courseCode: "$courseCode",
          semesterId: "$semesterDetails._id",
          semesterNumber: "$semesterDetails.semesterNumber",
          academicYear: "$semesterDetails.academicYear",
          courseYear: "$courseYear",
          collegeName: "$collegeName",
          departmentName: "$departmentMetaData.departmentName",
          departmentHOD: "$departmentMetaData.departmentHOD",
        },
        subjectDetails: { $push: "$subjectDetails" },
      },
    },
  
    {
      $project: {
        _id: 0,
        courseId: "$_id.courseId",
        courseName: "$_id.courseName",
        courseCode: "$_id.courseCode",
        semesterId: "$_id.semesterId",
        semesterNumber: "$_id.semesterNumber",
        academicYear: "$_id.academicYear",
        courseYear: "$_id.courseYear",
        collegeName: "$_id.collegeName",
        departmentName: "$_id.departmentName",
        departmentHOD: "$_id.departmentHOD",
        subjectDetails: {
          $filter: {
            input: "$subjectDetails",
            as: "subject",
            cond: {
              $and: [
                { $ne: ["$$subject", null] },
                { $ne: ["$$subject.subjectCode", undefined] },
                { $ne: ["$$subject.subjectName", undefined] },
                { $ne: ["$$subject.subjectCode", ""] },
                { $ne: ["$$subject.subjectName", ""] },
              ],
            },
          },
        },
      },
    },
  ];
  

  let subjectInfo = await Course.aggregate(pipeline);
  console.log("fetching subject details : ");
  console.log(subjectInfo[0]);

  subjectInfo[0].subjectDetails =  subjectInfo[0].subjectDetails.filter(
    (sub : any) => sub.subjectCode && sub.subjectName && sub.subjectCode !== "" && sub.subjectName !== ""
  );
  
  if(subjectInfo[0].subjectDetails === null)
    subjectInfo[0].subjectDetails = []

  return { "subjectInformation" : subjectInfo[0]};
}