import express from "express";
import { authenticate, authorize } from "../../middleware/jwtAuthenticationMiddleware";
import { UserRoles } from "../../config/constants";
import { editFeeBreakUp, fetchFeeInformationByStudentId, fetchFeeUpdatesHistory, getStudentDues, recordPayment } from "../controllers/studentDuesController";

export const studentFeeRoute = express.Router();

studentFeeRoute.post("/active-dues",
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    getStudentDues
);

studentFeeRoute.get("/fee-information/:id",
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    fetchFeeInformationByStudentId
);

studentFeeRoute.post("/record-payment",
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    recordPayment
);

studentFeeRoute.post("/fee-update-history",
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    fetchFeeUpdatesHistory
);

studentFeeRoute.put("/fee-breakup",
    authenticate,
    authorize([UserRoles.BASIC_USER]),
    editFeeBreakUp
);