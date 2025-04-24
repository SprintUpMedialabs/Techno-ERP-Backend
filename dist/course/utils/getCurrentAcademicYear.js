"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentAcademicYear = void 0;
const getCurrentAcademicYear = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    return currentMonth >= 6 ? `${currentYear}-${(currentYear + 1).toString()}` : `${currentYear - 1}-${currentYear.toString()}`;
};
exports.getCurrentAcademicYear = getCurrentAcademicYear;
