"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MARKETING_SHEET = exports.ADMISSION = exports.Locations = exports.ModuleNames = exports.MimeType = exports.ApplicationStatus = exports.DocumentType = exports.AdmittedThrough = exports.BloodGroup = exports.Religion = exports.ApplicationIdPrefix = exports.AcademicDetails = exports.Course = exports.AdmissionReference = exports.Category = exports.FinalConversionType = exports.LeadType = exports.Gender = exports.UserRoles = void 0;
/**
 * Marketing Module Enums
*/
var UserRoles;
(function (UserRoles) {
    UserRoles["ADMIN"] = "ADMIN";
    UserRoles["LEAD_MARKETING"] = "LEAD_MARKETING";
    UserRoles["EMPLOYEE_MARKETING"] = "EMPLOYEE_MARKETING";
    UserRoles["BASIC_USER"] = "BASIC_USER";
    UserRoles["COUNSELOR"] = "COUNSELOR";
})(UserRoles || (exports.UserRoles = UserRoles = {}));
var Gender;
(function (Gender) {
    Gender["MALE"] = "MALE";
    Gender["FEMALE"] = "FEMALE";
    Gender["OTHER"] = "OTHERS";
    Gender["NOT_TO_MENTION"] = "NOT_TO_MENTION";
})(Gender || (exports.Gender = Gender = {}));
var LeadType;
(function (LeadType) {
    LeadType["ORANGE"] = "OPEN";
    LeadType["RED"] = "NOT_INTERESTED";
    LeadType["BLACK"] = "COURSE_UNAVAILABLE";
    LeadType["BLUE"] = "NO_CLARITY";
    LeadType["YELLOW"] = "INTERESTED";
    LeadType["GREEN"] = "ADMISSION";
    LeadType["WHITE"] = "DID_NOT_PICK";
})(LeadType || (exports.LeadType = LeadType = {}));
var FinalConversionType;
(function (FinalConversionType) {
    FinalConversionType["PINK"] = "PENDING";
    FinalConversionType["GREEN"] = "CONVERTED";
    FinalConversionType["RED"] = "NOT_CONVERTED";
})(FinalConversionType || (exports.FinalConversionType = FinalConversionType = {}));
/**
 * Admission Module Enums
*/
var Category;
(function (Category) {
    Category["SC"] = "SC";
    Category["ST"] = "ST";
    Category["OBC"] = "OBC";
    Category["GENERAL"] = "General";
    Category["EWS"] = "EWS";
    Category["OTHER"] = "Other";
})(Category || (exports.Category = Category = {}));
;
var AdmissionReference;
(function (AdmissionReference) {
    AdmissionReference["Advertising"] = "Advertising";
    AdmissionReference["BusinessAssociate"] = "Business Associate";
    AdmissionReference["DigitalMarketing"] = "Digital Marketing";
    AdmissionReference["DirectWalkIn"] = "Direct Walk-in";
    AdmissionReference["LUNPGExternalVenue"] = "LU/NPG/External Venue";
    AdmissionReference["StudentReference"] = "Student Reference";
    AdmissionReference["TechnoligenceStaffCalling"] = "Technoligence/Staff Calling";
    AdmissionReference["Other"] = "Other";
})(AdmissionReference || (exports.AdmissionReference = AdmissionReference = {}));
;
var Course;
(function (Course) {
    Course["BCOM"] = "BCOM";
    Course["BCOMH"] = "BCOMH";
    Course["BAJMC"] = "BAJMC";
    Course["BED"] = "BED";
    Course["BSCM"] = "BSCM";
    Course["BSCB"] = "BSCB";
    Course["BBA"] = "BBA";
    Course["BCA"] = "BCA";
    Course["BVAA"] = "BVAA";
    Course["BVAP"] = "BVAP";
    Course["MAJMC"] = "MAJMC";
    Course["MCOMC"] = "MCOMC";
    Course["MBA"] = "MBA";
    Course["LLB"] = "LLB";
    Course["MCA"] = "MCA";
    Course["MVAP"] = "MVAP";
    Course["MSCC"] = "MSCC";
})(Course || (exports.Course = Course = {}));
var AcademicDetails;
(function (AcademicDetails) {
    AcademicDetails["Tenth"] = "10th";
    AcademicDetails["Twelfth"] = "12th";
    AcademicDetails["Graduation"] = "Graduation";
    AcademicDetails["Others"] = "Others";
})(AcademicDetails || (exports.AcademicDetails = AcademicDetails = {}));
var ApplicationIdPrefix;
(function (ApplicationIdPrefix) {
    ApplicationIdPrefix["TIHS"] = "TIHS";
    ApplicationIdPrefix["TIMS"] = "TIMS";
    ApplicationIdPrefix["TCL"] = "TCL";
})(ApplicationIdPrefix || (exports.ApplicationIdPrefix = ApplicationIdPrefix = {}));
var Religion;
(function (Religion) {
    Religion["HINDUISM"] = "Hinduism";
    Religion["ISLAM"] = "Islam";
    Religion["CHRISTIANITY"] = "Christianity";
    Religion["SIKHISM"] = "Sikhism";
    Religion["BUDDHISM"] = "Buddhism";
    Religion["JAINISM"] = "Jainism";
    Religion["OTHERS"] = "Others";
})(Religion || (exports.Religion = Religion = {}));
var BloodGroup;
(function (BloodGroup) {
    BloodGroup["A_POSITIVE"] = "A+";
    BloodGroup["A_NEGATIVE"] = "A-";
    BloodGroup["B_POSITIVE"] = "B+";
    BloodGroup["B_NEGATIVE"] = "B-";
    BloodGroup["AB_POSITIVE"] = "AB+";
    BloodGroup["AB_NEGATIVE"] = "AB-";
    BloodGroup["O_POSITIVE"] = "O+";
    BloodGroup["O_NEGATIVE"] = "O-";
})(BloodGroup || (exports.BloodGroup = BloodGroup = {}));
var AdmittedThrough;
(function (AdmittedThrough) {
    AdmittedThrough["DIRECT"] = "Direct";
    AdmittedThrough["COUNSELLING"] = "Counselling";
})(AdmittedThrough || (exports.AdmittedThrough = AdmittedThrough = {}));
var DocumentType;
(function (DocumentType) {
    DocumentType["TENTH_MARKSHEET"] = "10th_Marksheet";
    DocumentType["TENTH_CERTIFICATE"] = "10th_Certificate";
    DocumentType["TWELFTH_MARKSHEET"] = "12th_Marksheet";
    DocumentType["TWELFTH_CERTIFICATE"] = "12th_Certificate";
    DocumentType["GRADUATION_FINAL_YEAR_MARKSHEET"] = "Graduation_Final_Year_Marksheet";
    DocumentType["CHARACTER_CERTIFICATE"] = "Character_Certificate";
    DocumentType["TC_MIGRATION"] = "TC_Migration";
    DocumentType["MEDICAL_CERTIFICATE"] = "Medical_Certificate";
    DocumentType["ANTI_RAGGING_BY_STUDENT"] = "Anti_Ragging_by_Student";
    DocumentType["ANTI_RAGGING_BY_PARENT"] = "Anti_Ragging_by_Parent";
    DocumentType["ALLOTMENT_LETTER"] = "Allotment_Letter";
    DocumentType["PHOTO"] = "Photo";
    DocumentType["CASTE_CERTIFICATE"] = "Caste_Certificate";
    DocumentType["INCOME_CERTIFICATE"] = "Income_Certificate";
    DocumentType["NIVAS_CERTIFICATE"] = "Nivas_Certificate";
    DocumentType["GAP_AFFIDAVIT"] = "Gap_Affidavit";
    DocumentType["AADHAR"] = "Aadhar";
    DocumentType["DECLARATION_FILLED"] = "Declaration_Filled";
    DocumentType["PHYSICALLY_HANDICAPPED_CERTIFICATE"] = "Physically_Handicapped_Certificate";
    DocumentType["EWS_CERTIFICATE"] = "EWS_Certificate";
})(DocumentType || (exports.DocumentType = DocumentType = {}));
var ApplicationStatus;
(function (ApplicationStatus) {
    ApplicationStatus["STEP_1"] = "Step_1";
    ApplicationStatus["STEP_2"] = "Step_2";
    ApplicationStatus["STEP_3"] = "Step_3";
    ApplicationStatus["STEP_4"] = "Step_4";
})(ApplicationStatus || (exports.ApplicationStatus = ApplicationStatus = {}));
var MimeType;
(function (MimeType) {
    MimeType["PNG"] = "image/png";
    MimeType["JPG"] = "image/jpeg";
    MimeType["JPEG"] = "image/jpeg";
    MimeType["PDF"] = "application/pdf";
})(MimeType || (exports.MimeType = MimeType = {}));
var ModuleNames;
(function (ModuleNames) {
    ModuleNames["MARKETING"] = "MARKETING";
})(ModuleNames || (exports.ModuleNames = ModuleNames = {}));
var Locations;
(function (Locations) {
    Locations["KNP"] = "Kanpur";
    Locations["UNA"] = "Unnao";
    Locations["STP"] = "Sitapur";
    Locations["HRD"] = "Hardoi";
    Locations["BBK"] = "Barabanki";
    Locations["AMT"] = "Amethi";
    Locations["FTP"] = "Fatehpur";
    Locations["LKO"] = "Lucknow";
})(Locations || (exports.Locations = Locations = {}));
exports.ADMISSION = 'admissions';
exports.MARKETING_SHEET = 'Marketing Sheet';
