import moment from "moment-timezone";

export const getPreviousDayDateTime = () => {
    const now = moment().tz('Asia/Kolkata');

    return {
        startOfYesterday : now.clone().subtract(1, 'days').startOf('day').toDate(),
        endOfYesterday : now.clone().subtract(1, 'days').endOf('day').toDate(),
    }
}