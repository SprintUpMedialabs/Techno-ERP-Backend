import moment from "moment-timezone";

export function getISTDate(offsetDays = 0): Date {
    const now = moment().tz('Asia/Kolkata');
    const ist = now.clone().add(offsetDays, 'days').startOf('day').toDate();
    return ist;
}
