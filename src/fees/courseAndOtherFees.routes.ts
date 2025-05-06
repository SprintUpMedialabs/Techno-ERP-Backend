import { Router } from 'express';
import {
    createFeesStructure,
    updateFeesStructure,
    getAllFeesStructures,
    getFeesStructureById,
    getCourseFeeByCourseName,
    getOtherFees
} from './courseAndOtherFees.controller';

export const feesRouter = Router();

feesRouter.post('/', createFeesStructure);
// feesRouter.put('/:id', updateFeesStructure);
feesRouter.get('/', getAllFeesStructures);
// feesRouter.get('/:id', getFeesStructureById);

feesRouter.get('/course/:courseName', getCourseFeeByCourseName);
feesRouter.get('/other-fees/:courseName', getOtherFees);



export default feesRouter;
