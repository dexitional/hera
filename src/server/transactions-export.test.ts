import { describe, expect, it } from 'vitest';
import XLSX from 'xlsx-js-style';
import { buildTransactionsWorkbook, excelDate, exportFilename, type ExportTransaction } from './transactions-export';

const tx = (over: Partial<ExportTransaction>): ExportTransaction => ({
  createdAt: new Date('2026-11-20T10:30:00Z'),
  transRef: 'T-1', payRef: 'P-1', categoryName: 'Best Artist', contestantName: 'Ama', contestantCode: 'A3243',
  payPhone: '0241234567', channel: 'WEB', votes: 10, payAmount: 5, payStatus: true, ...over,
});

const meta = { eventTitle: 'Campus Awards 2026', statusFilter: 'ALL' as const, searchQuery: '', exportedAt: new Date('2026-11-25T09:00:00Z') };

function roundTrip(rows: ExportTransaction[]) {
  const wb = buildTransactionsWorkbook(rows, meta);
  return XLSX.read(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }), { type: 'buffer' });
}

describe('buildTransactionsWorkbook', () => {
  it('writes one typed row per transaction under a header', () => {
    const wb = roundTrip([tx({}), tx({ payStatus: false, payAmount: null, votes: 3, payPhone: '=HYPERLINK("x")' })]);
    expect(wb.SheetNames).toEqual(['Summary', 'Transactions']);
    const rows = XLSX.utils.sheet_to_json<any[]>(wb.Sheets.Transactions, { header: 1, raw: true });
    expect(rows[0][0]).toBe('Date (GMT)');
    expect(rows).toHaveLength(3);
    expect(rows[1]).toEqual([excelDate(new Date('2026-11-20T10:30:00Z')), 'Paid', 'Best Artist', 'Ama', 'A3243', '0241234567', 'WEB', 10, 5, 'T-1', 'P-1']);
    // A phone that looks like a formula stays plain text, never a formula.
    expect(wb.Sheets.Transactions.F3.t).toBe('s');
    expect(wb.Sheets.Transactions.F3.f).toBeUndefined();
    expect(rows[2][1]).toBe('Pending');
  });

  it('totals only paid transactions, per category', () => {
    const wb = roundTrip([
      tx({ categoryName: 'A', votes: 10, payAmount: 5 }),
      tx({ categoryName: 'B', votes: 40, payAmount: 20 }),
      tx({ categoryName: 'B', votes: 2, payAmount: 1 }),
      tx({ categoryName: 'A', votes: 99, payAmount: 99, payStatus: false }),
    ]);
    const rows = XLSX.utils.sheet_to_json<any[]>(wb.Sheets.Summary, { header: 1, raw: true, blankrows: true });
    const find = (label: string) => rows.find((r) => r[0] === label)?.[1];
    expect(find('Transactions')).toBe(4);
    expect(find('Paid')).toBe(3);
    expect(find('Pending')).toBe(1);
    expect(find('Paid votes')).toBe(52);
    expect(find('Paid amount')).toBe(26);
    const header = rows.findIndex((r) => r[0] === 'Category');
    expect(rows.slice(header + 1)).toEqual([['B', 2, 42, 21], ['A', 1, 10, 5], ['Total', 3, 52, 26]]);
  });

  it('handles an event with no transactions', () => {
    const wb = roundTrip([]);
    expect(XLSX.utils.sheet_to_json<any[]>(wb.Sheets.Transactions, { header: 1 })).toHaveLength(1);
  });
});

describe('exportFilename', () => {
  it('slugs the title and dates the file', () => {
    expect(exportFilename('Campus Awards 2026!', meta.exportedAt)).toBe('campus-awards-2026-vote-transactions-2026-11-25.xlsx');
    expect(exportFilename('***', meta.exportedAt)).toBe('event-vote-transactions-2026-11-25.xlsx');
  });
});
