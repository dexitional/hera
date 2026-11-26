import { describe, expect, it } from 'vitest'
import { parseDialShortcut } from './router'

describe('parseDialShortcut', () => {
  it('reads the options after the platform shortcode', () => {
    expect(parseDialShortcut('*928*330#')).toEqual([])
    expect(parseDialShortcut('*928*330*1#')).toEqual(['1'])
    expect(parseDialShortcut('*928*330*1*23445#')).toEqual(['1', '23445'])
    expect(parseDialShortcut(' *928*330*1*3243# ')).toEqual(['1', '3243'])
  })
  it('accepts gateways that send only the extra part', () => {
    expect(parseDialShortcut('1*23445')).toEqual(['1', '23445'])
    expect(parseDialShortcut('')).toEqual([])
  })
})

import { generateContestantCode, ussdDialFor } from '#/lib/utils'

describe('ussdDialFor', () => {
  it('dials digit codes in full and letter codes by their last 4 digits', () => {
    expect(ussdDialFor('23445')).toBe('*928*330*1*23445#')
    expect(ussdDialFor('a3243')).toBe('*928*330*1*3243#')
  })
  it('round-trips through the USSD parser', () => {
    expect(parseDialShortcut(ussdDialFor('23445'))).toEqual(['1', '23445'])
    expect(parseDialShortcut(ussdDialFor('A3243'))).toEqual(['1', '3243'])
  })
})

describe('generateContestantCode', () => {
  it('makes 5-digit codes with no leading zero', () => {
    for (let i = 0; i < 300; i++) expect(generateContestantCode()).toMatch(/^[1-9]\d{4}$/)
  })
})
