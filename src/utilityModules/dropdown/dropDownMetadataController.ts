import expressAsyncHandler from "express-async-handler";
import { Response, Request } from 'express';
import { DropDownType } from "../../config/constants";
import createHttpError from "http-errors";
import { DropDownMetaData } from "./dropDownMetaDeta";
import { formatResponse } from "../../utils/formatResponse";

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
    const sortedValues = value.sort((a, b) => a.localeCompare(b));

    await DropDownMetaData.findOneAndUpdate(
        { type },
        { value: sortedValues },
        { new: true, runValidators: true }
    );
}

export const formatDropdownValue = (input: string): string => {
    if (!input.trim()) return '';
    return input
        .toLowerCase()
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
