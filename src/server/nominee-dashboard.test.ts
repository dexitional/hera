import { describe, expect, it } from 'vitest'
import { asResultsView, rankStandings } from './nominee-dashboard'

describe('rankStandings', () => {
  it('orders by votes and gives tied nominees the same rank', () => {
    const ranked = rankStandings([
      { id: 'a', votes: 10 }, { id: 'b', votes: 50 }, { id: 'c', votes: 10 }, { id: 'd', votes: 0 },
    ])
    expect(ranked.map((r) => [r.id, r.rank])).toEqual([['b', 1], ['a', 2], ['c', 2], ['d', 4]])
  })
  it('ranks everyone first when nobody has votes', () => {
    expect(rankStandings([{ id: 'a', votes: 0 }, { id: 'b', votes: 0 }]).map((r) => r.rank)).toEqual([1, 1])
  })
})

describe('asResultsView', () => {
  it('accepts the three settings and falls back to "own"', () => {
    expect(asResultsView('hidden')).toBe('hidden')
    expect(asResultsView('standings')).toBe('standings')
    expect(asResultsView('everything')).toBe('own')
    expect(asResultsView(null)).toBe('own')
  })
})
