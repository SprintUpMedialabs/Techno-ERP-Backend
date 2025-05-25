import { convertToMongoDate } from "./convertDateToFormatedDate";

export function getPastSevenDates(dateStr: string) {
    const baseDate = convertToMongoDate(dateStr);
    if (isNaN(baseDate.getTime())) throw new Error("Invalid date");

    const pastDates: Date[] = [];

    for (let i = 7; i >= 0; i--) {
        const pastDate = new Date(Date.UTC(
            baseDate.getUTCFullYear(),
            baseDate.getUTCMonth(),
            baseDate.getUTCDate() - i
        ));
        pastDates.push(pastDate);
    }

    return pastDates;
}
