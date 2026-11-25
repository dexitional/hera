import { describe, expect, it } from 'vitest'
import { authErrorMessage, friendlyMessage, GENERIC_ERROR, isInternalError, NETWORK_ERROR, toUserMessage } from './errors'

describe('isInternalError', () => {
  it('flags database failures, whatever shape they arrive in', () => {
    const drizzle = Object.assign(new Error('Failed query: select "events"."id" from "events" where "events"."id" = $1\nparams: abc'), { name: 'DrizzleQueryError' })
    expect(isInternalError(drizzle)).toBe(true)
    expect(isInternalError(Object.assign(new Error('invalid input syntax for type uuid'), { code: '22P02' }))).toBe(true)
    expect(isInternalError(new Error('wrapper', { cause: Object.assign(new Error('x'), { code: 'ECONNREFUSED' }) }))).toBe(true)
    expect(isInternalError(new Error('duplicate key value violates unique constraint "x"'))).toBe(true)
  })
  it('flags programming mistakes and missing configuration', () => {
    expect(isInternalError(new TypeError("Cannot read properties of undefined (reading 'id')"))).toBe(true)
    expect(isInternalError(new Error('VOTER_TOKEN_KEY is not configured.'))).toBe(true)
  })
  it('leaves messages written for people alone, even ones mentioning select/from', () => {
    expect(isInternalError(new Error('That category code is already in use for this event.'))).toBe(false)
    expect(isInternalError(new Error('Please select a photo from your gallery.'))).toBe(false)
  })
})

describe('toUserMessage / friendlyMessage', () => {
  it('rewords terse codes', () => {
    expect(friendlyMessage(new Error('Unauthorized'))).toBe('Please sign in to continue.')
    expect(friendlyMessage(new Error('Too Many Requests'))).toMatch(/a little fast/)
    expect(friendlyMessage(new Error('Bot Traffic Detected'))).toMatch(/verify your browser/)
  })
  it('turns browser network failures into a connection message', () => {
    expect(toUserMessage(new TypeError('Failed to fetch'))).toBe(NETWORK_ERROR)
    expect(toUserMessage(new TypeError('Load failed'))).toBe(NETWORK_ERROR)
  })
  it('hides internals behind the generic message', () => {
    expect(toUserMessage(Object.assign(new Error('Failed query: select ...'), { name: 'DrizzleQueryError' }))).toBe(GENERIC_ERROR)
    expect(toUserMessage(undefined)).toBe(GENERIC_ERROR)
  })
  it('passes our own messages through', () => {
    expect(toUserMessage(new Error('Please add a photo of yourself.'))).toBe('Please add a photo of yourself.')
  })
})

describe('authErrorMessage', () => {
  it('words better-auth codes and statuses', () => {
    expect(authErrorMessage({ code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email or password' })).toMatch(/don't match/)
    expect(authErrorMessage({ status: 429, message: 'Too Many Requests' })).toMatch(/a little fast/)
    expect(authErrorMessage({ code: 'SOMETHING_NEW', message: 'Readable server text.' })).toBe('Readable server text.')
    expect(authErrorMessage({}, 'Fallback.')).toBe('Fallback.')
  })
})
