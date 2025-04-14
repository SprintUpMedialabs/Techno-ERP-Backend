//Here the semester number will be based on 1-based indexing
// If my starting year is 2021 and I have taken a 4 year course.
// Academic Year 1 = 2021-22
// Academic Year 2 = 2022-23
// Academic Year 3 = 2023-24
// Academic Year 4 = 2024-25 
export const getAcaYrFromStartYrSemNum = (startYear : number, semesterNumber : number) => {
    const academicStart = startYear + Math.floor(semesterNumber / 2);
    const academicEnd = academicStart + 1;
    return `${academicStart}-${academicEnd}`;
}