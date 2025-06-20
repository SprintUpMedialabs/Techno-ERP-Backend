import express from "express";
import { authenticate, authorize } from "../../middleware/jwtAuthenticationMiddleware";
import { UserRoles } from "../../config/constants";
import { editFeeBreakUp, fetchFeeInformationByStudentId, fetchFeeUpdatesHistory, getStudentDues, recordPayment } from "../controllers/studentDuesController";

export const studentFeeRoute = express.Router();

studentFeeRoute.post("/active-dues",
    authenticate,
    authorize([UserRoles.FINANCE]),
    getStudentDues
);

studentFeeRoute.get("/fee-information/:id",
    authenticate,
    authorize([UserRoles.FINANCE]),
    fetchFeeInformationByStudentId
);

studentFeeRoute.post("/record-payment",
    authenticate,
    authorize([UserRoles.FINANCE]),
    recordPayment
);

studentFeeRoute.post("/fee-update-history",
    authenticate,
    authorize([UserRoles.FINANCE]),
    fetchFeeUpdatesHistory
);

studentFeeRoute.put("/fee-breakup",
    authenticate,
    authorize([UserRoles.FINANCE]),
    editFeeBreakUp
);