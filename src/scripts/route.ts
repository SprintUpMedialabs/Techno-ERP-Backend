import { Router } from "express";
import { updateCourseDues } from "./updateCourseDues/controller";
import { addRemark2and4 } from "./Reamrk2And4/addRemark2and4";
import { redefineAdmissionAnalytics } from "./AdmissionAnalytics/controller";
import { saveAddressLine2OfEnquiry, saveAddressLine2OfEnquiryDraft, saveAddressLine2OfStudent } from "./address/contollers";
import { getAbsentStudents } from "./absentPhoneNos/contollers";
import { uploadExcel } from "./addStudents/controller";
import { bookBankModifyFee } from "./bookbankfee/controller";

export const scriptsRouter = Router();

/** for updating course dues */
scriptsRouter.get("/update-course-dues", updateCourseDues);

/** for adding step2And4Remark to student */
scriptsRouter.get("/addRemark2and4", addRemark2and4);

/** for redefining admission analytics */
scriptsRouter.get("/redefine-admission-analytics", redefineAdmissionAnalytics);

/** for address saving to student, enquiries */
scriptsRouter.get('/save-address-line-2-of-student', saveAddressLine2OfStudent);
scriptsRouter.get('/save-address-line-2-of-enquiry', saveAddressLine2OfEnquiry);
scriptsRouter.get('/save-address-line-2-of-enquiry-draft', saveAddressLine2OfEnquiryDraft);

/** for get absent phone numbers */
scriptsRouter.post(
  "/get-absent-phone-numbers",
  getAbsentStudents
)

/** add students */
scriptsRouter.get("/upload-excel", uploadExcel);

/** for book bank fee modification */
scriptsRouter.get("/book-bank-modify-fee", bookBankModifyFee);