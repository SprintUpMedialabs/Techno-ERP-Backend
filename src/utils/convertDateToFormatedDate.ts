import moment from 'moment-timezone';

export const convertToMongoDate = (dateString?: string | Date): Date | null => {
  if (!dateString || dateString === "") {
    return null;
  }
  const istZone = 'Asia/Kolkata';
  if (dateString instanceof Date) {
    // Interpret this date in IST and set time to start of day
    return moment.tz(dateString, istZone).startOf('day').toDate();
  }

  // Parse the string assuming it's in 'DD/MM/YYYY' format in IST
  const date = moment.tz(dateString, 'DD/MM/YYYY', istZone);

  return date.startOf('day').toDate();
};


export const convertToDDMMYYYY = (dateObj: Date | string | undefined): string => {
  if (!dateObj) return "";

  return moment.tz(dateObj, 'Asia/Kolkata').format('DD/MM/YYYY');
};
