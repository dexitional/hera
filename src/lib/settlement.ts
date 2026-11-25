import { normalizePhone } from './phone'

// Where an event's organiser share is paid out. Shared by the event form
// (options, client-side hints) and the server (validation).

export const SETTLEMENT_TYPES = [
  { value: 'momo', label: 'Mobile money' },
  { value: 'bank', label: 'Bank account' },
] as const
export type SettlementType = (typeof SETTLEMENT_TYPES)[number]['value']

export const MOMO_NETWORKS = ['MTN', 'Telecel', 'AirtelTigo'] as const

/** Suggestions for the bank field (any bank name is accepted). */
export const GHANA_BANKS = [
  'Absa Bank Ghana', 'Access Bank Ghana', 'Agricultural Development Bank', 'Bank of Africa Ghana', 'CalBank',
  'Consolidated Bank Ghana', 'Ecobank Ghana', 'FBNBank Ghana', 'Fidelity Bank Ghana', 'First Atlantic Bank',
  'First National Bank Ghana', 'GCB Bank', 'Guaranty Trust Bank Ghana', 'National Investment Bank', 'OmniBSIC Bank',
  'Prudential Bank', 'Republic Bank Ghana', 'Société Générale Ghana', 'Stanbic Bank Ghana', 'Standard Chartered Bank Ghana',
  'United Bank for Africa Ghana', 'Universal Merchant Bank', 'Zenith Bank Ghana',
]

export type Settlement = {
  settlementType: SettlementType | null
  settlementProvider: string | null
  settlementBranch: string | null
  settlementAccountNumber: string | null
  settlementAccountName: string | null
}

export const EMPTY_SETTLEMENT: Settlement = {
  settlementType: null, settlementProvider: null, settlementBranch: null, settlementAccountNumber: null, settlementAccountName: null,
}

const text = (v: unknown, max: number) => {
  const s = String(v ?? '').trim().replace(/\s+/g, ' ')
  return s ? s.slice(0, max) : ''
}

/**
 * Validates and normalises settlement details. No type means "not set yet"
 * (all fields cleared); a chosen type must be complete. Throws a message
 * fit to show.
 */
export function parseSettlement(input: Record<string, unknown>): Settlement {
  const type = String(input.settlementType ?? '').trim()
  if (!type) return { ...EMPTY_SETTLEMENT }
  const name = text(input.settlementAccountName, 100)
  if (type === 'momo') {
    const network = MOMO_NETWORKS.find((n) => n.toLowerCase() === String(input.settlementProvider ?? '').trim().toLowerCase())
    if (!network) throw new Error('Choose the mobile money network for settlement.')
    const number = normalizePhone(input.settlementAccountNumber)
    if (!number || !/^0\d{9}$/.test(number)) throw new Error('Enter a valid Ghana mobile money number for settlement, e.g. 0241234567.')
    if (name.length < 2) throw new Error('Enter the name registered on the mobile money wallet.')
    return { settlementType: 'momo', settlementProvider: network, settlementBranch: null, settlementAccountNumber: number, settlementAccountName: name }
  }
  if (type === 'bank') {
    const bank = text(input.settlementProvider, 80)
    if (bank.length < 2) throw new Error('Enter the bank for settlement.')
    const number = String(input.settlementAccountNumber ?? '').replace(/[\s-]/g, '')
    if (!/^\d{6,20}$/.test(number)) throw new Error('Enter a valid bank account number for settlement (6 to 20 digits).')
    if (name.length < 2) throw new Error('Enter the name on the bank account.')
    return { settlementType: 'bank', settlementProvider: bank, settlementBranch: text(input.settlementBranch, 80) || null, settlementAccountNumber: number, settlementAccountName: name }
  }
  throw new Error('Choose mobile money or bank account for settlement.')
}

/** One-line summary, e.g. "MTN MoMo · 0241234567 · Ama Mensah". */
export function describeSettlement(s: Partial<Settlement> | null | undefined): string | null {
  if (!s?.settlementType) return null
  const kind = s.settlementType === 'momo' ? `${s.settlementProvider} MoMo` : [s.settlementProvider, s.settlementBranch].filter(Boolean).join(', ')
  return [kind, s.settlementAccountNumber, s.settlementAccountName].filter(Boolean).join(' · ')
}
