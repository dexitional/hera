import { handleElectionInviteStep } from './election-invite';
import { handleEventsVotingStep } from './events-voting';
import { clearUssdSession, getUssdSession, setUssdSession, type UssdSessionState } from './session-store';
import { USSD_SHORTCODE } from '../../lib/utils';

// Digits of the platform shortcode, e.g. "*928*330#" -> ["928", "330"].
const SHORTCODE_PARTS = USSD_SHORTCODE.replace(/[*#]+/g, ' ').trim().split(/\s+/);

/**
 * What the caller dialed after the platform shortcode, as separate options:
 *   "*928*330#"          -> []
 *   "*928*330*1#"        -> ["1"]
 *   "*928*330*1*23445#"  -> ["1", "23445"]
 * Gateways that send only the extra part ("1*23445") are handled too.
 */
export function parseDialShortcut(text: string): string[] {
  const parts = String(text ?? '')
    .trim()
    .replace(/#+$/, '')
    .split('*')
    .map((p) => p.trim())
    .filter(Boolean);
  const hasShortcode = SHORTCODE_PARTS.every((p, i) => parts[i] === p);
  return hasShortcode ? parts.slice(SHORTCODE_PARTS.length) : parts;
}

const MAIN_MENU_MESSAGE =
  'Heravote.com\n\n' +
  '1. Vote\n' +
  '2. Invite Code\n' +
  '3. Ticket\n';

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
    // Dial shortcuts: *928*330*1# opens voting, *928*330*1*<nominee code>#
    // jumps straight to that nominee's vote count, *928*330*2# opens the
    // election invite service. Anything else shows the main menu.
    // Only a fresh dial carries a shortcut: a reply arriving after its session
    // expired (e.g. "2") must show the menu, not open a service.
    const isDial = isNewSession || text.trim().startsWith('*');
    const [service, nomineeCode] = isDial ? parseDialShortcut(text) : [];
    if (service === '1') {
      const result = nomineeCode
        ? await handleEventsVotingStep({ state: { step: 'awaiting_code' }, latestInput: nomineeCode, phoneNumber })
        : await handleEventsVotingStep({ state: null, latestInput: '', phoneNumber });
      return persistAndFormat(sessionId, 'events_voting', result);
    }
    if (service === '2') {
      const result = await handleElectionInviteStep({ state: null, latestInput: '', phoneNumber });
      return persistAndFormat(sessionId, 'election_invite', result);
    }
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
