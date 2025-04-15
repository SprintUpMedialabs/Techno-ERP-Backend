import express from 'express';
import { getDropDownDataByType } from './dropDownMetadataController';

export const dropDownRoute = express.Router();

dropDownRoute.get('/:type', getDropDownDataByType);
