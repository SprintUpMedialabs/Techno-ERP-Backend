import express from "express";
import { studentFeeRoute } from "./studentFeeRoute";
import { studentRepoRoute } from "./studentRepo";
import { financeAnalyticsRoute } from "./financeAnalyticsRoute";

export const studentRoute = express.Router();

studentRoute.use('/fees', studentFeeRoute);
studentRoute.use('/repo', studentRepoRoute);
