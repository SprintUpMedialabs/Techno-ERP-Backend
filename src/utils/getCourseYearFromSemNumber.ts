import { CourseYears } from "../config/constants"
import { Course } from "../course/models/course";

const CourseYear = ["",CourseYears.First, CourseYears.Second, CourseYears.Third, CourseYears.Fourth, CourseYears.Fifth, CourseYears.Sixth];

export const getCourseYearFromSemNumber = (semesterNumber : number) => {
    console.log("Semester Number : ", semesterNumber);
    const courseYear = CourseYear[Math.ceil(semesterNumber/2.0)];
    console.log("Course Year is : ", courseYear);
    return courseYear;
}