import express from 'express';
import { getDocumentTypeByCourseCode } from './courseController';

export const courseRoute = express.Router();

courseRoute.get('/:courseCode', getDocumentTypeByCourseCode);
