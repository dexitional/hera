import Redis from 'ioredis';

// Server-side USSD session memory. We cannot rely on the gateway's `text` field
// accumulating cleanly across steps -- Arkesel's actual behavior here has proven
// inconsistent with its own documentation (wrong response format, wrong request
// content-type, and unreliable step tracking all surfaced against the live
// simulator). Tracking exactly what step each sessionId is on ourselves removes
// that dependency entirely: each request only needs to supply *this step's* input,
// and we already know what to do with it.
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// USSD sessions are short-lived (gateways themselves typically time out a stalled
// session well under this); this is just a safety net against orphaned keys.
const SESSION_TTL_SECONDS = 180;

const keyFor = (sessionId: string) => `ussd:session:${sessionId}`;

export type EventsVotingState =
  | { step: 'awaiting_code' }
  | { step: 'awaiting_votes'; code: string }
  | { step: 'awaiting_confirm'; code: string; voteCount: number };

export type ElectionInviteState = { step: 'awaiting_username' };

// Top-level session shape: which service (if any) has been selected from the
// main menu, plus that service's own step state. Adding a new service later
// (tickets buy/verify, data bundle) means adding one more variant here and one
// more case in router.ts -- see router.ts's comment for the full checklist.
export type UssdSessionState =
  | { service: 'main_menu' }
  | { service: 'events_voting'; state: EventsVotingState }
  | { service: 'election_invite'; state: ElectionInviteState };

export async function getUssdSession(sessionId: string): Promise<UssdSessionState | null> {
  const raw = await redis.get(keyFor(sessionId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UssdSessionState;
  } catch {
    return null;
  }
}

export async function setUssdSession(sessionId: string, state: UssdSessionState): Promise<void> {
  await redis.set(keyFor(sessionId), JSON.stringify(state), 'EX', SESSION_TTL_SECONDS);
}

export async function clearUssdSession(sessionId: string): Promise<void> {
  await redis.del(keyFor(sessionId));
}
