import createHttpError from "http-errors";

export function getDatesOfMonth(monthNumber: number, year?: number): Date[] {
  if (monthNumber < 1 || monthNumber > 12) {
    throw createHttpError(400, "Invalid Month Number");
  }

  const baseYear = year ?? new Date().getUTCFullYear();
  const daysInMonth = new Date(Date.UTC(baseYear, monthNumber, 0)).getUTCDate();

  const datesOfMonth: Date[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(Date.UTC(baseYear, monthNumber - 1, day));
    datesOfMonth.push(date);
  }

  return datesOfMonth;
}
