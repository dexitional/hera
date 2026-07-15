import { and, eq, or, sql } from 'drizzle-orm';
import { db } from '../../db';
import { elections, voters } from '../../db/schema';
import { addCountryCode, addZeroPrefix, stripCountryCode } from '../../lib/utils';
import type { ElectionInviteState } from './session-store';

export type UssdStepResult = {
  message: string;
  continueSession: boolean;
  nextState?: ElectionInviteState;
};

// Reached via the main menu's option 2. Looks a voter up by username + the
// phone number the USSD session itself is running on (no password/OTP step --
// the phone number IS the credential here, matching how a voter would already
// be registered), and returns their invite code if it exists and their election
// is currently active and paid for. Username is only unique per-election (see
// schema.ts), so a phone+username pair can in principle match more than one
// election; we surface the first one that's active and paid.
export async function handleElectionInviteStep(params: {
  state: ElectionInviteState | null;
  latestInput: string;
  phoneNumber: string;
}): Promise<UssdStepResult> {
  const { state, latestInput, phoneNumber } = params;

  // Entry into this service (just selected "2" from the main menu).
  if (!state) {
    return {
      message: 'Enter your voter username:',
      continueSession: true,
      nextState: { step: 'awaiting_username' },
    };
  }

  // Username was just entered.
  const username = latestInput.trim();
  if (!username) {
    return { message: 'Invalid username. Please dial the shortcode again and try once more.', continueSession: false };
  }

  const cleanUsername = username.toLowerCase().replace(/\s+/g, '');
  const phoneWithCode = addCountryCode(phoneNumber);
  const phoneWithoutCode = stripCountryCode(phoneNumber);
  const phoneWithZero = addZeroPrefix(phoneNumber);

  const matches = await db
    .select({ voter: voters, election: elections })
    .from(voters)
    .innerJoin(elections, eq(voters.electionId, elections.id))
    .where(
      and(
        eq(sql`LOWER(REPLACE(${voters.username}, ' ', ''))`, cleanUsername),
        or(eq(voters.phoneNumber, phoneWithCode), eq(voters.phoneNumber, phoneWithoutCode), eq(voters.phoneNumber, phoneWithZero)),
      ),
    );

  if (matches.length === 0) {
    return {
      message: 'No voter record was found for this username and phone number. Please contact your election administrator.',
      continueSession: false,
    };
  }

  const activePaid = matches.find((m) => m.election.isActive && m.election.billPaid);
  if (!activePaid) {
    return {
      message: 'Your election is not currently active. Please contact your election administrator.',
      continueSession: false,
    };
  }

  const isClosed = matches.find((m:any) =>  new Date() > new Date(m?.election?.endAt));
  if (isClosed) {
    return {
      message: 'Your election is currently ended. Please contact your election administrator.',
      continueSession: false,
    };
  }

  const isVoted = matches.find((m) => m.voter.hasVoted );
  if (isVoted) {
    return {
      message: 'Your vote is already registered. Please contact your election administrator.',
      continueSession: false,
    };
  }

  return {
    message: `Your invite code for ${activePaid.election.title} is: ${activePaid.voter.inviteToken}`,
    continueSession: false,
  };
}
