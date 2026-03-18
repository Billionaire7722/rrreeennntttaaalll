import * as XLSX from 'xlsx';

type ExportValue = string | number | boolean | null | undefined;

export type ExportColumn<T> = {
    key: keyof T;
    header: string;
    format?: (value: unknown, row: T) => ExportValue;
};

const buildExportRows = <T extends object>(rows: T[], columns: ExportColumn<T>[]) =>
    rows.map((row) =>
        columns.reduce<Record<string, ExportValue>>((acc, column) => {
            const rawValue = row[column.key];
            acc[column.header] = column.format ? column.format(rawValue, row) : (rawValue as ExportValue);
            return acc;
        }, {}),
    );

const getDatedFilename = (baseName: string, extension: 'csv' | 'xlsx') =>
    `${baseName}_${new Date().toISOString().slice(0, 10)}.${extension}`;

const toCsvCell = (value: ExportValue) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export const downloadCsv = <T extends object>(
    rows: T[],
    columns: ExportColumn<T>[],
    baseName: string,
) => {
    const exportRows = buildExportRows(rows, columns);
    const header = columns.map((column) => column.header);
    const values = exportRows.map((row) => columns.map((column) => row[column.header]));
    const csv = [header, ...values].map((row) => row.map(toCsvCell).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = getDatedFilename(baseName, 'csv');
    anchor.click();
    URL.revokeObjectURL(url);
};

export const downloadExcel = <T extends object>(
    rows: T[],
    columns: ExportColumn<T>[],
    baseName: string,
    sheetName: string,
) => {
    const worksheet = XLSX.utils.json_to_sheet(buildExportRows(rows, columns));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, getDatedFilename(baseName, 'xlsx'));
};
