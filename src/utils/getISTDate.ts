export function getISTDate(offsetDays = 0): Date {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const ist = new Date(utc + 330 * 60000);
    ist.setDate(ist.getDate() + offsetDays);
    ist.setHours(0, 0, 0, 0);
    return ist;
}  