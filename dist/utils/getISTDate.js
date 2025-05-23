"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getISTDate = getISTDate;
function getISTDate(offsetDays = 0) {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const ist = new Date(utc + 330 * 60000);
    ist.setDate(ist.getDate() + offsetDays);
    ist.setHours(0, 0, 0, 0);
    return ist;
}
