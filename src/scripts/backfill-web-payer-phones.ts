// One-off backfill: web vote transactions recorded before the payer fix have
// pay_phone set to the "web-checkout" placeholder (or the throwaway checkout
// email, or "unknown"). This looks each one up on Paystack by its payment
// reference and records the payer as Paystack reports it: the mobile money
// number, or the card used ("VISA ••••4081") for card payments.
//
// Run AFTER deploying the code that records the Paystack payer for new votes:
//
//   npx tsx --env-file=.env src/scripts/backfill-web-payer-phones.ts --dry-run
//   npx tsx --env-file=.env src/scripts/backfill-web-payer-phones.ts
//
// Options:
//   --dry-run   look up every row on Paystack but write nothing
//   --limit N   stop after N rows (useful for a first trial run)
//
// Read-only on Paystack (transaction/verify only). Idempotent and resumable:
// rows that get fixed stop matching, and rows Paystack can't resolve are left
// unchanged and reported. Uses PAYSTACK_SECRET_KEY, so a test key only finds
// test-mode payments and a live key only live ones.

import { and, asc, count, eq, gt, inArray, isNotNull, like, or } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { eventTransactions } from '../db/schema.ts';
import { paystackPayerContact } from '../server/paystack-payer.ts';

const PAGE_SIZE = 200;
const REQUEST_GAP_MS = 200; // ~5 lookups a second, well inside Paystack's rate limits
const MAX_RETRIES = 4;

const dryRun = process.argv.includes('--dry-run');
const limitArg = process.argv.indexOf('--limit');
const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;
if (!(limit > 0)) throw new Error('--limit must be a positive number.');

const needsPayer = and(
  eq(eventTransactions.channel, 'WEB'),
  isNotNull(eventTransactions.payRef),
  or(
    inArray(eventTransactions.payPhone, ['web-checkout', 'unknown', '']),
    like(eventTransactions.payPhone, '%@%'),
  ),
);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Logs only the tail of a payer: "•••987", "VISA ••••4081" stays as is. */
const masked = (v: string) => (v.includes('••••') ? v : `•••${v.slice(-3)}`);

type Lookup = { ok: true; payer: string } | { ok: false; reason: string };

async function lookup(secretKey: string, reference: string): Promise<Lookup> {
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${secretKey}` },
        signal: AbortSignal.timeout(15_000),
      });
    } catch (err: any) {
      if (attempt >= MAX_RETRIES) return { ok: false, reason: `network error: ${err?.message ?? err}` };
      await sleep(1000 * 2 ** attempt);
      continue;
    }
    if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
      const retryAfter = Number(res.headers.get('retry-after'));
      await sleep(retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt);
      continue;
    }
    const body: any = await res.json().catch(() => null);
    if (!res.ok || !body?.status) return { ok: false, reason: body?.message || `HTTP ${res.status}` };
    const data = body.data ?? {};
    if (data.reference !== reference) return { ok: false, reason: 'reference mismatch in Paystack response' };
    if (data.status !== 'success') return { ok: false, reason: `Paystack status "${data.status}"` };
    const payer = paystackPayerContact(data);
    if (payer === 'unknown') return { ok: false, reason: 'Paystack has no phone or card for this payment' };
    return { ok: true, payer };
  }
}

async function main() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey || /^sk_test_0+$/.test(secretKey)) throw new Error('PAYSTACK_SECRET_KEY is not set.');
  const mode = secretKey.startsWith('sk_live_') ? 'LIVE' : 'TEST';

  const [{ total }] = await db.select({ total: count() }).from(eventTransactions).where(needsPayer);
  console.log(`${total} web transaction(s) without a payer number. Paystack key: ${mode}.${dryRun ? ' Dry run, nothing written.' : ''}`);
  if (total === 0) return;

  let seen = 0, fixed = 0;
  const failures: { id: string; reference: string; reason: string }[] = [];
  let lastId: string | null = null;

  // Walk by id so rows that can't be resolved don't get fetched again.
  while (seen < limit) {
    const page = await db
      .select({ id: eventTransactions.id, payRef: eventTransactions.payRef })
      .from(eventTransactions)
      .where(lastId ? and(needsPayer, gt(eventTransactions.id, lastId)) : needsPayer)
      .orderBy(asc(eventTransactions.id))
      .limit(Math.min(PAGE_SIZE, limit - seen));
    if (page.length === 0) break;

    for (const row of page) {
      lastId = row.id;
      seen++;
      const reference = row.payRef as string;
      const result = await lookup(secretKey, reference);
      if (!result.ok) {
        failures.push({ id: row.id, reference, reason: result.reason });
      } else {
        if (!dryRun) {
          // Re-check the placeholder in the WHERE so a row changed meanwhile is never overwritten.
          await db.update(eventTransactions).set({ payPhone: result.payer }).where(and(eq(eventTransactions.id, row.id), needsPayer));
        }
        fixed++;
        if (dryRun) console.log(`  ${reference} -> ${masked(result.payer)}`);
      }
      if (seen % 25 === 0) console.log(`  checked ${seen}/${Math.min(total, limit)}: ${fixed} ${dryRun ? 'resolvable' : 'updated'}, ${failures.length} unresolved`);
      await sleep(REQUEST_GAP_MS);
    }
  }

  console.log(`Done. Checked ${seen}: ${fixed} ${dryRun ? 'would be updated' : 'updated'}, ${failures.length} left unchanged.`);
  for (const f of failures.slice(0, 50)) console.log(`  unchanged ${f.reference} (transaction ${f.id}): ${f.reason}`);
  if (failures.length > 50) console.log(`  ...and ${failures.length - 50} more.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exit(1);
  });
