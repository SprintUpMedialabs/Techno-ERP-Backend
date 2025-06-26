import { IMarketingSpreadsheetProcessReport } from "../types/marketingSpreadsheet";

export const formatReport = (report: IMarketingSpreadsheetProcessReport): string => {
  // Helper function to create a consistent error table
  const createErrorTable = (title: string, count: number, errors: {rowNumber: number, phoneNumber?: string, name?: string, issue?: string}[]) => {
    if (errors.length === 0) return '';
    
    // Special case for phoneNumberAndNameEmpty - display as simple list
    if (title.includes('Empty Phone Number and Name')) {
      return `
        <h3 style="color: #2c3e50; margin-top: 20px;">${title} (${count})</h3>
        <div style="padding: 8px; background-color: #f8f9fa; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 20px;">
          ${errors.map(e => e.rowNumber).join(', ')}
        </div>
      `;
    }
    
    return `
      <h3 style="color: #2c3e50; margin-top: 20px;">${title} (${count})</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #ddd;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Row Number</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Phone Number</th>
            <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Name</th>
            ${title.includes('Other Issues') ? '<th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Issue</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${errors.map(error => `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">${error.rowNumber}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${error.phoneNumber || '-'}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${error.name || '-'}</td>
              ${title.includes('Other Issues') ? `<td style="padding: 8px; border: 1px solid #ddd;">${error.issue || '-'}</td>` : ''}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  };

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 8px;">Lead Processing Report</h2>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold; width: 60%;">Total Rows Processed:</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${report.rowsToBeProcessed}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Successfully Processed:</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #27ae60;">${report.actullyProcessedRows}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Rows Failed:</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #e74c3c;">${report.rowsFailed}</td>
        </tr>
      </table>
      
      ${createErrorTable('Duplicate Rows', report.duplicateRowIds.length, report.duplicateRowIds)}
      ${createErrorTable('Rows with Missing Assigned Users', report.assignedToNotFound.length, report.assignedToNotFound)}
      ${createErrorTable('Empty Rows', report.emptyRows.length, report.emptyRows)}
      ${createErrorTable('Rows with Empty Phone Number and Name', report.phoneNumberAndNameEmpty.length, report.phoneNumberAndNameEmpty)}
      ${createErrorTable('Rows with Unauthorized Assigned Users', report.unauthorizedAssignedTo.length, report.unauthorizedAssignedTo)}
      ${createErrorTable('Rows with Invalid Phone Numbers', report.invalidPhoneNumber.length, report.invalidPhoneNumber)}
      ${createErrorTable('Other Issues', report.otherIssue.length, report.otherIssue)}
    </div>
  `;
};