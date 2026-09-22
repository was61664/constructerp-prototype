import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number;
}

/**
 * CSV export. Replaces the "Export Report" buttons that previously did nothing.
 *
 * CSV rather than PDF on purpose: it is what the numbers are actually for.
 * Whoever asks for an equipment utilization report wants it in Excel to pivot,
 * not as a picture of a table. PDF reporting belongs with the real reporting
 * backend (PROJECT_GUIDE.md §6.11).
 */
@Injectable({ providedIn: 'root' })
export class ExportService {
  private readonly document = inject(DOCUMENT);

  exportCsv<T>(filename: string, columns: readonly CsvColumn<T>[], rows: readonly T[]): void {
    const header = columns.map((column) => this.escape(column.header)).join(',');
    const body = rows.map((row) =>
      columns.map((column) => this.escape(String(column.value(row)))).join(','),
    );

    // The UTF-8 BOM is not optional here. Excel on Windows assumes the system
    // codepage for a .csv without it, which renders every Arabic value as
    // mojibake — and half this data set is Arabic.
    const csv = `\uFEFF${[header, ...body].join('\r\n')}\r\n`;

    this.download(`${filename}.csv`, csv, 'text/csv;charset=utf-8;');
  }

  private download(filename: string, contents: string, mimeType: string): void {
    const view = this.document.defaultView;

    if (!view) {
      return;
    }

    const blob = new Blob([contents], { type: mimeType });
    const url = view.URL.createObjectURL(blob);
    const link = this.document.createElement('a');

    link.href = url;
    link.download = filename;
    this.document.body.appendChild(link);
    link.click();
    this.document.body.removeChild(link);

    // Revoking immediately can cancel the download in some browsers; one turn
    // of the event loop is enough for the click to have been handled.
    view.setTimeout(() => view.URL.revokeObjectURL(url), 0);
  }

  /**
   * RFC 4180 quoting: wrap in quotes when the value contains a comma, quote or
   * newline, and double any embedded quotes. Without this a project named
   * "Ring Road, Package B" would silently split into two columns.
   */
  private escape(value: string): string {
    if (/[",\r\n]/.test(value)) {
      return `"${value.replaceAll('"', '""')}"`;
    }

    return value;
  }
}
