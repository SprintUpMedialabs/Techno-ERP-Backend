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

export const formatSource = (val?: string): string => {
    if (!val) return "Other";
    val = val.trim().toLowerCase();

    switch (val) {
        // Board Exam
        case "board":
        case "board exam":
            return "Board Exam";

        // CUET / Entrance
        case "entrance":
        case "cuet entrance":
        case "cuet":
            return "CUET";

        // Direct Call
        case "call":
        case "direct call":
        case "digital - direct call":
            return "Digital - Direct Call";

        // Google Ads
        case "google":
        case "ads":
        case "google ads":
        case "digital - google ads":
            return "Digital - Google Ads";

        // WhatsApp
        case "whatsapp":
        case "whatapp":
        case "digital - whatsapp":
            return "Digital - WhatsApp";

        // IVR
        case "ivr":
        case "digital - ivr":
            return "Digital - IVR";

        // Meta
        case "fb":
        case "insta":
        case "meta":
        case "digital - meta":
            return "Digital - Meta";

        // TawkTo
        case "tawk to":
        case "tawkto":
        case "digital - tawkto":
            return "Digital - TawkTo";

        // Website
        case "web":
        case "website":
        case "site":
        case "digital - website":
            return "Digital - Website";

        // PG Data
        case "pg":
        case "pg data":
            return "PG Data";

        // UG Data
        case "ug":
        case "ug data":
            return "UG Data";

        // Other
        case "other":
        case "othr":
        case "others":
            return "Other";

        default:
            return toTitleCase(val); // fallback if unknown
    }
};


export const formatAndValidateLeadType = (val?: string): LeadType => {
    const leadTypeValues = Object.values(LeadType);
    let formatted = val?.trim().toUpperCase();
    if( formatted === 'ACTIVE' || formatted=="INTERESTED" ) {
        formatted = 'ACTIVE';
    }else if( formatted === 'NOT_INTERESTED' || formatted=="DEAD" ) {
        formatted = 'NOT_INTERESTED';
    }
    return (formatted && leadTypeValues.includes(formatted as LeadType))
        ? formatted as LeadType
        : LeadType.LEFT_OVER;
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