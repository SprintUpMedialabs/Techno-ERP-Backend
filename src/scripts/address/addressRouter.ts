import { Router } from "express";
import { saveAddressLine2OfEnquiry, saveAddressLine2OfEnquiryDraft, saveAddressLine2OfStudent } from "./contollers";

export const AddressRoute = Router();


AddressRoute.get('/save-address-line-2-of-student', saveAddressLine2OfStudent);
AddressRoute.get('/save-address-line-2-of-enquiry', saveAddressLine2OfEnquiry);
AddressRoute.get('/save-address-line-2-of-enquiry-draft', saveAddressLine2OfEnquiryDraft);
