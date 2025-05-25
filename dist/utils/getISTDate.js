"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getISTDate = getISTDate;
function getISTDate(offsetDays = 0) {
    const now = new Date();
    const ist = new Date(now.getTime() + 330 * 60000);
    ist.setDate(ist.getDate() + offsetDays);
    ist.setHours(0, 0, 0, 0);
    return ist;
}
