import { Request, Response } from "express";
import expressAsyncHandler from "express-async-handler";
import { Student } from "../../student/models/student";
import { formatResponse } from "../../utils/formatResponse";

export const bookBankModifyFee = expressAsyncHandler(async (req: Request, res: Response) => {
  try {
    const students = await Student.find({});
    
    await Promise.all(students.map(async (student) => {
      const totalSemesters = student.semester.length;
      
      student.semester.forEach((semester) => {
        const bookBankFee = semester.fees.details.find(detail => detail.type === "BOOKBANK");
        
        if (bookBankFee) {
          if (semester.semesterNumber === 1) {
            return;
          } else if (semester.semesterNumber === totalSemesters) {
            bookBankFee.actualFee = 0;
            bookBankFee.finalFee = 0;
          } else {
            bookBankFee.actualFee = bookBankFee.actualFee / 2;
            bookBankFee.finalFee = bookBankFee.finalFee / 2;
          }
        }
      });
      
      await student.save();
    }));
    
    return formatResponse(res, 200, "Book bank fee modified successfully", true);
  } catch (error) {
    console.error("Error modifying book bank fees:", error);
    return formatResponse(res, 500, "Internal server error", false);
  }
});