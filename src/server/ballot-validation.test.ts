import { describe, expect, it } from 'vitest';
import { InvalidBallotError, validateBallotSelections } from './ballot-validation';

const positions = [
  { id: 'pres', slots: 1 },
  { id: 'exec', slots: 2 },
];
const candidates = [
  { id: 'alice', positionId: 'pres' },
  { id: 'bob', positionId: 'pres' },
  { id: 'carol', positionId: 'exec' },
  { id: 'dave', positionId: 'exec' },
  { id: 'erin', positionId: 'exec' },
];
const run = (selections: unknown) => validateBallotSelections(selections, positions, candidates);

describe('validateBallotSelections', () => {
  it('accepts a normal one-pick-per-position ballot (what the UI sends)', () => {
    expect(run([
      { positionId: 'pres', candidateId: 'alice' },
      { positionId: 'exec', candidateId: 'carol' },
    ])).toEqual([
      { positionId: 'pres', candidateId: 'alice' },
      { positionId: 'exec', candidateId: 'carol' },
    ]);
  });

  it('accepts abstentions (null candidate)', () => {
    expect(run([
      { positionId: 'pres', candidateId: null },
      { positionId: 'exec', candidateId: 'dave' },
    ])).toHaveLength(2);
  });

  it('accepts up to `slots` distinct picks for a multi-slot position', () => {
    expect(run([
      { positionId: 'exec', candidateId: 'carol' },
      { positionId: 'exec', candidateId: 'dave' },
    ])).toHaveLength(2);
  });

  it('strips extra fields from selections', () => {
    const [sel] = run([{ positionId: 'pres', candidateId: 'bob', electionId: 'other', receiptSignature: 'x' }]);
    expect(sel).toEqual({ positionId: 'pres', candidateId: 'bob' });
  });

  it.each([
    ['empty ballot', []],
    ['non-array ballot', { positionId: 'pres', candidateId: 'alice' }],
    ['ballot stuffing: same candidate repeated', Array(50).fill({ positionId: 'pres', candidateId: 'alice' })],
    ['two picks for a 1-slot position', [{ positionId: 'pres', candidateId: 'alice' }, { positionId: 'pres', candidateId: 'bob' }]],
    ['more picks than slots', [
      { positionId: 'exec', candidateId: 'carol' },
      { positionId: 'exec', candidateId: 'dave' },
      { positionId: 'exec', candidateId: 'erin' },
    ]],
    ['candidate from another position', [{ positionId: 'pres', candidateId: 'carol' }]],
    ['unknown / inactive / other-election candidate', [{ positionId: 'pres', candidateId: 'mallory' }]],
    ['unknown position', [{ positionId: 'treasurer', candidateId: 'alice' }]],
    ['abstain plus a pick for the same position', [{ positionId: 'exec', candidateId: null }, { positionId: 'exec', candidateId: 'carol' }]],
    ['pick then abstain for the same position', [{ positionId: 'exec', candidateId: 'carol' }, { positionId: 'exec', candidateId: null }]],
    ['double abstention', [{ positionId: 'pres', candidateId: null }, { positionId: 'pres', candidateId: null }]],
    ['non-string candidate id', [{ positionId: 'pres', candidateId: 42 }]],
  ])('rejects %s', (_label, selections) => {
    expect(() => run(selections)).toThrow(InvalidBallotError);
  });
});
