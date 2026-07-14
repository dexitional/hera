import { handleElectionInviteStep } from './election-invite';
import { handleEventsVotingStep } from './events-voting';
import { clearUssdSession, getUssdSession, setUssdSession, type UssdSessionState } from './session-store';

const MAIN_MENU_MESSAGE =
  'Welcome to Heravote Platform. Choose a service:\n' +
  '1. Event voting - vote in an event.\n' +
  '2. Online Elections - Retrieve your Invite code.\n' +
  '3. Event Ticket - Buy an event ticket\n' +
  '4. Event Ticket - Retrieve an event ticket';

// Single entry point for every USSD session on the shortcode. Session step
// tracking lives server-side (session-store.ts, keyed by sessionId) rather than
// being derived from the gateway's `text` field -- see events-voting.ts's comment
// for why. `text` is only ever read here as "whatever the caller just typed for
// the CURRENT step" (the segment after the last "*" if present), never as
// accumulated history.
//
// ADDING A NEW SERVICE (tickets buy/verify, data bundle purchase, etc. -- options
// 3/4 above are reserved placeholders, currently "coming soon"):
// 1. Add its step-state shape to the UssdSessionState union in session-store.ts
//    (same shape as EventsVotingState/ElectionInviteState).
// 2. Write `src/server/ussd/<service>.ts` with a single pure step function (same
//    signature as handleEventsVotingStep/handleElectionInviteStep: takes
//    {state, latestInput, phoneNumber}, returns {message, continueSession,
//    nextState?}). Keep its own DB/payment logic in that file -- don't mix a
//    plain function into a createServerFn-only file (see paystack-credit.ts's
//    comment for why that broke the whole client bundle once).
// 3. Add a case for it below, both in the main-menu dispatch and as its own
//    top-level `session.service === '<name>'` branch.
export async function routeUssdSession(params: { sessionId: string; phoneNumber: string; text: string; isNewSession: boolean }): Promise<string> {
  const { sessionId, phoneNumber, text, isNewSession } = params;
  const segments = text.split('*');
  const latestInput = (segments[segments.length - 1] ?? '').trim();

  // A gateway-declared new session always wins, even if a stale session happens
  // to still be sitting in Redis for a reused sessionId.
  const session = isNewSession ? null : await getUssdSession(sessionId);

  // Brand new session: show the main menu and wait for a choice. Whatever
  // happened to be in `text` on this request is irrelevant/unreliable, so it's
  // intentionally ignored here.
  if (!session) {
    await setUssdSession(sessionId, { service: 'main_menu' });
    return `CON ${MAIN_MENU_MESSAGE}`;
  }

  // A choice from the main menu was just entered.
  if (session.service === 'main_menu') {
    if (latestInput === '1') {
      const result = await handleEventsVotingStep({ state: null, latestInput: '', phoneNumber });
      return persistAndFormat(sessionId, 'events_voting', result);
    }
    if (latestInput === '2') {
      const result = await handleElectionInviteStep({ state: null, latestInput: '', phoneNumber });
      return persistAndFormat(sessionId, 'election_invite', result);
    }
    if (latestInput === '3' || latestInput === '4') {
      await clearUssdSession(sessionId);
      return 'END This service is coming soon. Please check back later.';
    }
    // Forgiving UX: an invalid menu choice re-shows the menu rather than ending
    // the whole session over a typo.
    return `CON Invalid selection.\n${MAIN_MENU_MESSAGE}`;
  }

  if (session.service === 'events_voting') {
    const result = await handleEventsVotingStep({ state: session.state, latestInput, phoneNumber });
    return persistAndFormat(sessionId, 'events_voting', result);
  }

  if (session.service === 'election_invite') {
    const result = await handleElectionInviteStep({ state: session.state, latestInput, phoneNumber });
    return persistAndFormat(sessionId, 'election_invite', result);
  }

  await clearUssdSession(sessionId);
  return 'END A system error occurred. Please try again.';
}

async function persistAndFormat(
  sessionId: string,
  service: 'events_voting' | 'election_invite',
  result: { message: string; continueSession: boolean; nextState?: any },
): Promise<string> {
  if (result.continueSession && result.nextState) {
    await setUssdSession(sessionId, { service, state: result.nextState } as UssdSessionState);
  } else {
    await clearUssdSession(sessionId);
  }
  return `${result.continueSession ? 'CON' : 'END'} ${result.message}`;
}
