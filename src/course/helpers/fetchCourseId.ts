import { Course } from "../models/course";

export const fetchCourseIdFromSYCC = async (courseCode : string, startingYear : string) => {
    let parsedStartingYear = parseInt(startingYear);

    const course = await Course.findOne({
        courseCode: courseCode.toString(),
        startingYear: parsedStartingYear,
      }).select('_id');
    
    return course;
}