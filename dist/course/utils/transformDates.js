"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformDates = void 0;
const convertDateToFormatedDate_1 = require("../../utils/convertDateToFormatedDate");
const transformDates = (data) => {
    if (Array.isArray(data)) {
        return data.map(exports.transformDates);
    }
    if (data && typeof data === 'object') {
        Object.keys(data).forEach((key) => {
            if (key === 'actualDate' || key === 'plannedDate') {
                if (data[key]) {
                    data[key] = (0, convertDateToFormatedDate_1.convertToDDMMYYYY)(data[key]);
                }
            }
            else if (typeof data[key] === 'object') {
                data[key] = (0, exports.transformDates)(data[key]);
            }
        });
    }
    return data;
};
exports.transformDates = transformDates;
