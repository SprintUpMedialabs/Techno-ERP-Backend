import createHttpError from "http-errors";


export function getDatesOfMonth(monthNumber: number) {
    if (monthNumber < 1 || monthNumber > 12) {
      throw createHttpError(400, "Invalid Month Number");
    }
  
    const baseDate = new Date();
    const year = baseDate.getUTCFullYear();
  
    const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  
    const datesOfMonth: Date[] = [];
  
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(Date.UTC(year, monthNumber - 1, day));
      datesOfMonth.push(date);
    }
  
    return datesOfMonth;
  }
  