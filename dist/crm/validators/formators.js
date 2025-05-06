"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.splitEmails = exports.extractLast10Digits = exports.formatAndValidateLeadType = exports.toTitleCase = exports.formatDate = void 0;
const constants_1 = require("../../config/constants");
// Utility functions
const formatDate = (date) => {
    if (!date) {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, "0");
        const mm = String(today.getMonth() + 1).padStart(2, "0"); // Months are zero-based
        const yyyy = today.getFullYear();
        date = `${mm}/${dd}/${yyyy}`;
    }
    const normalized = date.replace(/-/g, "/");
    const parts = normalized.split("/");
    if (parts.length === 3) {
        let [month, day, year] = parts;
        if (year.length === 2) {
            year = "20" + year;
        }
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    return normalized;
};
exports.formatDate = formatDate;
const toTitleCase = (text) => {
    if (!text) {
        return "";
    }
    return text
        .toLowerCase()
        .split(" ")
        .filter(Boolean)
        .map(word => word[0].toUpperCase() + word.slice(1))
        .join(" ");
};
exports.toTitleCase = toTitleCase;
const formatAndValidateLeadType = (val) => {
    const leadTypeValues = Object.values(constants_1.LeadType);
    const formatted = val === null || val === void 0 ? void 0 : val.trim().toUpperCase();
    return (formatted && leadTypeValues.includes(formatted))
        ? formatted
        : constants_1.LeadType.OPEN;
};
exports.formatAndValidateLeadType = formatAndValidateLeadType;
const extractLast10Digits = (number) => {
    if (!number) {
        return "";
    }
    const digits = number.replace(/\D/g, ""); // Remove non-digits
    return digits.slice(-10); // Take last 10 digits
};
exports.extractLast10Digits = extractLast10Digits;
const splitEmails = (input) => {
    if (!input) {
        return [];
    }
    return input
        .split(/[,| ]+/) // Split by comma, pipe, or space
        .map(email => email.trim())
        .filter(email => email.length > 0);
};
exports.splitEmails = splitEmails;
