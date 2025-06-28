import express from 'express';
import { admissionRoute } from './admission/routes';
import { authRouter } from './auth/routes/authRoute';
import { userRouter } from './auth/routes/userRoute';
import courseMetaDataRoute from './course/routes/courseMetadataRoute';
import { courseRoute } from './course/routes/courseRoute';
import { departmentMetaDataRoute } from './course/routes/departmentMetaDataRoute';
import { testRoute } from './course/routes/testRoute';
import { crmRoute } from './crm/routes/crmRoute';
import feesRouter from './fees/courseAndOtherFees.routes';
import { studentRoute } from './student/routes';
import { dropDownRoute } from './utilityModules/dropdown/dropDownRoute';
import { downloadRoute } from './common/route';
import { backupRoute } from './backup/backupController';
import { financeAnalyticsRoute } from './student/routes/financeAnalyticsRoute';
import { piplineRouter } from './pipline/piplineRoute';
import { studentParentRoute } from './student-parent/routes/studentParentRoute';
import { studentAuthRoute } from './student/routes/auth/studentAuthRoute';
import { scriptsRouter } from './scripts/route';


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

apiRouter.use('/student-auth', studentAuthRoute);


apiRouter.use('/student-parent', studentParentRoute);

apiRouter.use('/download-reciept', downloadRoute);

apiRouter.use('/backup', backupRoute);
apiRouter.use('/fee-analytics', financeAnalyticsRoute);

apiRouter.use('/pipline', piplineRouter);

apiRouter.use("/scripts", scriptsRouter);
