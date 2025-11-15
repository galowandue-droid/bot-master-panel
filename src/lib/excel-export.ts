/**
 * Utility functions for exporting data to Excel/CSV
 */

export function exportToCSV(data: any[], filename: string, columns?: string[]) {
  if (!data || data.length === 0) {
    console.error("No data to export");
    return;
  }

  // Get column headers
  const headers = columns || Object.keys(data[0]);

  // Create CSV content
  const csvRows = [
    headers.join(","), // Header row
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        // Handle values that contain commas or quotes
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? "";
      }).join(",")
    ),
  ];

  const csvContent = csvRows.join("\n");

  // Create blob and download
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  format?: (value: any) => string;
}

export function exportToExcel(data: any[], filename: string, columns: ExcelColumn[]) {
  // For now, export as CSV (can be enhanced with a library like xlsx)
  const formattedData = data.map((row) => {
    const formatted: any = {};
    columns.forEach((col) => {
      const value = row[col.key];
      formatted[col.header] = col.format ? col.format(value) : value;
    });
    return formatted;
  });

  exportToCSV(formattedData, filename);
}
