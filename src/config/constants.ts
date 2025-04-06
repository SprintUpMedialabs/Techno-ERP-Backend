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
  OTHER = 'OTHERS',
  NOT_TO_MENTION = 'NOT_TO_MENTION'
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
  ADMISSION = 'ADMISSION',
  DID_NOT_PICK = 'DID_NOT_PICK'
}


export enum FinalConversionType {
  PENDING = 'PENDING',
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
  EWS_CERTIFICATE = 'EWS_Certificate'
}


export enum ApplicationStatus {
  STEP_1 = 'Step_1',
  STEP_2 = 'Step_2',
  STEP_3 = 'Step_3',
  STEP_4 = 'Step_4'
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
  EXAMFEES = "EXAMFEES",
  SEM1FEE = "SEM1FEE"
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
  AndhraPradesh = "Andhra Pradesh",
  ArunachalPradesh = "Arunachal Pradesh",
  Assam = "Assam",
  Bihar = "Bihar",
  Chhattisgarh = "Chhattisgarh",
  Goa = "Goa",
  Gujarat = "Gujarat",
  Haryana = "Haryana",
  HimachalPradesh = "Himachal Pradesh",
  Jharkhand = "Jharkhand",
  Karnataka = "Karnataka",
  Kerala = "Kerala",
  MadhyaPradesh = "Madhya Pradesh",
  Maharashtra = "Maharashtra",
  Manipur = "Manipur",
  Meghalaya = "Meghalaya",
  Mizoram = "Mizoram",
  Nagaland = "Nagaland",
  Odisha = "Odisha",
  Punjab = "Punjab",
  Rajasthan = "Rajasthan",
  Sikkim = "Sikkim",
  TamilNadu = "Tamil Nadu",
  Telangana = "Telangana",
  Tripura = "Tripura",
  UttarPradesh = "Uttar Pradesh",
  Uttarakhand = "Uttarakhand",
  WestBengal = "West Bengal",
}

export enum Countries {
  India = "India",
  Pakistan = "Pakistan",
  China = "China",
  Nepal = "Nepal",
  Bhutan = "Bhutan",
  Bangladesh = "Bangladesh",
  Myanmar = "Myanmar",
  SriLanka = "Sri Lanka",
  Afghanistan = "Afghanistan",
  Maldives = "Maldives",
  Thailand = "Thailand",
}

export enum Districts {
  Lucknow = "Lucknow",
  Sitapur = "Sitapur",
  Hardoi = "Hardoi",
  Barabanki = "Barabanki",
  Raebareli = "Raebareli",
  Unnao = "Unnao",
}

export enum AreaType{
  URBAN = "URBAN",
  RURAL = "RURAL",
  OTHERS = "OTHERS"
}


export const ADMISSION = 'admissions'

export const TGI = "TGI";
export const PHOTO = "PHOTO";

export const MARKETING_SHEET = 'Marketing Sheet'


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
  STUDENT = 'Student'
}