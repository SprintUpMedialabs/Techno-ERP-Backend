import { LeadType } from "../../config/constants";

// Utility functions
export const formatDate = (date: string | undefined): string => {
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

export const toTitleCase = (text: string | undefined): string => {
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

export const formatAndValidateLeadType = (val?: string): LeadType => {
    const leadTypeValues = Object.values(LeadType);
    const formatted = val?.trim().toUpperCase();
    return (formatted && leadTypeValues.includes(formatted as LeadType))
        ? formatted as LeadType
        : LeadType.OPEN;
};

export const extractLast10Digits = (number: string | undefined): string => {
    if (!number) {
        return "";
    }
    const digits = number.replace(/\D/g, ""); // Remove non-digits
    return digits.slice(-10); // Take last 10 digits
};

export const splitEmails = (input: string): string[] => {
    if (!input) {
        return [];
    }
    return input
        .split(/[,| ]+/) // Split by comma, pipe, or space
        .map(email => email.trim())
        .filter(email => email.length > 0);
};

export const normaliseText = (text : string | undefined) => text === undefined?  text : text.toLowerCase().replace(/[\W_]+/g, ''); 