import { convertToDDMMYYYY } from "../../utils/convertDateToFormatedDate";

export const transformDates = (data: any)  : any => {
    if (Array.isArray(data)) {
        return data.map(transformDates);
    }

    if (data && typeof data === 'object') {
        Object.keys(data).forEach((key) => {
            if (key === 'actualDate' || key === 'plannedDate') {
                if (data[key]) {
                    data[key] = convertToDDMMYYYY(data[key]);
                }
            } 
            else if (typeof data[key] === 'object') {
                data[key] = transformDates(data[key]);
            }
        });
    }
    return data;
};
