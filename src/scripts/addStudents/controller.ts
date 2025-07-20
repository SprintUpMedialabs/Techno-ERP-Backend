import { Request, Response } from "express";
import ExcelJS from "exceljs";
import path from "path";
export const uploadExcel = async (req: Request, res: Response) => {
  try {

    const workbook = new ExcelJS.Workbook();
    const filePath = path.join(__dirname, "studentDetails.xlsx");
    await workbook.xlsx.readFile(filePath);
    console.log("Excel file read successfully:", filePath);

    const allSheetData: Record<string, unknown[]> = {};

    console.log("Processing sheets in the workbook...", workbook.worksheets.length, "sheets found.");
    workbook.eachSheet((worksheet) => {
      console.log(`Processing sheet: ${worksheet.name}`);
      const sheetData: any[] = [];
      const headers: string[] = [];

      worksheet.eachRow((row, rowIndex) => {
        const values = row.values as any[];

        if (rowIndex === 1) {
          values.forEach((val, i) => {
            if (i > 0) headers.push(val ?? `Column${i}`);
          });
        } else {
          const rowObj: Record<string, any> = {};
          values.forEach((val, i) => {
            if (i > 0) rowObj[headers[i - 1]] = val;
          });
          sheetData.push(rowObj);
        }
      });

      allSheetData[worksheet.name] = sheetData;
      console.log(`Sheet: ${worksheet.name}, Rows: ${sheetData.length}`);
      console.log("Headers are:", headers, "First Row Data:", sheetData[0]);
    });

    res.status(200).json({
      message: "Excel file processed successfully",
      data: allSheetData,
    });

    
  } catch (err: any) {
    console.error("❌ Excel Parse Error:", err.message);
    res.status(500).json({ message: "Error parsing Excel", error: err.message });
  }
};