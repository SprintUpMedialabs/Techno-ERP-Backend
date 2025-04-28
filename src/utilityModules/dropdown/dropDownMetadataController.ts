import expressAsyncHandler from "express-async-handler";
import { Response, Request } from 'express';
import { DropDownType } from "../../config/constants";
import createHttpError from "http-errors";
import { DropDownMetaData } from "./dropDownMetaDeta";
import { formatResponse } from "../../utils/formatResponse";
import logger from "../../config/logger";

export const getDropDownDataByType = expressAsyncHandler(async (req: Request, res: Response) => {
    const { type } = req.params;

    // Validate type
    if (!Object.values(DropDownType).includes(type as DropDownType)) {
        throw createHttpError(400, 'Invalid dropdown type');
    }

    const dropdown = await DropDownMetaData.findOne({ type });

    if (!dropdown) {
        throw createHttpError(404, 'Dropdown data not found for given type');
    }

    return formatResponse(res, 200, 'dropdown daa fetched successfully', true, dropdown.value);
});

export const updateDropDownByType = async (type: DropDownType, value: string[]) => {
    // Test: we need to test whether updated values are sorted or not
    
    const sortedValues = value.sort((a, b) => {
        if (a === "Other") return 1;
        if (b === "Other") return -1;
        return a.localeCompare(b);
    });

    try {
        await DropDownMetaData.findOneAndUpdate(
            { type },
            { value: sortedValues },
            { new: true, runValidators: true }
        );
    } catch (error) {
        logger.error(`Error updating dropdown by type: ${type}`, error);
    }
}

export const updateOnlyOneValueInDropDown = async (type: DropDownType, value?: string) => {
    if (!value) return;
    let formattedValue;
    if (type == DropDownType.FIX_COURSE || type == DropDownType.COURSE) {
        formattedValue = formatCapital(value);
    } else {
        formattedValue = formatDropdownValue(value);
    }
    const dropdown = await DropDownMetaData.findOne({ type });
    const dropdownSet = new Set(dropdown?.value || []);
    dropdownSet.add(formattedValue);

    const sortedValues = Array.from(dropdownSet).sort((a, b) => {
        if (a === "Other") return 1;
        if (b === "Other") return -1;
        return a.localeCompare(b);
    });

    try {
        await DropDownMetaData.findOneAndUpdate(
            { type },
            { value: sortedValues },
            { new: true, runValidators: true }
        );
    } catch (error) {
        logger.error(`Error updating only one value in dropdown by type: ${type}`, error);
    }
}

export const formatCapital = (input: string): string => {
    return input
        .toUpperCase();
}

export const formatDropdownValue = (input: string): string => {
    if (!input.trim()) return '';
    return input
        .toLowerCase()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
