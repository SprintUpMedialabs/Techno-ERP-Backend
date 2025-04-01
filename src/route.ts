import express from 'express';
import { authRouter } from './auth/routes/authRoute';
import { userRouter } from './auth/routes/userRoute';
import { crmRoute } from './crm/routes/crmRoute';
import { admissionRoute } from './admission/routes';
import feesRouter from './fees/courseAndOtherFees.routes';
import { studentDataRoute } from './student-data/routes/studentRoute';

export const apiRouter = express.Router();

/**
 * Contains the router for Authentication
 */
apiRouter.use('/auth', authRouter);

/**
 * Contains the router for User
 */
apiRouter.use('/user', userRouter);

/**
 * Contains the router for CRM Module
 */
apiRouter.use('/crm', crmRoute);


apiRouter.use('/admission',admissionRoute);


apiRouter.use('/fees-structure',feesRouter);


apiRouter.use('/student-data', studentDataRoute);