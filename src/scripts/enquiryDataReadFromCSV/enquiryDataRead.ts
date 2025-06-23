import { EnquiryDraft } from "../../admission/models/enquiryDraft";
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { AdmissionMode, AdmissionReference, Category, Countries, Gender } from "../../config/constants";
import moment from "moment-timezone";
import { Request, Response } from "express";


export const enquiryDataRead = async (req: Request, res: Response) => {
    const course = [
        "BCOM",
        "BCOMH",
        "BED",
        "BSCM",
        "BSCB",
        "BAJMC",
        "BBA",
        "BCA",
        "LLB",
        "MCOMC",
        "MAJMC",
        "MBA",
        "MCA",
        "BVAA",
        "BVAP",
        "MVAP"
    ];
    const results: any[] = [];
    const errors: any[] = [];
    fs.createReadStream(path.resolve(__dirname, "enquiry.csv"))
        .pipe(csv())
        .on('data', (row) => {
            const enquiry = {
                admissionMode: row['Admission Mode']?.toUpperCase(),
                dateOfEnquiry: convertToMongoDate1(row['Date of Enquiry']),
                course: row['Course'],
                studentName: row["Student Name"],
                studentPhoneNumber: row["Student's Phone Number"],
                fatherName: row["Father's Name"],
                fatherPhoneNumber: row["Father's Phone Number"],
                category: row["Category"]?.toUpperCase(),
                gender: row["Gender"]?.toUpperCase(),
                address: {
                    addressLine1: row["Address Line 1"],
                    district: row["District"],
                    state: row["State"],
                    country: row["Country"] || Countries.India
                },
                references: row["References"]?.split(',').map((r: string) => r.trim()),
                enquiryRemark: row["Enquiry Remark"]
            };

            enquiry.admissionMode = Object.values(AdmissionMode).includes(enquiry.admissionMode) ? enquiry.admissionMode : AdmissionMode.OFFLINE;
            enquiry.category = Object.values(Category).includes(enquiry.category) ? enquiry.category : Category.OTHER;
            enquiry.gender = Object.values(Gender).includes(enquiry.gender) ? enquiry.gender : Gender.OTHER;
            const references = [];
            for (let reference of enquiry.references) {
                if (reference == "Direct Walk-In") {
                    reference = "Direct Walk-in"
                } else if (reference == "LU/NPG/External") {
                    reference = "LU/NPG/External Venue"
                }
                if (Object.values(AdmissionReference).includes(reference)) {
                    references.push(reference);
                }
            }
            enquiry.references = references;
            if ((references.length === 0) || (!enquiry.course || !course.includes(enquiry.course))) {
                errors.push(enquiry);
            } else {
                results.push(enquiry);
            }
        })
        .on('end', async () => {
            try {
                res.send({ results, errors });
                await EnquiryDraft.insertMany(results);
                console.log('CSV upload successful!');
            } catch (error:any) {
                console.error('Error uploading data:', error);
                res.send({ error: error.message });
            }
        });
}

const convertToMongoDate1 = (dateString?: string | Date): Date | null => {
    if (!dateString || dateString === "") {
        return null;
    }
    const istZone = 'Asia/Kolkata';
    if (dateString instanceof Date) {
        // Interpret this date in IST and set time to start of day
        return moment.tz(dateString, istZone).startOf('day').toDate();
    }

    // Parse the string assuming it's in 'DD/MM/YYYY' format in IST
    const date = moment.tz(dateString, 'DD-MMM-YY', istZone);

    return date.startOf('day').toDate();
};