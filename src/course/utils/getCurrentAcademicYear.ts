export const getCurrentAcademicYear = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    return currentMonth>=6 ? `${currentYear}-${(currentYear + 1).toString()}` : `${currentYear - 1}-${currentYear.toString()}`;
}

export const getCurrentAdmissionAcademicYear = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    return `${currentYear.toString()}-${(currentYear + 1).toString()}`;
}