import { describe, expect, it } from 'vitest';
import { sortRows, type Column } from './ui';

const rows = [
  { name: 'Beta', amount: 20 },
  { name: 'alpha', amount: 100 },
  { name: 'Gamma 10', amount: null as number | null },
  { name: 'Gamma 9', amount: 5 },
];
const byName: Column<(typeof rows)[number]> = { key: 'name', header: 'Name', render: () => null, sortValue: (r) => r.name };
const byAmount: Column<(typeof rows)[number]> = { key: 'amount', header: 'Amount', render: () => null, sortValue: (r) => r.amount };

describe('sortRows', () => {
  it('sorts text case-insensitively with natural number order', () => {
    expect(sortRows(rows, byName, 'asc').map((r) => r.name)).toEqual(['alpha', 'Beta', 'Gamma 9', 'Gamma 10']);
  });
  it('sorts numbers both ways, keeping missing values last', () => {
    expect(sortRows(rows, byAmount, 'desc').map((r) => r.amount)).toEqual([100, 20, 5, null]);
    expect(sortRows(rows, byAmount, 'asc').map((r) => r.amount)).toEqual([5, 20, 100, null]);
  });
  it('does not mutate the input, and leaves unsortable columns alone', () => {
    const copy = [...rows];
    sortRows(rows, byAmount, 'asc');
    expect(rows).toEqual(copy);
    expect(sortRows(rows, { key: 'x', header: 'x', render: () => null }, 'asc')).toBe(rows);
  });
});
