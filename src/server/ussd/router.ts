import { handleEventsVotingUssd } from './events-voting';

// Single entry point for every USSD session on the shortcode. Only one service
// (events voting) is registered today, matching the exact flow promised in
// VoteUSSD.tsx (dial -> enter nominee code directly, no menu). This is
// deliberate, not an oversight -- see the note below for how to add more.
//
// ADDING A NEW SERVICE LATER (tickets buy/verify, data bundle purchase, etc.):
// Once there is more than one service on this shortcode, step 1 needs to become
// a real menu ("1. Vote  2. Buy Tickets  3. Buy Data") and `steps[0]` becomes the
// service selector instead of being handed straight to events-voting. At that
// point: write a new `src/server/ussd/<service>.ts` module (same shape as
// events-voting.ts: a single async function taking {sessionId, phoneNumber, text}
// and returning the raw "CON ..."/"END ..." string), add it to the dispatch
// below keyed by menu choice, and shift each service's own step-parsing to treat
// `steps.slice(1)` as its own local step list. Keep each service's DB/payment
// logic in its own file -- don't mix a plain function into a createServerFn-only
// file (see paystack-credit.ts's comment for why that broke the whole client
// bundle once).
export async function routeUssdSession(params: { sessionId: string; phoneNumber: string; text: string }): Promise<string> {
  return handleEventsVotingUssd(params);
}
