import { and, eq } from 'drizzle-orm';
import { db } from '../../db';
import { categories, contestants, events } from '../../db/schema';
import { guardTransaction, releaseTransactionLock } from '../../middleware/idempotency';
import { initiateMomoCharge } from '../paystack-momo';

const MAX_VOTES = 1000;

// Matches the exact flow promised in the app's own "Vote via USSD" instructions
// (src/components/VoteUSSD.tsx): dial the shortcode -> enter nominee code -> enter
// vote count -> confirm -> wait for SMS. Session state is entirely reconstructed
// from Arkesel's accumulated `text` field (e.g. "A3243*3*1") on every request --
// USSD gateways don't give you a server-side session store, only a sessionId to
// correlate requests, so each step re-derives everything it needs from `text`.
export async function handleEventsVotingUssd(params: { sessionId: string; phoneNumber: string; text: string }): Promise<string> {
  const { phoneNumber, text } = params;
  const steps = text === '' ? [] : text.split('*');

  // Step 1: prompt for the nominee code.
  if (steps.length === 0) {
    return 'CON Welcome to Heravote Voting\nEnter Nominee Code:';
  }

  const code = steps[0].trim().toUpperCase();
  const [row] = await db
    .select({ contestant: contestants, category: categories, event: events })
    .from(contestants)
    .innerJoin(categories, eq(contestants.categoryId, categories.id))
    .innerJoin(events, eq(categories.eventId, events.id))
    .where(and(eq(contestants.code, code), eq(events.isActive, true)));

  if (!row) {
    return 'END Invalid or inactive nominee code. Please check the code and try again.';
  }

  const unitPrice = row.event.unitPrice ?? 0;

  // Step 2: prompt for vote count.
  if (steps.length === 1) {
    return `CON Voting for: ${row.contestant.name}\n${row.category.name} - ${row.event.title}\nEnter number of votes (GHS ${unitPrice.toFixed(2)} each):`;
  }

  const voteCount = parseInt(steps[1], 10);
  if (!Number.isInteger(voteCount) || voteCount < 1 || voteCount > MAX_VOTES) {
    return `END Invalid vote count. Enter a number between 1 and ${MAX_VOTES}.`;
  }

  const totalAmount = unitPrice * voteCount;

  // Step 3: confirm.
  if (steps.length === 2) {
    return `CON Vote ${voteCount} time(s) for ${row.contestant.name}?\nTotal: GHS ${totalAmount.toFixed(2)}\n1. Confirm\n2. Cancel`;
  }

  // Step 4: process confirmation and trigger the Mobile Money charge.
  const confirmChoice = steps[2];
  if (confirmChoice !== '1') {
    return 'END Vote cancelled.';
  }

  if (totalAmount <= 0) {
    return 'END This event does not have a valid vote price configured. Please contact support.';
  }

  // Guard against the USSD gateway re-delivering the same confirmation request
  // (common on network retries) triggering a second, duplicate MoMo charge.
  const lock = await guardTransaction(phoneNumber, 45);
  if (!lock.isAllowed) {
    return `END ${lock.message}`;
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
    return 'END Could not start the mobile money charge. Please try again shortly.';
  }

  return `END Approve the Mobile Money prompt on your phone to complete payment of GHS ${totalAmount.toFixed(2)} for ${voteCount} vote(s). You will receive an SMS confirmation once your vote is counted.`;
}
