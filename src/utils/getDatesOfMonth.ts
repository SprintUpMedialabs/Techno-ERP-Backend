import moment from "moment-timezone";
import createHttpError from "http-errors";

export function getDatesOfMonth(monthNumber: number): Date[] {
  if (monthNumber < 1 || monthNumber > 12) {
    throw createHttpError(400, "Invalid Month Number");
  }

  const istZone = "Asia/Kolkata";

  const baseDate = moment.tz(istZone);
  const year = baseDate.year();

  const startOfMonth = moment.tz({ year, month: monthNumber - 1, day: 1 }, istZone);
  const daysInMonth = startOfMonth.daysInMonth();

  const datesOfMonth: Date[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = moment.tz({ year, month: monthNumber - 1, day }, istZone)
      .startOf("day")
      .toDate();
    datesOfMonth.push(date);
  }

  return datesOfMonth;
}
