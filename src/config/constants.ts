/**
 * Marketing Module Enums
*/
export enum UserRoles {
  ADMIN = 'ADMIN',
  LEAD_MARKETING = 'LEAD_MARKETING',
  EMPLOYEE_MARKETING = 'EMPLOYEE_MARKETING',
  BASIC_USER = 'BASIC_USER',
  COUNSELOR = 'COUNSELOR',
  REGISTAR = 'REGISTAR',
  HOD = 'HOD',
  INSTRUCTOR = 'INSTRUCTOR'
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHERS'
}


export enum Source {
  SCHOOL = 'School'
}


export enum LeadType {
  OPEN = 'OPEN',
  DEAD = 'DEAD',
  COURSE_UNAVAILABLE = 'COURSE_UNAVAILABLE',
  NO_CLARITY = 'NO_CLARITY',
  INTERESTED = 'INTERESTED',
  DID_NOT_PICK = 'DID_NOT_PICK',
  INVALID = 'INVALID'
}


export enum FinalConversionType {
  NO_FOOTFALL = 'NO_FOOTFALL',
  UNCONFIRMED = 'UNCONFIRMED',
  CONVERTED = 'CONVERTED',
  DEAD = 'DEAD',
}


export enum Marketing_Source {
  SCHOOL = 'School',
  DIGITAL_MARKETING = 'Digital_Marketing'
}

/*
 * Admission Module Enums
*/
export enum Category {
  SC = "SC",
  ST = "ST",
  OBC = "OBC",
  GENERAL = "General",
  EWS = "EWS",
  OTHER = "Other"
};


export enum AdmissionReference {
  Advertising = "Advertising",
  BusinessAssociate = "Business Associate",
  DigitalMarketing = "Digital Marketing",
  DirectWalkIn = "Direct Walk-in",
  LUNPGExternalVenue = "LU/NPG/External Venue",
  StudentReference = "Student Reference",
  TechnoligenceStaffCalling = "Technoligence/Staff Calling",
  Other = "Other"
};

export enum DropDownType {
  MARKETING_CITY = "MARKETING_CITY",
  FIX_MARKETING_CITY = "FIX_MARKETING_CITY",
  DISTRICT = "DISTRICT",
  MARKETING_SOURCE = "MARKETING_SOURCE",
  MARKETING_COURSE_CODE = "MARKETING_COURSE_CODE",
  FIX_MARKETING_COURSE_CODE = "FIX_MARKETING_COURSE_CODE"
}

export enum PhysicalDocumentNoteStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  NOT_APPLICABLE = "NOT_APPLICABLE"
}

export enum Course {
  BCOM = "BCOM",
  BCOMH = "BCOMH",
  BAJMC = "BAJMC",
  BED = "BED",
  BSCM = "BSCM",
  BSCB = "BSCB",
  BBA = "BBA",
  BCA = "BCA",
  BVAA = "BVAA",
  BVAP = "BVAP",
  MAJMC = "MAJMC",
  MCOMC = "MCOMC",
  MBA = "MBA",
  LLB = "LLB",
  MCA = "MCA",
  MVAP = "MVAP",
  MSCC = "MSCC"
}


export enum EducationLevel {
  Tenth = "10th",
  Twelfth = "12th",
  Graduation = "Graduation",
  Others = "Others"
}


export enum FormNoPrefixes {
  "TIHS" = "TIHS",
  "TIMS" = "TIMS",
  "TCL" = "TCL",
  "PHOTO" = "PHOTO"
}


export enum Religion {
  HINDUISM = 'Hinduism',
  ISLAM = 'Islam',
  CHRISTIANITY = 'Christianity',
  SIKHISM = 'Sikhism',
  BUDDHISM = 'Buddhism',
  JAINISM = 'Jainism',
  OTHERS = 'Others',
}


export enum BloodGroup {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}


export enum AdmittedThrough {
  DIRECT = 'Direct',
  COUNSELLING = 'Counselling'
}


export enum DocumentType {
  TENTH_MARKSHEET = '10th_Marksheet',
  TENTH_CERTIFICATE = '10th_Certificate',
  TWELFTH_MARKSHEET = '12th_Marksheet',
  TWELFTH_CERTIFICATE = '12th_Certificate',
  GRADUATION_FINAL_YEAR_MARKSHEET = 'Graduation_Final_Year_Marksheet',
  CHARACTER_CERTIFICATE = 'Character_Certificate',
  TC_MIGRATION = 'TC_Migration',
  MEDICAL_CERTIFICATE = 'Medical_Certificate',
  ANTI_RAGGING_BY_STUDENT = 'Anti_Ragging_by_Student',
  ANTI_RAGGING_BY_PARENT = 'Anti_Ragging_by_Parent',
  ALLOTMENT_LETTER = 'Allotment_Letter',
  PHOTO = 'Photo',
  CASTE_CERTIFICATE = 'Caste_Certificate',
  INCOME_CERTIFICATE = 'Income_Certificate',
  NIVAS_CERTIFICATE = 'Nivas_Certificate',
  GAP_AFFIDAVIT = 'Gap_Affidavit',
  AADHAR = 'Aadhar',
  DECLARATION_FILLED = 'Declaration_Filled',
  PHYSICALLY_HANDICAPPED_CERTIFICATE = 'Physically_Handicapped_Certificate',
  EWS_CERTIFICATE = 'EWS_Certificate',
  SIGNATURE = 'Signature'
}


export enum ApplicationStatus {
  STEP_1 = 'Step_1',
  STEP_2 = 'Step_2',
  STEP_3 = 'Step_3',
  STEP_3_DRAFT = 'Step_3_Draft',
  STEP_4 = 'Step_4',
  CONFIRMED = 'Confirmed'
}


export enum ModuleNames {
  MARKETING = "MARKETING",
  ADMISSION = "ADMISSION",
  COURSE = "COURSE"
}


export enum Locations {
  KNP = "Kanpur",
  UNA = "Unnao",
  STP = "Sitapur",
  HRD = "Hardoi",
  BBK = "Barabanki",
  AMT = "Amethi",
  FTP = "Fatehpur",
  LKO = "Lucknow"
}


export enum FeeType {
  HOSTEL = "HOSTEL",
  TRANSPORT = "TRANSPORT",
  PROSPECTUS = "PROSPECTUS",
  STUDENTID = "STUDENTID",
  UNIFORM = "UNIFORM",
  STUDENTWELFARE = "STUDENTWELFARE",
  BOOKBANK = "BOOKBANK",
  EXAMFEES = "EXAMFEES"
}


export enum FeeStatus {
  FINAL = "FINAL",
  DRAFT = "DRAFT"
}


export enum AdmissionMode {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE"
}

export enum StatesOfIndia {
  ANDHRA_PRADESH = "Andhra Pradesh",
  ARUNACHAL_PRADESH = "Arunachal Pradesh",
  ASSAM = "Assam",
  BIHAR = "Bihar",
  CHHATTISGARH = "Chhattisgarh",
  GOA = "Goa",
  GUJARAT = "Gujarat",
  HARYANA = "Haryana",
  HIMACHAL_PRADESH = "Himachal Pradesh",
  JHARKHAND = "Jharkhand",
  KARNATAKA = "Karnataka",
  KERALA = "Kerala",
  MADHYA_PRADESH = "Madhya Pradesh",
  MAHARASHTRA = "Maharashtra",
  MANIPUR = "Manipur",
  MEGHALAYA = "Meghalaya",
  MIZORAM = "Mizoram",
  NAGALAND = "Nagaland",
  ODISHA = "Odisha",
  PUNJAB = "Punjab",
  RAJASTHAN = "Rajasthan",
  SIKKIM = "Sikkim",
  TAMIL_NADU = "Tamil Nadu",
  TELANGANA = "Telangana",
  TRIPURA = "Tripura",
  UTTAR_PRADESH = "Uttar Pradesh",
  UTTARAKHAND = "Uttarakhand",
  WEST_BENGAL = "West Bengal",
  ANDAMAN_AND_NICOBAR_ISLANDS = "Andaman and Nicobar Islands",
  CHANDIGARH = "Chandigarh",
  DADRA_AND_NAGAR_HAVELI_AND_DAMAN_AND_DIU = "Dadra and Nagar Haveli and Daman and Diu",
  DELHI = "Delhi",
  JAMMU_AND_KASHMIR = "Jammu and Kashmir",
  LADAKH = "Ladakh",
  LAKSHADWEEP = "Lakshadweep",
  PUDUCHERRY = "Puducherry"
}


export enum Countries {
  India = "India",
  NON_INDIA = "Non-India"
}

// export enum Districts {
//   Lucknow = "Lucknow",
//   Sitapur = "Sitapur",
//   Hardoi = "Hardoi",
//   Barabanki = "Barabanki",
//   Raebareli = "Raebareli",
//   Unnao = "Unnao",
// }

export enum AreaType {
  URBAN = "URBAN",
  RURAL = "RURAL",
  OTHERS = "OTHERS"
}


export const ADMISSION = 'admissions'

export const TGI = "TGI";
export const PHOTO = "PHOTO";

// export const MARKETING_SHEET = 'Marketing Sheet'


export enum COLLECTION_NAMES {
  USER = 'User',
  VERIFY_OTP = 'VerifyOtp',
  ENQUIRY = 'Enquiry',
  ENQUIRY_DRAFT = 'EnquiryDraft',
  ENQUIRY_ID_META_DATA = 'EnquiryIdMetaData',
  STUDENT_FEE = 'studentFee',
  STUDENT_FEE_DRAFT = 'studentFeeDraft',
  DEPARTMENT_COURSE = 'deptandcourse',
  LEAD = 'Lead',
  SPREADSHEET_META_DATA = 'spreadSheetMetaData',
  YELLOW_LEAD = 'YellowLead',
  COURSE_OTHER_FEES = 'CourseAndOtherFees',
  STUDENT = 'Student',
  DEPARTMENT_META_DATA = 'DepartmentMetaData',
  COURSE_METADATA = 'CourseMetadata',
  COURSE = 'Course',
  DROP_DOWN_META_DATA = 'DropDownMetaData',
  STUDENTREPO = "StudentRepo",
  TRANSACTION_HISTORY = "TransactionHistory"
}


export enum LectureConfirmation {
  CONFIRMED = 'CONFIRMED',
  DELAYED = 'DELAYED',
  TO_BE_DONE = 'TO_BE_DONE'
}

export enum RequestAction {
  PUT = "PUT",
  POST = "POST",
  DELETE = "DELETE",
  PATCH = "PATCH",
}

export enum CourseMaterialType {
  LPLAN = 'LPlan',
  PPLAN = 'PPlan',
  GENERAL = 'General'
}


export enum CourseYears{
  First = 'First',
  Second = 'Second',
  Third = 'Third',
  Fourth = 'Fourth',
  Fifth = 'Fifth',
  Sixth = 'Sixth'
}

export enum FeeStatus{
  DUE = "DUE",
  PAID = "PAID",
  NOT_PROVIDED = "NOT_PROVIDED"
}

export enum Schedule{
  ONE_TIME = "ONE_TIME",
  SEMESTER = "SEMESTER",
  YEARLY = "YEARLY",
  OPTIONAL = "OPTIONAL",
  AS_APPLICABLE = "AS_APPLICABLE"
}

export enum FeeActions{
  REFUND = "REFUND",
  DEPOSIT = "DEPOSIT"
}

export enum TransactionTypes{
  NEFT_IMPS_RTGS = "NEFT/RTGS/IMPS",
  UPI = "UPI",
  CASH = "CASH",
  CHEQUE = "CHEQUE",
  OTHERS = "OTHERS"
}


export enum FinanceFeeType {
  HOSTEL = "HOSTEL",    //OPTIONAL
  TRANSPORT = "TRANSPORT",  //OPTIONAL
  PROSPECTUS = "PROSPECTUS",  //ONE-TIME
  STUDENTID = "STUDENTID",  //ONE-TIME
  UNIFORM = "UNIFORM",    //ONE-TIME
  STUDENTWELFARE = "STUDENTWELFARE",  //YEARLY
  BOOKBANK = "BOOKBANK",  //SEMESTERWISE
  EXAMFEES = "EXAMFEES",  
  MISCELLANEOUS = "MISCELLANEOUS", //OTHERS
  SEMESTERFEE = "SEMESTERFEE"
}


export enum FinanceFeeSchedule {
  HOSTEL = "YEARLY",
  TRANSPORT = "YEARLY",
  PROSPECTUS = "ONETIME",
  STUDENTID = "ONETIME",
  UNIFORM = "ONETIME",
  STUDENTWELFARE = "YEARLY",
  BOOKBANK = "HALF_YEARLY",
  EXAMFEES = "HALF_YEARLY",
  MISCELLANEOUS = "HALF_YEARLY",
  SEMESTERFEE = "HALF_YEARLY",
}
