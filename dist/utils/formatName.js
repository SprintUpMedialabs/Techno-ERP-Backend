"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatName = void 0;
const formatName = (firstName, lastName) => {
    return (firstName.charAt(0).toUpperCase() +
        firstName.slice(1).toLowerCase() +
        ' ' +
        lastName.charAt(0).toUpperCase() +
        lastName.slice(1).toLowerCase());
};
exports.formatName = formatName;
