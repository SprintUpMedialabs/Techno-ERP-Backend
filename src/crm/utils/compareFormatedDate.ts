export const compareDates = (date1: string, date2: string): number => {
  const [day1, month1, year1] = date1.split('-').map(Number);
  const [day2, month2, year2] = date2.split('-').map(Number);

  if (year1 !== year2) return year1 - year2;
  if (month1 !== month2) return month1 - month2;
  return day1 - day2;
};
