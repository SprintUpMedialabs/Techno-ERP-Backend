"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketingAnalyticsEnum = exports.Actions = exports.FinanceFeeSchedule = exports.FinanceFeeType = exports.TransactionTypes = exports.FeeActions = exports.Schedule = exports.FeeStatus = exports.CourseYears = exports.CourseMaterialType = exports.RequestAction = exports.LectureConfirmation = exports.COLLECTION_NAMES = exports.PHOTO = exports.TGI = exports.ADMISSION = exports.AreaType = exports.Countries = exports.StatesOfIndia = exports.AdmissionMode = exports.FeeType = exports.Locations = exports.ModuleNames = exports.ApplicationStatus = exports.DocumentType = exports.AdmittedThrough = exports.BloodGroup = exports.Religion = exports.FormNoPrefixes = exports.EducationLevel = exports.Course = exports.PhysicalDocumentNoteStatus = exports.DropDownType = exports.AdmissionReference = exports.Category = exports.FinalConversionType = exports.LeadType = exports.Source = exports.Gender = exports.UserRoles = void 0;
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
    UserRoles["REGISTAR"] = "REGISTAR";
    UserRoles["HOD"] = "HOD";
    UserRoles["INSTRUCTOR"] = "INSTRUCTOR";
    UserRoles["SYSTEM_ADMIN"] = "SYSTEM_ADMIN";
})(UserRoles || (exports.UserRoles = UserRoles = {}));
var Gender;
(function (Gender) {
    Gender["MALE"] = "MALE";
    Gender["FEMALE"] = "FEMALE";
    Gender["OTHER"] = "OTHERS";
})(Gender || (exports.Gender = Gender = {}));
var Source;
(function (Source) {
    Source["SCHOOL"] = "School";
})(Source || (exports.Source = Source = {}));
// Left Over Leads
// Not Interested
var LeadType;
(function (LeadType) {
    LeadType["LEFT_OVER"] = "LEFT_OVER";
    LeadType["NOT_INTERESTED"] = "NOT_INTERESTED";
    LeadType["ACTIVE"] = "ACTIVE";
    LeadType["NEUTRAL"] = "NEUTRAL";
    LeadType["DID_NOT_PICK"] = "DID_NOT_PICK";
    LeadType["COURSE_UNAVAILABLE"] = "COURSE_UNAVAILABLE";
    LeadType["INVALID"] = "INVALID";
})(LeadType || (exports.LeadType = LeadType = {}));
var FinalConversionType;
(function (FinalConversionType) {
    FinalConversionType["NO_FOOTFALL"] = "NO_FOOTFALL";
    FinalConversionType["NEUTRAL"] = "NEUTRAL";
    FinalConversionType["ADMISSION"] = "ADMISSION";
    FinalConversionType["NOT_INTERESTED"] = "NOT_INTERESTED";
})(FinalConversionType || (exports.FinalConversionType = FinalConversionType = {}));
/*
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
    AdmissionReference["TechnoligenceStaffCalling"] = "Technoligence";
    AdmissionReference["Other"] = "Other";
})(AdmissionReference || (exports.AdmissionReference = AdmissionReference = {}));
var DropDownType;
(function (DropDownType) {
    DropDownType["MARKETING_CITY"] = "MARKETING_CITY";
    DropDownType["FIX_MARKETING_CITY"] = "FIX_MARKETING_CITY";
    DropDownType["DISTRICT"] = "DISTRICT";
    DropDownType["MARKETING_SOURCE"] = "MARKETING_SOURCE";
    DropDownType["MARKETING_COURSE_CODE"] = "MARKETING_COURSE_CODE";
    DropDownType["FIX_MARKETING_COURSE_CODE"] = "FIX_MARKETING_COURSE_CODE";
})(DropDownType || (exports.DropDownType = DropDownType = {}));
var PhysicalDocumentNoteStatus;
(function (PhysicalDocumentNoteStatus) {
    PhysicalDocumentNoteStatus["PENDING"] = "PENDING";
    PhysicalDocumentNoteStatus["VERIFIED"] = "VERIFIED";
    PhysicalDocumentNoteStatus["NOT_APPLICABLE"] = "NOT_APPLICABLE";
})(PhysicalDocumentNoteStatus || (exports.PhysicalDocumentNoteStatus = PhysicalDocumentNoteStatus = {}));
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
var EducationLevel;
(function (EducationLevel) {
    EducationLevel["Tenth"] = "10th";
    EducationLevel["Twelfth"] = "12th";
    EducationLevel["Graduation"] = "Graduation";
    EducationLevel["Others"] = "Others";
})(EducationLevel || (exports.EducationLevel = EducationLevel = {}));
var FormNoPrefixes;
(function (FormNoPrefixes) {
    FormNoPrefixes["TIHS"] = "TIHS";
    FormNoPrefixes["TIMS"] = "TIMS";
    FormNoPrefixes["TCL"] = "TCL";
    FormNoPrefixes["PHOTO"] = "PHOTO";
})(FormNoPrefixes || (exports.FormNoPrefixes = FormNoPrefixes = {}));
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
    DocumentType["SIGNATURE"] = "Signature";
})(DocumentType || (exports.DocumentType = DocumentType = {}));
var ApplicationStatus;
(function (ApplicationStatus) {
    ApplicationStatus["STEP_1"] = "Step_1";
    ApplicationStatus["STEP_2"] = "Step_2";
    ApplicationStatus["STEP_3"] = "Step_3";
    ApplicationStatus["STEP_4"] = "Step_4";
    ApplicationStatus["CONFIRMED"] = "Confirmed";
})(ApplicationStatus || (exports.ApplicationStatus = ApplicationStatus = {}));
var ModuleNames;
(function (ModuleNames) {
    ModuleNames["MARKETING"] = "MARKETING";
    ModuleNames["ADMISSION"] = "ADMISSION";
    ModuleNames["COURSE"] = "COURSE";
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
var FeeType;
(function (FeeType) {
    FeeType["HOSTEL"] = "HOSTEL";
    FeeType["TRANSPORT"] = "TRANSPORT";
    FeeType["PROSPECTUS"] = "PROSPECTUS";
    FeeType["STUDENTID"] = "STUDENTID";
    FeeType["UNIFORM"] = "UNIFORM";
    FeeType["STUDENTWELFARE"] = "STUDENTWELFARE";
    FeeType["BOOKBANK"] = "BOOKBANK";
    FeeType["EXAMFEES"] = "EXAMFEES";
})(FeeType || (exports.FeeType = FeeType = {}));
var AdmissionMode;
(function (AdmissionMode) {
    AdmissionMode["ONLINE"] = "ONLINE";
    AdmissionMode["OFFLINE"] = "OFFLINE";
})(AdmissionMode || (exports.AdmissionMode = AdmissionMode = {}));
var StatesOfIndia;
(function (StatesOfIndia) {
    StatesOfIndia["ANDHRA_PRADESH"] = "Andhra Pradesh";
    StatesOfIndia["ARUNACHAL_PRADESH"] = "Arunachal Pradesh";
    StatesOfIndia["ASSAM"] = "Assam";
    StatesOfIndia["BIHAR"] = "Bihar";
    StatesOfIndia["CHHATTISGARH"] = "Chhattisgarh";
    StatesOfIndia["GOA"] = "Goa";
    StatesOfIndia["GUJARAT"] = "Gujarat";
    StatesOfIndia["HARYANA"] = "Haryana";
    StatesOfIndia["HIMACHAL_PRADESH"] = "Himachal Pradesh";
    StatesOfIndia["JHARKHAND"] = "Jharkhand";
    StatesOfIndia["KARNATAKA"] = "Karnataka";
    StatesOfIndia["KERALA"] = "Kerala";
    StatesOfIndia["MADHYA_PRADESH"] = "Madhya Pradesh";
    StatesOfIndia["MAHARASHTRA"] = "Maharashtra";
    StatesOfIndia["MANIPUR"] = "Manipur";
    StatesOfIndia["MEGHALAYA"] = "Meghalaya";
    StatesOfIndia["MIZORAM"] = "Mizoram";
    StatesOfIndia["NAGALAND"] = "Nagaland";
    StatesOfIndia["ODISHA"] = "Odisha";
    StatesOfIndia["PUNJAB"] = "Punjab";
    StatesOfIndia["RAJASTHAN"] = "Rajasthan";
    StatesOfIndia["SIKKIM"] = "Sikkim";
    StatesOfIndia["TAMIL_NADU"] = "Tamil Nadu";
    StatesOfIndia["TELANGANA"] = "Telangana";
    StatesOfIndia["TRIPURA"] = "Tripura";
    StatesOfIndia["UTTAR_PRADESH"] = "Uttar Pradesh";
    StatesOfIndia["UTTARAKHAND"] = "Uttarakhand";
    StatesOfIndia["WEST_BENGAL"] = "West Bengal";
    StatesOfIndia["ANDAMAN_AND_NICOBAR_ISLANDS"] = "Andaman and Nicobar Islands";
    StatesOfIndia["CHANDIGARH"] = "Chandigarh";
    StatesOfIndia["DADRA_AND_NAGAR_HAVELI_AND_DAMAN_AND_DIU"] = "Dadra and Nagar Haveli and Daman and Diu";
    StatesOfIndia["DELHI"] = "Delhi";
    StatesOfIndia["JAMMU_AND_KASHMIR"] = "Jammu and Kashmir";
    StatesOfIndia["LADAKH"] = "Ladakh";
    StatesOfIndia["LAKSHADWEEP"] = "Lakshadweep";
    StatesOfIndia["PUDUCHERRY"] = "Puducherry";
})(StatesOfIndia || (exports.StatesOfIndia = StatesOfIndia = {}));
var Countries;
(function (Countries) {
    Countries["India"] = "India";
    Countries["NON_INDIA"] = "Non-India";
})(Countries || (exports.Countries = Countries = {}));
var AreaType;
(function (AreaType) {
    AreaType["URBAN"] = "URBAN";
    AreaType["RURAL"] = "RURAL";
    AreaType["OTHERS"] = "OTHERS";
})(AreaType || (exports.AreaType = AreaType = {}));
exports.ADMISSION = 'admissions';
exports.TGI = "TGI";
exports.PHOTO = "PHOTO";
// export const MARKETING_SHEET = 'Marketing Sheet'
var COLLECTION_NAMES;
(function (COLLECTION_NAMES) {
    COLLECTION_NAMES["USER"] = "User";
    COLLECTION_NAMES["VERIFY_OTP"] = "VerifyOtp";
    COLLECTION_NAMES["ENQUIRY"] = "Enquiry";
    COLLECTION_NAMES["ENQUIRY_DRAFT"] = "EnquiryDraft";
    COLLECTION_NAMES["ENQUIRY_ID_META_DATA"] = "EnquiryIdMetaData";
    COLLECTION_NAMES["STUDENT_FEE"] = "studentFee";
    COLLECTION_NAMES["STUDENT_FEE_DRAFT"] = "studentFeeDraft";
    COLLECTION_NAMES["DEPARTMENT_COURSE"] = "deptandcourse";
    COLLECTION_NAMES["LEAD"] = "Lead";
    COLLECTION_NAMES["SPREADSHEET_META_DATA"] = "spreadSheetMetaData";
    COLLECTION_NAMES["YELLOW_LEAD"] = "YellowLead";
    COLLECTION_NAMES["COURSE_OTHER_FEES"] = "CourseAndOtherFees";
    COLLECTION_NAMES["STUDENT"] = "Student";
    COLLECTION_NAMES["DEPARTMENT_META_DATA"] = "DepartmentMetaData";
    COLLECTION_NAMES["COURSE_METADATA"] = "CourseMetadata";
    COLLECTION_NAMES["COURSE"] = "Course";
    COLLECTION_NAMES["DROP_DOWN_META_DATA"] = "DropDownMetaData";
    COLLECTION_NAMES["STUDENTREPO"] = "StudentRepo";
    COLLECTION_NAMES["TRANSACTION_HISTORY"] = "TransactionHistory";
    COLLECTION_NAMES["TECHNO_META_DATA"] = "TechnoMetaData";
    COLLECTION_NAMES["MARKETING_FOLLOW_UP_RAW_DATA"] = "MarketingFollowUpData";
    COLLECTION_NAMES["MARKETING_ANALYTICS"] = "MarketingAnalytics";
    COLLECTION_NAMES["COURSE_DUES"] = "CourseDues";
    COLLECTION_NAMES["COLLEGE_META_DATA"] = "CollegeMetaData";
})(COLLECTION_NAMES || (exports.COLLECTION_NAMES = COLLECTION_NAMES = {}));
var LectureConfirmation;
(function (LectureConfirmation) {
    LectureConfirmation["CONFIRMED"] = "CONFIRMED";
    LectureConfirmation["DELAYED"] = "DELAYED";
    LectureConfirmation["TO_BE_DONE"] = "TO_BE_DONE";
})(LectureConfirmation || (exports.LectureConfirmation = LectureConfirmation = {}));
var RequestAction;
(function (RequestAction) {
    RequestAction["PUT"] = "PUT";
    RequestAction["POST"] = "POST";
    RequestAction["DELETE"] = "DELETE";
    RequestAction["PATCH"] = "PATCH";
})(RequestAction || (exports.RequestAction = RequestAction = {}));
var CourseMaterialType;
(function (CourseMaterialType) {
    CourseMaterialType["LPLAN"] = "LPlan";
    CourseMaterialType["PPLAN"] = "PPlan";
    CourseMaterialType["GENERAL"] = "General";
})(CourseMaterialType || (exports.CourseMaterialType = CourseMaterialType = {}));
var CourseYears;
(function (CourseYears) {
    CourseYears["First"] = "First";
    CourseYears["Second"] = "Second";
    CourseYears["Third"] = "Third";
    CourseYears["Fourth"] = "Fourth";
    CourseYears["Fifth"] = "Fifth";
    CourseYears["Sixth"] = "Sixth";
})(CourseYears || (exports.CourseYears = CourseYears = {}));
var FeeStatus;
(function (FeeStatus) {
    FeeStatus["DUE"] = "DUE";
    FeeStatus["PAID"] = "PAID";
})(FeeStatus || (exports.FeeStatus = FeeStatus = {}));
var Schedule;
(function (Schedule) {
    Schedule["ONE_TIME"] = "ONE_TIME";
    Schedule["SEMESTER"] = "SEMESTER";
    Schedule["YEARLY"] = "YEARLY";
    Schedule["OPTIONAL"] = "OPTIONAL";
    Schedule["AS_APPLICABLE"] = "AS_APPLICABLE";
})(Schedule || (exports.Schedule = Schedule = {}));
var FeeActions;
(function (FeeActions) {
    FeeActions["REFUND"] = "REFUND";
    FeeActions["DEPOSIT"] = "DEPOSIT";
})(FeeActions || (exports.FeeActions = FeeActions = {}));
var TransactionTypes;
(function (TransactionTypes) {
    TransactionTypes["NEFT_IMPS_RTGS"] = "NEFT/RTGS/IMPS";
    TransactionTypes["UPI"] = "UPI";
    TransactionTypes["CASH"] = "CASH";
    TransactionTypes["CHEQUE"] = "CHEQUE";
    TransactionTypes["OTHERS"] = "OTHERS";
})(TransactionTypes || (exports.TransactionTypes = TransactionTypes = {}));
var FinanceFeeType;
(function (FinanceFeeType) {
    FinanceFeeType["HOSTEL"] = "HOSTEL";
    FinanceFeeType["TRANSPORT"] = "TRANSPORT";
    FinanceFeeType["PROSPECTUS"] = "PROSPECTUS";
    FinanceFeeType["STUDENTID"] = "STUDENTID";
    FinanceFeeType["UNIFORM"] = "UNIFORM";
    FinanceFeeType["STUDENTWELFARE"] = "STUDENTWELFARE";
    FinanceFeeType["BOOKBANK"] = "BOOKBANK";
    FinanceFeeType["EXAMFEES"] = "EXAMFEES";
    FinanceFeeType["MISCELLANEOUS"] = "MISCELLANEOUS";
    FinanceFeeType["SEMESTERFEE"] = "SEMESTERFEE";
})(FinanceFeeType || (exports.FinanceFeeType = FinanceFeeType = {}));
var FinanceFeeSchedule;
(function (FinanceFeeSchedule) {
    FinanceFeeSchedule["HOSTEL"] = "YEARLY";
    FinanceFeeSchedule["TRANSPORT"] = "YEARLY";
    FinanceFeeSchedule["PROSPECTUS"] = "ONETIME";
    FinanceFeeSchedule["STUDENTID"] = "ONETIME";
    FinanceFeeSchedule["UNIFORM"] = "ONETIME";
    FinanceFeeSchedule["STUDENTWELFARE"] = "YEARLY";
    FinanceFeeSchedule["BOOKBANK"] = "HALF_YEARLY";
    FinanceFeeSchedule["EXAMFEES"] = "HALF_YEARLY";
    FinanceFeeSchedule["MISCELLANEOUS"] = "HALF_YEARLY";
    FinanceFeeSchedule["SEMESTERFEE"] = "HALF_YEARLY";
})(FinanceFeeSchedule || (exports.FinanceFeeSchedule = FinanceFeeSchedule = {}));
var Actions;
(function (Actions) {
    Actions["INCREAMENT"] = "INCREAMENT";
    Actions["DECREAMENT"] = "DECREAMENT";
})(Actions || (exports.Actions = Actions = {}));
var MarketingAnalyticsEnum;
(function (MarketingAnalyticsEnum) {
    MarketingAnalyticsEnum["NO_OF_CALLS"] = "NO_OF_CALLS";
})(MarketingAnalyticsEnum || (exports.MarketingAnalyticsEnum = MarketingAnalyticsEnum = {}));
