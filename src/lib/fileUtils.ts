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
