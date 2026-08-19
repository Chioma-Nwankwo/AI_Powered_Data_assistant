import Papa from 'papaparse';

export async function parseCSV(file: File): Promise<{ columns: string[]; rows: any[]; rowCount: number }> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const columns = results.meta.fields || [];
        const rows = results.data;
        resolve({
          columns,
          rows,
          rowCount: rows.length,
        });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

export async function parseExcel(file: File): Promise<{ columns: string[]; rows: any[]; rowCount: number }> {
  const text = await file.text();
  const lines = text.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    throw new Error('Empty file');
  }

  const columns = lines[0].split(/[,\t]/).map(col => col.trim());
  const rows = lines.slice(1).map(line => {
    const values = line.split(/[,\t]/);
    const row: any = {};
    columns.forEach((col, idx) => {
      row[col] = values[idx]?.trim() || '';
    });
    return row;
  });

  return {
    columns,
    rows,
    rowCount: rows.length,
  };
}

export async function parseFile(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    return parseCSV(file);
  } else if (extension === 'xlsx' || extension === 'xls') {
    return parseCSV(file);
  } else {
    throw new Error('Unsupported file type. Please upload CSV or Excel files.');
  }
}

export function getSampleRows(rows: any[], count: number = 5) {
  return rows.slice(0, Math.min(count, rows.length));
}

function isMissing(value: any) {
  return value === null || value === undefined || String(value).trim() === '';
}

export interface ColumnStats {
  missingCount: number;
  uniqueCount: number;
  numeric?: { min: number; max: number; mean: number };
}

export function getColumnStats(rows: any[], columns: string[]): Record<string, ColumnStats> {
  const stats: Record<string, ColumnStats> = {};

  for (const column of columns) {
    let missingCount = 0;
    const uniqueValues = new Set<string>();
    const numericValues: number[] = [];

    for (const row of rows) {
      const value = row[column];
      if (isMissing(value)) {
        missingCount++;
        continue;
      }
      uniqueValues.add(String(value));
      const numericValue = Number(value);
      if (!Number.isNaN(numericValue) && String(value).trim() !== '') {
        numericValues.push(numericValue);
      }
    }

    const columnStats: ColumnStats = {
      missingCount,
      uniqueCount: uniqueValues.size,
    };

    if (numericValues.length > 0 && numericValues.length === rows.length - missingCount) {
      columnStats.numeric = {
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
        mean: numericValues.reduce((sum, v) => sum + v, 0) / numericValues.length,
      };
    }

    stats[column] = columnStats;
  }

  return stats;
}
