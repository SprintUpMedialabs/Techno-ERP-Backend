"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreviousDayDateTime = void 0;
const getPreviousDayDateTime = () => {
    const today = new Date();
    const startOfYesterday = new Date(today);
    startOfYesterday.setDate(today.getDate() - 1);
    startOfYesterday.setHours(0, 0, 0, 0);
    const endOfYesterday = new Date(today);
    endOfYesterday.setDate(today.getDate() - 1);
    endOfYesterday.setHours(23, 59, 59, 999);
    return {
        startOfYesterday: startOfYesterday,
        endOfYesterday: endOfYesterday
    };
};
exports.getPreviousDayDateTime = getPreviousDayDateTime;
