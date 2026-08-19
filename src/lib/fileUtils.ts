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

export interface CleaningOperation {
  type: 'drop_columns' | 'fill_missing' | 'standardize_missing_markers' | 'drop_duplicate_rows' | 'trim_whitespace' | 'drop_empty_columns';
  columns?: string[];
  column?: string;
  strategy?: 'mean' | 'median' | 'mode' | 'value';
  value?: string | number;
  markers?: string[];
}

export interface CleaningResult {
  rows: any[];
  columns: string[];
  log: string[];
}

const DEFAULT_MISSING_MARKERS = ['-9999', '-999', 'na', 'n/a', 'null', 'none', '?'];

export function applyCleaningOperations(
  rows: any[],
  columns: string[],
  operations: CleaningOperation[]
): CleaningResult {
  let workingRows = rows.map((row) => ({ ...row }));
  let workingColumns = [...columns];
  const log: string[] = [];

  for (const op of operations) {
    switch (op.type) {
      case 'standardize_missing_markers': {
        const markers = new Set(
          (op.markers && op.markers.length ? op.markers : DEFAULT_MISSING_MARKERS).map((m) =>
            m.toLowerCase()
          )
        );
        let count = 0;
        for (const row of workingRows) {
          for (const col of workingColumns) {
            const value = row[col];
            if (!isMissing(value) && markers.has(String(value).trim().toLowerCase())) {
              row[col] = '';
              count++;
            }
          }
        }
        log.push(`Standardized ${count} sentinel/placeholder values to blank`);
        break;
      }

      case 'trim_whitespace': {
        for (const row of workingRows) {
          for (const col of workingColumns) {
            if (typeof row[col] === 'string') {
              row[col] = row[col].trim();
            }
          }
        }
        log.push('Trimmed whitespace on all text fields');
        break;
      }

      case 'drop_duplicate_rows': {
        const seen = new Set<string>();
        const before = workingRows.length;
        workingRows = workingRows.filter((row) => {
          const key = JSON.stringify(row);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        log.push(`Removed ${before - workingRows.length} duplicate rows`);
        break;
      }

      case 'drop_empty_columns': {
        const emptyColumns = workingColumns.filter((col) =>
          workingRows.every((row) => isMissing(row[col]))
        );
        workingColumns = workingColumns.filter((col) => !emptyColumns.includes(col));
        for (const row of workingRows) {
          for (const col of emptyColumns) delete row[col];
        }
        log.push(
          `Dropped ${emptyColumns.length} fully-empty column(s)${
            emptyColumns.length ? ': ' + emptyColumns.join(', ') : ''
          }`
        );
        break;
      }

      case 'drop_columns': {
        const toDrop = (op.columns || []).filter((c) => workingColumns.includes(c));
        workingColumns = workingColumns.filter((c) => !toDrop.includes(c));
        for (const row of workingRows) {
          for (const col of toDrop) delete row[col];
        }
        log.push(`Dropped ${toDrop.length} column(s): ${toDrop.join(', ')}`);
        break;
      }

      case 'fill_missing': {
        if (!op.column || !workingColumns.includes(op.column)) break;
        const col = op.column;
        const knownValues = workingRows.map((r) => r[col]).filter((v) => !isMissing(v));
        const numericValues = knownValues.map(Number).filter((n) => !Number.isNaN(n));

        let fillValue: string | number = op.value ?? '';
        if (op.strategy === 'mean' && numericValues.length) {
          fillValue = Number(
            (numericValues.reduce((a, b) => a + b, 0) / numericValues.length).toFixed(2)
          );
        } else if (op.strategy === 'median' && numericValues.length) {
          const sorted = [...numericValues].sort((a, b) => a - b);
          fillValue = sorted[Math.floor(sorted.length / 2)];
        } else if (op.strategy === 'mode' && knownValues.length) {
          const freq: Record<string, number> = {};
          knownValues.forEach((v) => {
            const key = String(v);
            freq[key] = (freq[key] || 0) + 1;
          });
          fillValue = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
        }

        let count = 0;
        for (const row of workingRows) {
          if (isMissing(row[col])) {
            row[col] = fillValue;
            count++;
          }
        }
        log.push(`Filled ${count} missing value(s) in "${col}" using ${op.strategy || 'value'} (${fillValue})`);
        break;
      }
    }
  }

  return { rows: workingRows, columns: workingColumns, log };
}

export function rowsToCSV(rows: any[], columns: string[]): string {
  return Papa.unparse({ fields: columns, data: rows.map((row) => columns.map((col) => row[col] ?? '')) });
}
