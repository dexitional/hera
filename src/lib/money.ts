/** Ghana cedi amount, always 2 decimals: ₵1,234.50 */
export function formatMoney(value: number | null | undefined): string {
  const n = Number(value) || 0;
  return `₵${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Percentage with up to 2 decimals: 10%, 12.5% */
export function formatPercent(value: number | null | undefined): string {
  const n = Number(value) || 0;
  return `${n.toLocaleString('en-GH', { maximumFractionDigits: 2 })}%`;
}
