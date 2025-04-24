"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCourseYrFromSemNum = exports.getAcaYrFromStartYrSemNum = void 0;
//Here the semester number will be based on 1-based indexing
// If my starting year is 2021 and I have taken a 4 year course.
// Academic Year 1 = 2021-22
// Academic Year 2 = 2022-23
// Academic Year 3 = 2023-24
// Academic Year 4 = 2024-25 
const getAcaYrFromStartYrSemNum = (startYear, semesterNumber) => {
    const academicStart = startYear + Math.floor(semesterNumber / 2);
    const academicEnd = academicStart + 1;
    return `${academicStart}-${academicEnd}`;
};
exports.getAcaYrFromStartYrSemNum = getAcaYrFromStartYrSemNum;
const yearMap = {
    1: "First",
    2: "Second",
    3: "Third",
    4: "Fourth",
    5: "Fifth",
    6: "Sixth"
};
const getCourseYrFromSemNum = (semesterNumber) => {
    console.log(semesterNumber);
    if (semesterNumber < 1)
        return "Unknown";
    const yearNumber = Math.ceil(semesterNumber / 2);
    console.log(yearNumber);
    return yearMap[yearNumber] || "Unknown";
};
exports.getCourseYrFromSemNum = getCourseYrFromSemNum;
