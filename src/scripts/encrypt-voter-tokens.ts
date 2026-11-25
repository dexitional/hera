// One-off backfill: converts legacy plaintext voter tokens (voters.invite_token)
// into token_hash + token_enc and clears the plaintext column.
//
// Run AFTER migration 0017 and AFTER deploying the code that reads token_hash
// (that code falls back to invite_token for unconverted rows, so voters can
// log in throughout):
//
//   npx tsx --env-file=.env src/scripts/encrypt-voter-tokens.ts --dry-run
//   npx tsx --env-file=.env src/scripts/encrypt-voter-tokens.ts
//
// Idempotent and resumable: only rows with token_hash IS NULL are touched,
// in batches, each batch in its own transaction.

import { and, count, eq, isNotNull, isNull } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { voters } from '../db/schema.ts';
import { decryptToken, hashToken, tokenColumns } from '../server/voter-token.ts';

const BATCH_SIZE = 500;
const dryRun = process.argv.includes('--dry-run');

const pending = and(isNull(voters.tokenHash), isNotNull(voters.inviteToken));

async function main() {
  // Fail fast (before touching anything) if VOTER_TOKEN_KEY is missing/invalid.
  const probe = 'key-check';
  if (decryptToken(tokenColumns(probe).tokenEnc) !== probe) throw new Error('VOTER_TOKEN_KEY self-test failed.');

  const [{ total }] = await db.select({ total: count() }).from(voters).where(pending);
  console.log(`${total} voter token(s) to convert${dryRun ? ' (dry run, nothing written)' : ''}.`);
  if (dryRun || total === 0) return;

  let converted = 0;
  for (;;) {
    const batch = await db
      .select({ id: voters.id, inviteToken: voters.inviteToken })
      .from(voters)
      .where(pending)
      .limit(BATCH_SIZE);
    if (batch.length === 0) break;

    await db.transaction(async (tx) => {
      for (const row of batch) {
        const plaintext = row.inviteToken as string;
        const cols = tokenColumns(plaintext);
        // Verify before discarding the plaintext.
        if (decryptToken(cols.tokenEnc) !== plaintext || cols.tokenHash !== hashToken(plaintext)) {
          throw new Error(`Round-trip check failed for voter ${row.id}; batch rolled back.`);
        }
        await tx.update(voters).set(cols).where(eq(voters.id, row.id));
      }
    });

    converted += batch.length;
    console.log(`  converted ${converted}/${total}`);
  }

  const [{ remaining }] = await db.select({ remaining: count() }).from(voters).where(isNotNull(voters.inviteToken));
  console.log(`Done. Plaintext tokens remaining: ${remaining}.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Backfill failed:', err);
    process.exit(1);
  });
