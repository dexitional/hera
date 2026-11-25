import { describe, expect, it } from 'vitest'
import { cleanMessageBody, MAX_MESSAGE_LENGTH, nextCursor } from './nominee-chat-queries'

describe('cleanMessageBody', () => {
  it('trims, drops trailing spaces and caps blank lines', () => {
    expect(cleanMessageBody('  hello  \r\n\r\n\r\n\r\nworld   ')).toBe('hello\n\nworld')
  })
  it('returns null for nothing and rejects over-long messages', () => {
    expect(cleanMessageBody('   \n  ')).toBeNull()
    expect(cleanMessageBody(undefined)).toBeNull()
    expect(() => cleanMessageBody('x'.repeat(MAX_MESSAGE_LENGTH + 1))).toThrow(/at most/)
  })
  it('keeps markup as plain text (rendered escaped by React)', () => {
    expect(cleanMessageBody('<script>alert(1)</script>')).toBe('<script>alert(1)</script>')
  })
})

describe('nextCursor', () => {
  const m = (updatedAt: string) => ({ updatedAt }) as any
  it('moves to the newest updated_at and never backwards', () => {
    expect(nextCursor([m('2026-11-25T10:00:00.000Z'), m('2026-11-25T10:00:05.000Z')], null)).toBe('2026-11-25T10:00:05.000Z')
    expect(nextCursor([m('2026-11-25T09:00:00.000Z')], '2026-11-25T10:00:00.000Z')).toBe('2026-11-25T10:00:00.000Z')
    expect(nextCursor([], '2026-11-25T10:00:00.000Z')).toBe('2026-11-25T10:00:00.000Z')
  })
})
