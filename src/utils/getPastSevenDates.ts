import moment from 'moment-timezone';
import { convertToMongoDate } from "./convertDateToFormatedDate";

export function getPastSevenDates(dateStr: string): Date[] {
  const baseDate = convertToMongoDate(dateStr);

  const istZone = 'Asia/Kolkata';
  const pastDates: Date[] = [];

  // Start from 7 days ago up to today
  for (let i = 7; i >= 0; i--) {
    const pastDate = moment.tz(baseDate, istZone)
      .subtract(i, 'days')
      .startOf('day')
      .toDate();
    pastDates.push(pastDate);
  }

  return pastDates;
}
