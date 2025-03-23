export const convertToMongoDate = (dateString: string | Date): Date => {
  // console.log("In conversion date");
  // console.log(dateString);
  if (dateString instanceof Date) {
    return dateString;
  }
  // Split the date string into day, month, and year
  const [day, month, year] = dateString.split('/').map(Number);

  // console.log(day)
  // console.log(month)
  // console.log(year)
  // Create a JavaScript Date object (Months are 0-based in JavaScript)
  console.log(new Date(Date.UTC(year, month-1, day)));
  return new Date(Date.UTC(year, month - 1, day));
};

export const convertToDDMMYYYY = (dateObj: Date | string): string => {
  if (typeof dateObj === 'string') {
    dateObj = new Date(dateObj);
  }
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(Number(dateObj.getMonth()) + 1).padStart(2, '0'); // Month is 0-based
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
};