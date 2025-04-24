// Utility functions
const formatDate = (date: string): string => {
    if (!date) {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, "0");
        const mm = String(today.getMonth() + 1).padStart(2, "0"); // Months are zero-based
        const yyyy = today.getFullYear();
        date = `${dd}/${mm}/${yyyy}`;
    }
    const normalized = date.replace(/-/g, "/");
    const parts = normalized.split("/");
    if (parts.length === 3) {
        let [day, month, year] = parts;
        if (year.length === 2) {
            year = "20" + year;
        }
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    return normalized;
};

const toTitleCase = (text: string): string => {
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

const extractLast10Digits = (number: string): string => {
    if (!number) {
        return "";
    }
    const digits = number.replace(/\D/g, ""); // Remove non-digits
    return digits.slice(-10); // Take last 10 digits
};

const splitEmails = (input: string): string[] => {
    if (!input) {
        return [];
    }
    return input
        .split(/[,| ]+/) // Split by comma, pipe, or space
        .map(email => email.trim())
        .filter(email => email.length > 0);
};