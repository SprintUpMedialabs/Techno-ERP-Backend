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
