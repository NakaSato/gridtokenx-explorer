// Export service for blockchain data in multiple formats

export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx' | 'pdf';
  filename?: string;
  includeHeaders?: boolean;
  dateFormat?: 'iso' | 'local' | 'timestamp';
  filter?: {
    dateRange?: {
      start?: Date;
      end?: Date;
    };
    fields?: string[];
  };
}

export interface ExportData {
  [key: string]: any;
}

export class ExportService {
  private static readonly DEFAULT_OPTIONS: Partial<ExportOptions> = {
    includeHeaders: true,
    dateFormat: 'iso',
  };

  // Main export method
  static async export(data: ExportData[], options: ExportOptions): Promise<void> {
    const mergedOptions = { ...this.DEFAULT_OPTIONS, ...options };

    // Apply filters
    const filteredData = this.applyFilters(data, mergedOptions);

    // Format data
    const formattedData = this.formatData(filteredData, mergedOptions);

    // Generate file
    const blob = await this.generateFile(formattedData, mergedOptions);

    // Download file
    this.downloadFile(blob, mergedOptions);
  }

  // Export to CSV
  static async exportToCSV(data: ExportData[], options: Partial<ExportOptions> = {}): Promise<void> {
    await this.export(data, { ...options, format: 'csv' });
  }

  // Export to JSON
  static async exportToJSON(data: ExportData[], options: Partial<ExportOptions> = {}): Promise<void> {
    await this.export(data, { ...options, format: 'json' });
  }

  // Export to Excel
  static async exportToXLSX(data: ExportData[], options: Partial<ExportOptions> = {}): Promise<void> {
    await this.export(data, { ...options, format: 'xlsx' });
  }

  // Export to PDF
  static async exportToPDF(data: ExportData[], options: Partial<ExportOptions> = {}): Promise<void> {
    await this.export(data, { ...options, format: 'pdf' });
  }

  // Apply filters to data
  private static applyFilters(data: ExportData[], options: ExportOptions): ExportData[] {
    let filteredData = [...data];

    // Date range filter
    if (options.filter?.dateRange) {
      filteredData = filteredData.filter(item => {
        const itemDate = new Date(item.timestamp || item.date);
        const { start, end } = options.filter!.dateRange!;

        if (start && itemDate < start) return false;
        if (end && itemDate > end) return false;

        return true;
      });
    }

    // Field filter
    if (options.filter?.fields) {
      filteredData = filteredData.map(item => {
        const filtered: ExportData = {};
        options.filter!.fields!.forEach(field => {
          if (field in item) {
            filtered[field] = item[field];
          }
        });
        return filtered;
      });
    }

    return filteredData;
  }

  // Format data based on options
  private static formatData(data: ExportData[], options: ExportOptions): any[] {
    return data.map(item => {
      const formatted: any = {};

      Object.keys(item).forEach(key => {
        let value = item[key];

        // Format dates
        if (value instanceof Date || this.isDateField(key)) {
          value = this.formatDate(value as Date, options.dateFormat || 'iso');
        }

        // Format numbers
        else if (typeof value === 'number') {
          value = this.formatNumber(value);
        }

        // Format BigInt
        else if (typeof value === 'bigint') {
          value = this.formatBigInt(value);
        }

        formatted[key] = value;
      });

      return formatted;
    });
  }

  // Check if field is a date field
  private static isDateField(fieldName: string): boolean {
    const dateFields = ['timestamp', 'date', 'createdAt', 'updatedAt', 'blockTime', 'lockout'];
    return dateFields.some(field => fieldName.toLowerCase().includes(field));
  }

  // Format date based on options
  private static formatDate(date: Date, format: string): string {
    switch (format) {
      case 'iso':
        return date.toISOString();
      case 'local':
        return date.toLocaleString();
      case 'timestamp':
        return date.getTime().toString();
      default:
        return date.toISOString();
    }
  }

  // Format number for display
  private static formatNumber(value: number): string {
    return value.toLocaleString();
  }

  // Format BigInt for display
  private static formatBigInt(value: bigint): string {
    const sol = Number(value) / 1e9;
    return `${sol.toFixed(9)} SOL (${value.toString()} lamports)`;
  }

  // Generate file based on format
  private static async generateFile(data: any[], options: ExportOptions): Promise<Blob> {
    switch (options.format) {
      case 'csv':
        return this.generateCSV(data, options);
      case 'json':
        return this.generateJSON(data, options);
      case 'xlsx':
        return this.generateXLSX(data, options);
      case 'pdf':
        return this.generatePDF(data, options);
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  // Generate CSV file
  private static generateCSV(data: any[], options: ExportOptions): Blob {
    if (data.length === 0) {
      return new Blob(['No data available'], { type: 'text/csv' });
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      // Headers
      options.includeHeaders ? headers.join(',') : '',
      // Data rows
      ...data.map(row =>
        headers
          .map(header => {
            const value = row[header];
            return this.escapeCSVValue(value);
          })
          .join(','),
      ),
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  }

  // Generate JSON file
  private static generateJSON(data: any[], options: ExportOptions): Blob {
    const jsonContent = JSON.stringify(data, null, 2);
    return new Blob([jsonContent], { type: 'application/json' });
  }

  // Generate XLSX file
  private static generateXLSX(data: any[], options: ExportOptions): Blob {
    // Simple XLSX generation (in production, use a library like xlsx)
    const headers = Object.keys(data[0]);
    const xlsxContent = [
      headers.join('\t'),
      ...data.map(row =>
        headers
          .map(header => {
            const value = row[header];
            return this.escapeXLSXValue(value);
          })
          .join('\t'),
      ),
    ].join('\n');

    return new Blob([xlsxContent], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  // Generate PDF file
  private static generatePDF(data: any[], options: ExportOptions): Blob {
    // Simple PDF generation (in production, use a library like jsPDF)
    const headers = Object.keys(data[0]);
    let pdfContent = '%PDF-1.1\n';
    pdfContent += '1 0 obj\n';
    pdfContent += '<< /Type /Catalog /Pages 2 0 R\n';
    pdfContent += '>> endobj\n';
    pdfContent += '2 0 obj\n';
    pdfContent +=
      '<< /Type /Page /Parent 1 0 /Resources << /Font << /F1 3 0 obj << /Type /Font /Subtype /TrueType /Name /Arial /BaseFont /Helvetica /Encoding /WinAnsiEncoding >> >> >> /MediaBox [0 0 612 792] /Contents 3 0 R >> endobj\n';
    pdfContent += '3 0 obj\n';
    pdfContent += '<< /Length ' + (data.length * 100 + 1000) + ' >> stream\n';
    pdfContent += 'BT /F1 12 Tf\n';
    pdfContent += '72 720 TD\n';
    pdfContent += '(Exported Data) Tj\n';

    data.forEach((row, index) => {
      const y = 720 - (index + 1) * 20;
      pdfContent += `0 -${y} Td\n`;
      pdfContent += '(' + Object.values(row).join(' | ') + ') Tj\n';
    });

    pdfContent += 'ET endstream endobj\n';
    pdfContent +=
      'xref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000029 00000 n\n0000000034 00000 n\ntrailer << /Size 4 /Root 3 0 R >>';

    return new Blob([pdfContent], { type: 'application/pdf' });
  }

  // Escape CSV values
  private static escapeCSVValue(value: any): string {
    if (value === null || value === undefined) return '';

    const stringValue = String(value);

    // If value contains comma, newline, or quotes, wrap in quotes
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return '"' + stringValue.replace(/"/g, '""') + '"';
    }

    return stringValue;
  }

  // Escape XLSX values
  private static escapeXLSXValue(value: any): string {
    if (value === null || value === undefined) return '';

    const stringValue = String(value);

    // Replace tab characters and newlines
    return stringValue.replace(/\t/g, ' ').replace(/\n/g, '\\n');
  }

  // Download file to user's device
  private static downloadFile(blob: Blob, options: ExportOptions): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = options.filename || this.generateFilename(options.format);

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Generate filename
  private static generateFilename(format: string): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    const prefix = 'blockchain-data';

    switch (format) {
      case 'csv':
        return `${prefix}-${timestamp}.csv`;
      case 'json':
        return `${prefix}-${timestamp}.json`;
      case 'xlsx':
        return `${prefix}-${timestamp}.xlsx`;
      case 'pdf':
        return `${prefix}-${timestamp}.pdf`;
      default:
        return `${prefix}-${timestamp}.txt`;
    }
  }
}

// React hooks for export functionality
export function useExport() {
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportProgress, setExportProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  const exportData = React.useCallback(async (data: any[], options: ExportOptions) => {
    setIsExporting(true);
    setExportProgress(0);
    setError(null);

    try {
      await ExportService.export(data, options);
      setExportProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportProgress(0), 2000);
    }
  }, []);

  return {
    exportData,
    isExporting,
    exportProgress,
    error,
  };
}

// Specific export functions for common use cases
export const exportTransactions = (transactions: any[], options?: Partial<ExportOptions>) => {
  return ExportService.exportToCSV(transactions, {
    filename: 'transactions',
    ...options,
  });
};

export const exportAccounts = (accounts: any[], options?: Partial<ExportOptions>) => {
  return ExportService.exportToJSON(accounts, {
    filename: 'accounts',
    ...options,
  });
};

export const exportBlocks = (blocks: any[], options?: Partial<ExportOptions>) => {
  return ExportService.exportToXLSX(blocks, {
    filename: 'blocks',
    ...options,
  });
};

export const exportAnalytics = (data: any[], options?: Partial<ExportOptions>) => {
  return ExportService.exportToPDF(data, {
    filename: 'analytics-report',
    ...options,
  });
};
