export const ExcelDateToJSDate = (date: any) => {
  let convertedDate = new Date(Math.round((date - 25569) * 864e5));
  const dateString = convertedDate.toDateString().slice(4, 15);
  const dateParts = dateString.split(' ');

  const day = dateParts[1];
  let month = dateParts[0];
  const year = dateParts[2];
  const monthNumber = ('JanFebMarAprMayJunJulAugSepOctNovDec'.indexOf(month) / 3 + 1).toString();
  const paddedMonth = monthNumber.length === 1 ? '0' + monthNumber : monthNumber;

  const validDate = `${day}-${paddedMonth}-${year}`;
  // console.log(validDate.toString())
  return validDate.toString();
};

export const convertToMongoDate = (dateString: string | Date): Date => {
  if (dateString instanceof Date) {
    return dateString;
  }
  // Split the date string into day, month, and year
  const [day, month, year] = dateString.split('/').map(Number);

  // Create a JavaScript Date object (Months are 0-based in JavaScript)
  return new Date(year, month - 1, day);
};

const convertToDDMMYYYY = (dateObj: Date): string => {
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Month is 0-based
  const year = dateObj.getFullYear();
  return `${day}/${month}/${year}`;
};
