import express from 'express';
import { authRouter } from './auth/routes/authRoute';
import { userRouter } from './auth/routes/userRoute';
import { crmRoute } from './crm/routes/crmRoute';
import { admissionRoute } from './admission/routes';
import feesRouter from './fees/courseAndOtherFees.routes';
import { courseRoute } from './course/routes/courseRoute';
import { studentDataRoute } from './student-data/routes/studentRoute';
import { departmentMetaDataRoute } from './course/routes/departmentMetaDataRoute';
import { dropDownRoute } from './utilityModules/dropdown/dropDownRoute';
import { testRoute } from './course/routes/testRoute';
import { studentRoute } from './student/routes/studentRoute';

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


/**
 * Contains the router for Admission Module
 */
apiRouter.use('/admission',admissionRoute);


/**
 * Contains the router for Fees Module
 */
apiRouter.use('/fees-structure',feesRouter);


/**
 * Contains the router for Course Module
 */
apiRouter.use('/course', courseRoute);


/**
 * Contains the router for Department Module
 */
apiRouter.use('/department-metadata', departmentMetaDataRoute);


/**
 * Contains the router for Course Metadata Module
 */
apiRouter.use('/course-metadata', courseMetaDataRoute);


/**
 * Contains the router for Student Data Module
 */
apiRouter.use('/student-data', studentDataRoute);


/**
 * Contains the router for Dropdown related information
 */
apiRouter.use('/dropdown', dropDownRoute);


/**
 * Contains the router for Testing Purpose
 */
apiRouter.use('/test', testRoute);

/**
 * Contains the router for Student Module
 */
apiRouter.use('/student', studentRoute);

