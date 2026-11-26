import { and, asc, eq, like } from 'drizzle-orm';
import { db } from '../../db';
import { categories, contestants, events } from '../../db/schema';
import { guardTransaction, releaseTransactionLock } from '../../middleware/idempotency';
import { initiateMomoCharge } from '../paystack-momo';
import type { EventsVotingState } from './session-store';

const MAX_VOTES = 1000;

export type UssdStepResult = {
  message: string;
  continueSession: boolean;
  nextState?: EventsVotingState;
};

/** Most nominees a 4-digit match will list for the voter to pick from. */
const MAX_PICK = 5;

/**
 * Resolves what the voter dialed or typed to active nominees. Exact codes
 * first. A USSD dial string can only carry digits, so a code with a letter
 * (e.g. "A3243") can't be dialed; its 4 digits are accepted instead and
 * matched against the end of every active nominee's code.
 */
export async function resolveNomineeCode(input: string) {
  const code = input.trim().toUpperCase();
  if (!code) return [];
  const exact = await lookupActiveContestant(code);
  if (exact) return [exact];
  if (!/^\d{4}$/.test(code)) return [];
  return db
    .select({ contestant: contestants, category: categories, event: events })
    .from(contestants)
    .innerJoin(categories, eq(contestants.categoryId, categories.id))
    .innerJoin(events, eq(categories.eventId, events.id))
    .where(and(like(contestants.code, `_${code}`), eq(events.isActive, true)))
    .orderBy(asc(contestants.code))
    .limit(MAX_PICK + 1);
}

type NomineeRow = NonNullable<Awaited<ReturnType<typeof lookupActiveContestant>>>;

function askForVotes(row: NomineeRow): UssdStepResult {
  const unitPrice = row.event.unitPrice ?? 0;
  return {
    message: `Voting for: ${row.contestant.name}\n${row.category.name} - ${row.event.title}\nEnter number of votes (GHS ${unitPrice.toFixed(2)} each):`,
    continueSession: true,
    nextState: { step: 'awaiting_votes', code: row.contestant.code },
  };
}

async function lookupActiveContestant(code: string) {
  const [row] = await db
    .select({ contestant: contestants, category: categories, event: events })
    .from(contestants)
    .innerJoin(categories, eq(contestants.categoryId, categories.id))
    .innerJoin(events, eq(categories.eventId, events.id))
    .where(and(eq(contestants.code, code), eq(events.isActive, true)));
  return row ?? null;
}

// Matches the exact flow promised in the app's own "Vote via USSD" instructions
// (src/components/VoteUSSD.tsx): enter nominee code -> enter vote count -> confirm
// -> wait for SMS. Reached via the main menu's option 1 (see router.ts).
//
// This is a pure step function -- it owns no session storage itself. The router
// passes in the CURRENT step state (or null on first entry into this service)
// and this function returns the next state; router.ts persists/clears it. `text`
// is only ever read by the router as "whatever the caller just typed for the
// CURRENT step" (see router.ts's comment on why), so `latestInput` here is always
// a single value, never an accumulated "*"-joined string.
export async function handleEventsVotingStep(params: {
  state: EventsVotingState | null;
  latestInput: string;
  phoneNumber: string;
}): Promise<UssdStepResult> {
  const { state, latestInput, phoneNumber } = params;

  // Entry into this service (just selected "1" from the main menu).
  if (!state) {
    return {
      message: 'Enter Nominee Code:',
      continueSession: true,
      nextState: { step: 'awaiting_code' },
    };
  }

  // Nominee code was just entered (or came in the dial string, see router.ts).
  if (state.step === 'awaiting_code') {
    const matches = await resolveNomineeCode(latestInput);
    if (matches.length === 0) {
      return { message: 'Invalid or inactive nominee code. Please check the code and try again.', continueSession: false };
    }
    if (matches.length === 1) return askForVotes(matches[0]);
    if (matches.length > MAX_PICK) {
      return { message: 'Several nominees match those digits. Please dial again with the full nominee code from the voting page.', continueSession: false };
    }
    return {
      message: `Choose your nominee:\n${matches.map((m, i) => `${i + 1}. ${m.contestant.name} (${m.contestant.code})`).join('\n')}`,
      continueSession: true,
      nextState: { step: 'awaiting_pick', codes: matches.map((m) => m.contestant.code) },
    };
  }

  // A nominee was picked from the list of 4-digit matches.
  if (state.step === 'awaiting_pick') {
    const chosen = state.codes[parseInt(latestInput, 10) - 1];
    const row = chosen ? await lookupActiveContestant(chosen) : null;
    if (!row) return { message: 'Invalid choice. Please dial again.', continueSession: false };
    return askForVotes(row);
  }

  // Vote count was just entered.
  if (state.step === 'awaiting_votes') {
    const voteCount = parseInt(latestInput, 10);
    if (!Number.isInteger(voteCount) || voteCount < 1 || voteCount > MAX_VOTES) {
      return { message: `Invalid vote count. Enter a number between 1 and ${MAX_VOTES}.`, continueSession: false };
    }

    const row = await lookupActiveContestant(state.code);
    if (!row) {
      return { message: 'This nominee is no longer available. Please start over.', continueSession: false };
    }

    const unitPrice = row.event.unitPrice ?? 0;
    const totalAmount = unitPrice * voteCount;
    if (totalAmount <= 0) {
      return { message: 'This event does not have a valid vote price configured. Please contact support.', continueSession: false };
    }

    return {
      message: `Vote ${voteCount} time(s) for ${row.contestant.name}?\nTotal: GHS ${totalAmount.toFixed(2)}\n1. Confirm\n2. Cancel`,
      continueSession: true,
      nextState: { step: 'awaiting_confirm', code: state.code, voteCount },
    };
  }

  // Confirmation choice was just entered -- trigger the Mobile Money charge.
  const { code, voteCount } = state;

  if (latestInput !== '1') {
    return { message: 'Vote cancelled.', continueSession: false };
  }

  const row = await lookupActiveContestant(code);
  if (!row) {
    return { message: 'This nominee is no longer available. Please start over.', continueSession: false };
  }

  const unitPrice = row.event.unitPrice ?? 0;
  const totalAmount = unitPrice * voteCount;
  if (totalAmount <= 0) {
    return { message: 'This event does not have a valid vote price configured. Please contact support.', continueSession: false };
  }

  // Guard against the USSD gateway re-delivering the same confirmation request
  // (common on network retries) triggering a second, duplicate MoMo charge.
  const lock = await guardTransaction(phoneNumber, 45);
  if (!lock.isAllowed) {
    return { message: lock.message ?? 'A transaction is already in progress.', continueSession: false };
  }

  try {
    const chargeEmail = `ussd-${phoneNumber.replace(/[^0-9]/g, '')}-${Date.now().toString(36)}@heravote.com`;
    await initiateMomoCharge({
      email: chargeEmail,
      amountGhs: totalAmount,
      phone: phoneNumber,
      metadata: {
        contestantId: row.contestant.id,
        votes: voteCount,
        channel: 'USSD',
        phone: phoneNumber,
        nomineeName: row.contestant.name,
      },
    });
  } catch (err: any) {
    await releaseTransactionLock(phoneNumber);
    console.error('USSD momo charge initiation failed:', err?.message);
    return { message: 'Could not start the mobile money charge. Please try again shortly.', continueSession: false };
  }

  return {
    message: `Approve the Mobile Money prompt on your phone to complete payment of GHS ${totalAmount.toFixed(2)} for ${voteCount} vote(s). You will receive an SMS confirmation once your vote is counted.`,
    continueSession: false,
  };
}
