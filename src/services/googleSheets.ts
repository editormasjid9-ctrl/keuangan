import {
  EXPENSE_CATEGORIES,
  INCOME_SOURCES,
} from '../data/initialData';
import {
  ExpenseCategory,
  IncomeSource,
  Transaction,
  TransactionType,
} from '../types';

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface SheetTab {
  sheetId: number;
  title: string;
  index: number;
}

export interface SpreadsheetMetadata {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
  sheets: SheetTab[];
}

export class WorkspaceAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WorkspaceAuthError';
  }
}

async function fetchGoogleApi(
  url: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    throw new WorkspaceAuthError(
      'Sesi akses Google telah kedaluwarsa. Silakan masuk ulang dengan Google.'
    );
  }

  if (!res.ok) {
    let message = `Permintaan gagal (${res.status})`;
    try {
      const errJson = await res.json();
      if (errJson?.error?.message) {
        message = errJson.error.message;
      }
    } catch {
      // ignore json parse failure
    }
    throw new Error(message);
  }

  return res;
}

export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

export async function listSpreadsheets(
  token: string
): Promise<DriveSpreadsheetFile[]> {
  const q = encodeURIComponent(
    "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false"
  );
  const fields = encodeURIComponent(
    'files(id,name,modifiedTime,webViewLink)'
  );
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&orderBy=modifiedTime%20desc&pageSize=25`;
  const res = await fetchGoogleApi(url, token);
  const data = await res.json();
  return (data.files || []) as DriveSpreadsheetFile[];
}

export async function getSpreadsheetMetadata(
  token: string,
  spreadsheetId: string
): Promise<SpreadsheetMetadata> {
  const fields = encodeURIComponent(
    'spreadsheetId,spreadsheetUrl,properties.title,sheets.properties(sheetId,title,index)'
  );
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}?fields=${fields}`;
  const res = await fetchGoogleApi(url, token);
  const data = await res.json();

  const sheets: SheetTab[] = (data.sheets || []).map(
    (s: { properties: { sheetId: number; title: string; index: number } }) => ({
      sheetId: s.properties.sheetId,
      title: s.properties.title,
      index: s.properties.index,
    })
  );

  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || 'Spreadsheet Tanpa Judul',
    spreadsheetUrl:
      data.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    sheets,
  };
}

export async function readRawSheetValues(
  token: string,
  spreadsheetId: string,
  sheetTitle: string
): Promise<string[][]> {
  const range = encodeURIComponent(`'${sheetTitle.replace(/'/g, "''")}'!A1:H500`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${range}`;
  const res = await fetchGoogleApi(url, token);
  const data = await res.json();
  return (data.values || []) as string[][];
}

function normalizeDate(raw: string): string {
  const val = (raw || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const slashMatch = val.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3];
    return `${year}-${month}-${day}`;
  }
  return new Date().toISOString().slice(0, 10);
}

function normalizeAmount(raw: string): number {
  const cleaned = String(raw || '').replace(/[^\d]/g, '');
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeType(raw: string): TransactionType {
  const lower = (raw || '').toLowerCase();
  if (
    lower.includes('masuk') ||
    lower.includes('income') ||
    lower.includes('kredit') ||
    lower.includes('in')
  ) {
    return 'pemasukan';
  }
  return 'pengeluaran';
}

function normalizeCategory(
  raw: string,
  type: TransactionType
): IncomeSource | ExpenseCategory {
  const trimmed = (raw || '').trim().toLowerCase();
  if (type === 'pemasukan') {
    const found = INCOME_SOURCES.find((s) => s.toLowerCase() === trimmed);
    if (found) return found;
    if (trimmed.includes('kotak')) return 'Kotak Infak';
    if (trimmed.includes('online') || trimmed.includes('qris'))
      return 'Infak Online';
    if (trimmed.includes('sewa') || trimmed.includes('hall')) return 'Sewa Hall';
    return 'Donatur';
  }
  const foundExp = EXPENSE_CATEGORIES.find((c) => c.toLowerCase() === trimmed);
  if (foundExp) return foundExp;
  if (trimmed.includes('kegiatan')) return 'Kegiatan Masjid';
  if (trimmed.includes('sosial') || trimmed.includes('dakwah'))
    return 'Sosial & Dakwah';
  return 'Operasional';
}

export function parseRowsToTransactions(rows: string[][]): Transaction[] {
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => (h || '').trim().toLowerCase());

  const findCol = (keywords: string[], fallbackIdx: number) => {
    const idx = headers.findIndex((h) => keywords.some((k) => h.includes(k)));
    return idx >= 0 ? idx : fallbackIdx;
  };

  const hasIdCol = headers[0] === 'id';
  const colId = hasIdCol ? 0 : -1;
  const colDate = findCol(['tanggal', 'date', 'tgl'], hasIdCol ? 1 : 0);
  const colType = findCol(['jenis', 'type', 'tipe'], hasIdCol ? 2 : 1);
  const colDesc = findCol(['uraian', 'keterangan', 'desc'], hasIdCol ? 3 : 2);
  const colCat = findCol(['kategori', 'sumber', 'category'], hasIdCol ? 4 : 3);
  const colAmount = findCol(['jumlah', 'nominal', 'amount', 'rp'], hasIdCol ? 5 : 4);
  const colPic = findCol(['penanggung', 'pic', 'petugas'], hasIdCol ? 6 : 5);
  const colNotes = findCol(['catatan', 'notes', 'note'], hasIdCol ? 7 : 6);

  const parsed: Transaction[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((cell) => !String(cell || '').trim())) continue;

    const description = (row[colDesc] || '').trim();
    const amount = normalizeAmount(row[colAmount] || '');
    if (!description || amount <= 0) continue;

    const type = normalizeType(row[colType] || '');
    const category = normalizeCategory(row[colCat] || '', type);
    const date = normalizeDate(row[colDate] || '');
    const pic = (row[colPic] || '').trim() || 'Takmir';
    const notes = (row[colNotes] || '').trim() || undefined;
    const rawId = colId >= 0 ? (row[colId] || '').trim() : '';

    parsed.push({
      id: rawId || `gs-${i}-${Date.now()}`,
      date,
      type,
      description,
      category,
      amount,
      pic,
      notes,
    });
  }

  return parsed;
}

export function buildSheetRowsFromTransactions(
  transactions: Transaction[]
): (string | number)[][] {
  const header = [
    'ID',
    'Tanggal',
    'Jenis',
    'Uraian',
    'Kategori / Sumber',
    'Jumlah (Rp)',
    'Penanggung Jawab',
    'Catatan',
  ];

  const sorted = [...transactions].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  const body = sorted.map((tx) => [
    tx.id,
    tx.date,
    tx.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran',
    tx.description,
    tx.category,
    tx.amount,
    tx.pic || 'Takmir',
    tx.notes || '',
  ]);

  return [header, ...body];
}

export async function createMosqueSpreadsheet(
  token: string,
  title: string,
  transactions: Transaction[]
): Promise<SpreadsheetMetadata> {
  const sheetTitle = 'Transaksi Kas';
  const createRes = await fetchGoogleApi(
    'https://sheets.googleapis.com/v4/spreadsheets',
    token,
    {
      method: 'POST',
      body: JSON.stringify({
        properties: {
          title,
          locale: 'id_ID',
        },
        sheets: [
          {
            properties: {
              title: sheetTitle,
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
        ],
      }),
    }
  );

  const created = await createRes.json();
  const spreadsheetId: string = created.spreadsheetId;

  await writeTransactionsToSheet(token, spreadsheetId, sheetTitle, transactions);

  return {
    spreadsheetId,
    title: created.properties?.title || title,
    spreadsheetUrl:
      created.spreadsheetUrl ||
      `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    sheets: (created.sheets || []).map(
      (s: { properties: { sheetId: number; title: string; index: number } }) => ({
        sheetId: s.properties.sheetId,
        title: s.properties.title,
        index: s.properties.index,
      })
    ),
  };
}

export async function writeTransactionsToSheet(
  token: string,
  spreadsheetId: string,
  sheetTitle: string,
  transactions: Transaction[]
): Promise<void> {
  const escapedTab = `'${sheetTitle.replace(/'/g, "''")}'`;
  const clearRange = encodeURIComponent(`${escapedTab}!A1:H1000`);

  await fetchGoogleApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${clearRange}:clear`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({}),
    }
  );

  const values = buildSheetRowsFromTransactions(transactions);
  const updateRange = encodeURIComponent(`${escapedTab}!A1`);

  await fetchGoogleApi(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${updateRange}?valueInputOption=USER_ENTERED`,
    token,
    {
      method: 'PUT',
      body: JSON.stringify({
        range: `${escapedTab}!A1`,
        majorDimension: 'ROWS',
        values,
      }),
    }
  );
}
