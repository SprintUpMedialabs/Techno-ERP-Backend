"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildStudentFilter = void 0;
const buildStudentFilter = (studentFilterData) => {
    const filter = {};
    if (studentFilterData.course) {
        filter.course = { $regex: studentFilterData.course, $options: 'i' };
    }
    if (studentFilterData.semester) {
        filter.semester = { $regex: studentFilterData.semester, $options: 'i' };
    }
    return filter;
};
exports.buildStudentFilter = buildStudentFilter;
