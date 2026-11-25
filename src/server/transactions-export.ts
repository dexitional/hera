import XLSX from 'xlsx-js-style';

// Builds the Vote Transactions Excel export. Kept free of database and
// createServerFn code so it can be unit tested on its own.

export type ExportTransaction = {
  createdAt: Date;
  transRef: string | null;
  payRef: string | null;
  categoryName: string;
  contestantName: string;
  contestantCode: string;
  payPhone: string;
  channel: string;
  votes: number;
  payAmount: number | null;
  payStatus: boolean;
};

export type ExportMeta = {
  eventTitle: string;
  statusFilter: 'ALL' | 'PAID' | 'PENDING';
  searchQuery: string;
  exportedAt: Date;
};

const HEADER_STYLE = {
  font: { name: 'Arial', sz: 10, bold: true, color: { rgb: 'FFFFFF' } },
  fill: { fgColor: { rgb: '0A192A' } },
  alignment: { horizontal: 'left', vertical: 'center' },
};
const TITLE_STYLE = { font: { name: 'Arial', sz: 13, bold: true } };
const LABEL_STYLE = { font: { name: 'Arial', sz: 10, bold: true, color: { rgb: '4B5563' } } };
const TOTAL_STYLE = { font: { name: 'Arial', sz: 10, bold: true }, border: { top: { style: 'thin', color: { rgb: '9CA3AF' } } } };
const TEXT_STYLE = { font: { name: 'Arial', sz: 10 } };

const MONEY_FORMAT = '"GH₵"#,##0.00';
const COUNT_FORMAT = '#,##0';
const DATE_FORMAT = 'yyyy-mm-dd hh:mm:ss';

type Cell = { v: string | number; t: 's' | 'n'; z?: string; s?: object };

/** Excel serial day number for a Date (UTC, which is Ghana time). */
export function excelDate(d: Date): number {
  return d.getTime() / 86_400_000 + 25569;
}

const text = (v: string | null | undefined, s: object = TEXT_STYLE): Cell => ({ v: v ?? '', t: 's', s });
const num = (v: number, z: string, s: object = TEXT_STYLE): Cell => ({ v, t: 'n', z, s });

function sheetFrom(rows: (Cell | null)[][], widths: number[]): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  let maxCol = 0;
  rows.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (!cell) return;
      ws[XLSX.utils.encode_cell({ r, c })] = cell;
      maxCol = Math.max(maxCol, c);
    });
  });
  ws['!ref'] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: Math.max(0, rows.length - 1), c: maxCol });
  ws['!cols'] = widths.map((wch) => ({ wch }));
  return ws;
}

/** A filename-safe slug of the event title, e.g. "Campus Awards 2026" -> "campus-awards-2026". */
export function exportFilename(eventTitle: string, exportedAt: Date): string {
  const slug = eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'event';
  return `${slug}-vote-transactions-${exportedAt.toISOString().slice(0, 10)}.xlsx`;
}

export function buildTransactionsWorkbook(rows: ExportTransaction[], meta: ExportMeta): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  // ---- Sheet 1: every transaction, one row each
  const headers = ['Date (GMT)', 'Status', 'Category', 'Nominee', 'Nominee code', 'Payer phone', 'Channel', 'Votes', 'Amount', 'Transaction ref', 'Payment ref'];
  const txRows: Cell[][] = [
    headers.map((h) => text(h, HEADER_STYLE)),
    ...rows.map((t) => [
      num(excelDate(t.createdAt), DATE_FORMAT),
      text(t.payStatus ? 'Paid' : 'Pending'),
      text(t.categoryName),
      text(t.contestantName),
      text(t.contestantCode),
      text(t.payPhone),
      text(t.channel),
      num(t.votes, COUNT_FORMAT),
      t.payAmount == null ? text('') : num(t.payAmount, MONEY_FORMAT),
      text(t.transRef),
      text(t.payRef),
    ]),
  ];
  const txSheet = sheetFrom(txRows, [20, 9, 24, 26, 13, 16, 9, 8, 13, 22, 26]);
  txSheet['!autofilter'] = { ref: XLSX.utils.encode_range({ r: 0, c: 0 }, { r: Math.max(1, rows.length), c: headers.length - 1 }) };
  txSheet['!freeze'] = { xSplit: 0, ySplit: 1 };
  txSheet['!views'] = [{ state: 'frozen', ySplit: 1, topLeftCell: 'A2' }] as any;

  // ---- Sheet 2: summary and paid totals per category
  const paid = rows.filter((t) => t.payStatus);
  const sum = (list: ExportTransaction[], f: (t: ExportTransaction) => number) => list.reduce((s, t) => s + f(t), 0);
  const byCategory = new Map<string, { payments: number; votes: number; amount: number }>();
  for (const t of paid) {
    const c = byCategory.get(t.categoryName) ?? { payments: 0, votes: 0, amount: 0 };
    c.payments += 1;
    c.votes += t.votes;
    c.amount += t.payAmount ?? 0;
    byCategory.set(t.categoryName, c);
  }
  const categories = [...byCategory.entries()].sort((a, b) => b[1].amount - a[1].amount);
  const filterText = [
    meta.statusFilter === 'ALL' ? 'All statuses' : meta.statusFilter === 'PAID' ? 'Paid only' : 'Pending only',
    meta.searchQuery ? `search "${meta.searchQuery}"` : null,
  ].filter(Boolean).join(', ');

  const summaryRows: (Cell | null)[][] = [
    [text(`${meta.eventTitle}: vote transactions`, TITLE_STYLE)],
    [],
    [text('Exported (GMT)', LABEL_STYLE), num(excelDate(meta.exportedAt), DATE_FORMAT)],
    [text('Filters', LABEL_STYLE), text(filterText)],
    [text('Transactions', LABEL_STYLE), num(rows.length, COUNT_FORMAT)],
    [text('Paid', LABEL_STYLE), num(paid.length, COUNT_FORMAT)],
    [text('Pending', LABEL_STYLE), num(rows.length - paid.length, COUNT_FORMAT)],
    [text('Paid votes', LABEL_STYLE), num(sum(paid, (t) => t.votes), COUNT_FORMAT)],
    [text('Paid amount', LABEL_STYLE), num(sum(paid, (t) => t.payAmount ?? 0), MONEY_FORMAT)],
    [],
    ['Category', 'Paid transactions', 'Votes', 'Amount'].map((h) => text(h, HEADER_STYLE)),
    ...categories.map(([name, c]) => [text(name), num(c.payments, COUNT_FORMAT), num(c.votes, COUNT_FORMAT), num(c.amount, MONEY_FORMAT)]),
    [
      text('Total', TOTAL_STYLE),
      num(paid.length, COUNT_FORMAT, TOTAL_STYLE),
      num(sum(paid, (t) => t.votes), COUNT_FORMAT, TOTAL_STYLE),
      num(sum(paid, (t) => t.payAmount ?? 0), MONEY_FORMAT, TOTAL_STYLE),
    ],
  ];

  XLSX.utils.book_append_sheet(workbook, sheetFrom(summaryRows, [28, 30, 12, 16]), 'Summary');
  XLSX.utils.book_append_sheet(workbook, txSheet, 'Transactions');
  return workbook;
}
