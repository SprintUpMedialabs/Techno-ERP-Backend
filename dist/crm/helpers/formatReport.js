"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatReport = void 0;
const formatReport = (report) => {
    return `
      <h2>Lead Processing Report</h2>
      <p><strong>Total Rows Processed:</strong> ${report.rowsToBeProcessed}</p>
      <p><strong>Successfully Processed:</strong> ${report.actullyProcessedRows}</p>
      <p><strong>Rows Failed:</strong> ${report.rowsFailed}</p>
      
      ${report.duplicateRowIds.length > 0
        ? `
        <h3>Duplicate Rows</h3>
        <ul>${report.duplicateRowIds.map((id) => `<li>Row ID: ${id}</li>`).join('')}</ul>
      `
        : ''}
  
      ${report.assignedToNotFound.length > 0
        ? `
        <h3>Rows with Missing Assigned Users</h3>
        <ul>${report.assignedToNotFound.map((id) => `<li>Row ID: ${id}</li>`).join('')}</ul>
      `
        : ''}
  
      ${report.emptyRows.length > 0
        ? `
        <h3>Empty Rows</h3>
        <ul>${report.emptyRows.map((id) => `<li>Row ID: ${id}</li>`).join('')}</ul>
      `
        : ''}
  
      ${report.otherIssue.length > 0
        ? `
        <h3>Other Issues</h3>
        <table border="1" cellpadding="5" cellspacing="0">
          <tr>
            <th>Row ID</th>
            <th>Issue</th>
          </tr>
          ${report.otherIssue
            .map((issue) => `
            <tr>
              <td>${issue.rowId}</td>
              <td>${issue.issue}</td>
            </tr>
          `)
            .join('')}
        </table>
      `
        : ''}
    `;
};
exports.formatReport = formatReport;
