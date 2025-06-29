import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import { formatResponse } from "../../utils/formatResponse";
import { CourseMetaData } from "../../course/models/courseMetadata";
import { CourseDues } from "../../course/models/courseDues";
import mongoose from "mongoose";

export const updateCourseDues = expressAsyncHandler(async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {

    // Fetch all course metadata with courseCode
    const courseMetadata = await CourseMetaData.find(
      { courseCode: { $exists: true } },
    )

    // Create a map to store courseCode and corresponding departmentName
    const courseCodeMap = new Map<string, string>();
    courseMetadata.forEach(course => {
      if (course.courseCode) {
        courseCodeMap.set(course.courseCode, course.departmentName ?? '');
      }
    });

    //save department names in coursedues
    const courseDues = await CourseDues.find({
      courseCode: { $exists: true },
    })

    // Iterate through course dues and update departmentName based on courseCode
    for (const due of courseDues) {
      if (due.courseCode && courseCodeMap.has(due.courseCode)) {
        due.departmentName = courseCodeMap.get(due.courseCode) ?? '';
      } else {
        due.departmentName = '';
      }
      await due.save({session});
    }

    await session.commitTransaction();
    return formatResponse(res, 200, "Student dues updated successfully", true, {});


  } catch (error) {
    return formatResponse(res, 500, "Internal Server Error", false, error);
  }
  finally {
    session.endSession();
  }
});
