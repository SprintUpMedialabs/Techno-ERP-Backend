import { IStudentFilter } from "../validators/studentFilterSchema";

export const buildStudentFilter = (studentFilterData : IStudentFilter) => {
    const filter: any = {};

    if (studentFilterData.course) {
        filter.course = { $regex: studentFilterData.course, $options: 'i' };
    }

    if (studentFilterData.semester) {
        filter.semester = { $regex: studentFilterData.semester, $options: 'i' };
    }

    return filter;
};
