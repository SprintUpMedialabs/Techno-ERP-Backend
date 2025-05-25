export function getISTDate(offsetDays = 0): Date {
    const now = new Date(); 
    const ist = new Date(now.getTime() + 330 * 60000); 
    ist.setDate(ist.getDate() + offsetDays);
    ist.setHours(0, 0, 0, 0);
    return ist;
}
