export interface IMarketingSpreadsheetProcessReport {
    rowsToBeProcessed: number;
    actullyProcessedRows: number;
    rowsFailed: number;
    duplicateRowIds: number[];
    assignedToNotFound: number[];
    otherIssue: { rowId: number; issue: string }[];
    emptyRows: number[];
}
