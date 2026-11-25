import { describe, expect, it } from 'vitest'
import { mergeMessages, sortMessages, type ChatMessage } from './useChatRoom'

const msg = (id: string, createdAt: string, over: Partial<ChatMessage> = {}): ChatMessage => ({
  id, body: id, deleted: false, pinned: false, createdAt, updatedAt: createdAt,
  author: { type: 'nominee', contestantId: 'c1', name: 'A', imageUrl: null, category: null }, ...over,
})

describe('mergeMessages', () => {
  it('adds new messages, replaces changed ones and drops deleted ones', () => {
    let room = mergeMessages(new Map(), [msg('a', '1'), msg('b', '2')], true)
    room = mergeMessages(room, [msg('b', '2', { pinned: true }), msg('c', '3'), msg('a', '1', { deleted: true, body: null })], false)
    expect(sortMessages(room).map((m) => [m.id, m.pinned])).toEqual([['b', true], ['c', false]])
  })
  it('a full load replaces everything', () => {
    const room = mergeMessages(new Map([['x', msg('x', '1')]]), [msg('y', '2')], true)
    expect([...room.keys()]).toEqual(['y'])
  })
  it('re-delivered messages (cursor overlap) are not duplicated', () => {
    const once = mergeMessages(new Map(), [msg('a', '1')], true)
    expect(mergeMessages(once, [msg('a', '1')], false).size).toBe(1)
  })
})
