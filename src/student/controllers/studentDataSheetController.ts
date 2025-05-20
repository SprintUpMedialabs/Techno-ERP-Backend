import expressAsyncHandler from "express-async-handler";
import moment from "moment";
import { User } from "../../auth/models/user";
import { AuthenticatedRequest } from "../../auth/validators/authenticatedRequest";
import { EducationLevel, StudentStatus } from "../../config/constants";
import { convertToDDMMYYYY } from "../../utils/convertDateToFormatedDate";
import { Response } from "express";
import ExcelJS from 'exceljs';
import { Student } from "../models/student";
import { Enquiry } from "../../admission/models/enquiry";
import { IAddressSchema } from "../../validators/commonSchema";
import { IStudentSchema } from "../validators/studentSchema";
import { IAcademicDetailSchema } from "../../admission/validators/academicDetailSchema";
import { IPhysicalDocumentNoteSchema } from "../../admission/validators/physicalDocumentNoteSchema";
import { ObjectId } from "mongoose";
import { ISingleDocumentSchema } from "../../admission/validators/singleDocumentSchema";
import { sendEmail } from "../../config/mailer";
import { DEVELOPER_EMAIL } from "../../secrets";
import { formatResponse } from "../../utils/formatResponse";

const generateAddress = (address: IAddressSchema) => {
    const addressLine1 = address.addressLine1 ?? '';
    const addressLine2 = address.addressLine2 ?? '';
    return addressLine2 ? ((addressLine1 ? addressLine1 + ", " : '') + addressLine2) : (addressLine1 ?? '')
}

const getCollegeInformation = (academicDetails: IAcademicDetailSchema[]) => {
    let collegeDetails: IAcademicDetailSchema = {
        educationLevel: EducationLevel.Tenth,
        schoolCollegeName: "",
        universityBoardName: "",
        passingYear: 0,
        percentageObtained: 0
    };
    if (academicDetails.length == 0)
        return collegeDetails;

    academicDetails.forEach(academicDetail => {
        if (academicDetail.educationLevel === EducationLevel.Graduation) {
            collegeDetails = academicDetail;
        }
    });

    return collegeDetails;
}

const getPhysicalDocumentNote = (label: string,physicalDocumentNote: IPhysicalDocumentNoteSchema[]) => {
    const note = physicalDocumentNote?.find(p =>
        p.type?.toLowerCase().includes(label.toLowerCase())
    );

    if (!note) 
        return '';

    if (note.status === 'PENDING') {
        return note.dueBy ? `${note.status} | ${convertToDDMMYYYY(note.dueBy)}` : note.status;
      }

    return note.status || convertToDDMMYYYY(note.dueBy) || '';
};


const getDocument = (label: string, documents: ISingleDocumentSchema[]) => {
    const note = documents?.find(p =>
        p.type?.toLowerCase().includes(label.toLowerCase())
    );
    return note ? (note.fileUrl ? note.fileUrl : convertToDDMMYYYY(note.dueBy)) : '';
};

const getStudentState = (createdAt: Date, updatedAt: Date): string => {
    const today = moment();

    if (moment(createdAt).isSame(today, 'day')) {
        return StudentStatus.NEW;
    } else if (moment(updatedAt).isSame(today, 'day')) {
        return StudentStatus.UPDATED;
    } else {
        return StudentStatus.OLD;
    }
};


const mapStudentToRow = async (student: IStudentSchema & { _id: ObjectId, createdAt: Date, updatedAt: Date }, index: number): Promise<Record<string, any>> => {
    const info = student.studentInfo;

    const enquiry = await Enquiry.findById(student._id);

    const academicDetails = info.academicDetails;
    const collegeDetails = getCollegeInformation(academicDetails ? academicDetails : []);
    const physicalDocumentNote = info.physicalDocumentNote;
    const documents = info.documents;

    return {
        "S. No.": index + 1,
        "Student Status": getStudentState(student.createdAt, student.updatedAt),
        "Photo No.": info.photoNo ?? '',
        "Course": student.courseName ?? '',
        "LURN/PRE-REGISTRATION NO.": info.lurnRegistrationNo ?? '',
        "Form No.": info.formNo ?? '',
        "Date of Admission": (enquiry?.dateOfAdmission) ? convertToDDMMYYYY(enquiry?.dateOfAdmission!) : '',
        "Name of Student": info.studentName ?? '',
        "Father's Name": info.fatherName ?? '',
        "Mother's Name": info.motherName ?? '',
        "Permanent Address": generateAddress(info.address),
        "District": info.address?.district ?? '',
        "Pincode": info.address?.pincode ?? '',
        "State": info.address?.state ?? '',
        "Country": info.nationality ?? '',
        "Aadhaar Number": info.aadharNumber ?? '',
        "Date of Birth": info.dateOfBirth ? convertToDDMMYYYY(info.dateOfBirth) : '',
        "Contact / WhatsApp No. (Student)": info.studentPhoneNumber ?? '',
        "Contact No. (Parents)": info.fatherPhoneNumber ?? '',
        "Email": info.emailId ?? '',
        "Gender": info.gender ?? '',
        "Religion": info.religion ?? '',
        "Category": info.category ?? '',
        "Blood Group": info.bloodGroup ?? '',
        "Admitted Through": info.admittedThrough ?? '',
        "College Name": collegeDetails.schoolCollegeName,
        "Board / University": collegeDetails.universityBoardName ?? '',
        "Year of Passing": collegeDetails.passingYear ?? '',
        "Aggregate Percentage": collegeDetails.percentageObtained ?? '',
        "10th Marksheet": getPhysicalDocumentNote("10th Marksheet", physicalDocumentNote ?? []),
        "12th Marksheet": getPhysicalDocumentNote("12th Marksheet", physicalDocumentNote ?? []),
        "Graduation Final Year Marksheet": getPhysicalDocumentNote("Graduation Final Year Marksheet", physicalDocumentNote ?? []),
        "T.C./Migration": getPhysicalDocumentNote("T.C. / Migration", physicalDocumentNote ?? []),
        "Photo": getDocument("Photo", documents ?? []),
        "Caste": getPhysicalDocumentNote("Caste Certificate (If Applicable)", physicalDocumentNote ?? []),
        "Gap Affidavit": getPhysicalDocumentNote("Gap Affidavit (If Applicable)", physicalDocumentNote ?? []),
        "Signature": getDocument("Signature", documents ?? []),
        "Ref": info.reference ?? '',
        "Remarks": ""
    };
};


export const exportStudentData = expressAsyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    console.log("In student export data");
    const user = await User.findById(req.data?.id);
    console.log("Logged in user is : ", user);
    const students = await Student.find({}) as (IStudentSchema & { _id: ObjectId, createdAt: Date, updatedAt: Date })[];

    console.log("Students are : ", students);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Students");

    const firstRow = await mapStudentToRow(students[0], 0);
    worksheet.columns = Object.keys(firstRow).map(key => ({ header: key, key }));

    for (let i = 0; i < students.length; i++) {
        const row = await mapStudentToRow(students[i], i);
        worksheet.addRow(row);
    }

    worksheet.columns.forEach(col => {
        let maxLength = 15;
        col.eachCell?.({ includeEmpty: true }, cell => {
            const cellValue = cell.text || '';
            maxLength = Math.max(maxLength, cellValue.length);
        });
        col.width = maxLength + 2;
    });

    const formattedDate = moment().tz("Asia/Kolkata").format("DD-MM-YY");

    // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    // res.setHeader('Content-Disposition', `attachment; filename="${user?.firstName ?? ''} ${user?.lastName ?? ''} - ${formattedDate}.xlsx"`);

    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    await sendEmail(
        DEVELOPER_EMAIL,
        "Student Data Backup",
        `<p>Please find the attached student data exported on ${formattedDate}.</p>`,
        [{
            filename: `${user?.firstName ?? ''} ${user?.lastName ?? ''} - ${formattedDate}.xlsx`,
            content: buffer
        }]
    );

    return formatResponse(res, 200, "Student data sent on your email", true, null);
});
