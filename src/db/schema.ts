import { relations, sql } from 'drizzle-orm';
import { pgTable, uuid, text, integer, timestamp, varchar, boolean, doublePrecision, unique, index, uniqueIndex, jsonb } from 'drizzle-orm/pg-core';
import { uuidv7 } from '../lib/uuid';

// ==========================================
// BETTER AUTH REQUIRED CORE TABLES
// ==========================================
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  role: text("role").notNull().default("user"),
  phone: text("phone"),
  organization: text("organization"),
  jobTitle: text("job_title"),
  address: text("address"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  impersonatedBy: text('impersonated_by'),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

// ==========================================
//  EVENTS APP TABLES 
// ==========================================
export const events = pgTable('events', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  title: text('title').notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url'),
  startAt: timestamp('start_at', { mode: 'date' }),
  endAt: timestamp('end_at', { mode: 'date' }),
  unitPrice: doublePrecision('unit_price'),
  paymentAmount: doublePrecision('payment_amount'),
  paymentDeduction: doublePrecision('payment_deduction'),
  isActive: boolean('is_active').default(false).notNull(),
  adminId: text('admin_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  eventId: uuid('event_id').references(() => events.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  code: text('code').notNull(), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  eventCodeUniq: unique().on(t.eventId, t.code) 
}));

export const contestants = pgTable('contestants', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  tagline: text('tagline').notNull(),
  order: integer('order'),
  imageUrl: text('image_url'),
  code: text('code').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const eventTransactions = pgTable('event_transactions', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  contestantId: uuid('contestant_id').references(() => contestants.id, { onDelete: 'cascade' }).notNull(),
  payAmount: doublePrecision('pay_amount'),
  payStatus: boolean('pay_status').default(false).notNull(), 
  payRef: text('pay_ref'), 
  payPhone: text('pay_phone').notNull(),
  transRef: text('trans_ref'), 
  votes: integer('votes').default(0).notNull(),
  channel: text('channel').notNull(), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  voterPhoneIdx: index('trans_voter_phone_idx').on(t.payPhone),
  contestantVotesIdx: index('event_contestant_idx').on(t.contestantId),
  // Enforces idempotency at the DB level: a given Paystack reference can only ever
  // be credited once, even under concurrent requests (e.g. the client's verify call
  // and the webhook firing for the same charge at nearly the same time). Partial
  // (WHERE pay_ref IS NOT NULL) so manually-entered admin transactions without a
  // payRef are unaffected.
  payRefUniqueIdx: uniqueIndex('event_transactions_pay_ref_uniq_idx').on(t.payRef).where(sql`${t.payRef} is not null`),
}));

// ==========================================
// ELECTION APP TABLES 
// ==========================================
export const elections = pgTable('elections', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  adminId: text('admin_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  tag: text('tag').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  startAt: timestamp('start_at', { mode: 'date' }),
  endAt: timestamp('end_at', { mode: 'date' }),
  imageUrl: text('image_url'),
  billVoters: integer('bill_voters'),
  billAmount: doublePrecision('bill_amount'),
  billPaid: boolean('bill_paid').default(false).notNull(),
  authMode: text('auth_mode'), 
  status: text('status').default('staged').notNull(), 
  autoStop: boolean('auto_stop').default(false).notNull(),
  autoSync: boolean('auto_sync').default(false).notNull(),
  makePublic: boolean('make_public').default(false).notNull(),
  publicToken: text('public_token'),
  showFeed: boolean('show_feed').default(false).notNull(),
  isActive: boolean('is_active').default(false).notNull(),
  // Custom labels for the username/password inputs shown on the voter login
  // page (/vote/election) when authMode is 'credential'.
  placeholder: jsonb('placeholder').$type<{ username: string; password: string }>()
    .default({ username: 'Username', password: 'Password' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const positions = pgTable('positions', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  electionId: uuid('election_id').references(() => elections.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  order: integer('order'),
  slots: integer('slots').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const candidates = pgTable('candidates', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  positionId: uuid('position_id').references(() => positions.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  teaser: text('teaser'),
  order: integer('order'),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const voters = pgTable('voters', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  electionId: uuid('election_id').references(() => elections.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(), 
  username: varchar('username', { length: 50 }).notNull(), 
  phoneNumber: text('phone_number').notNull(),
  email: text('email').notNull(),
  voteIp: text('vote_ip'),
  inviteToken: varchar('invite_token', { length: 64 }).notNull().unique(),
  isVerified: boolean('is_verified').default(false).notNull(),
  hasVoted: boolean('has_voted').default(false).notNull(),
  invitedAt: timestamp('invited_at').defaultNow().notNull(),
}, (t) => ({
  electionEmailUniq: unique().on(t.electionId, t.email),
  electionUsernameUniq: unique().on(t.electionId, t.username),
}));

export const electionVotes = pgTable('election_votes', {
  id: uuid('id').primaryKey().$defaultFn(() => uuidv7()),
  electionId: uuid('election_id').references(() => elections.id, { onDelete: 'cascade' }).notNull(),
  positionId: uuid('position_id').references(() => positions.id, { onDelete: 'cascade' }).notNull(),
  candidateId: uuid('candidate_id').references(() => candidates.id, { onDelete: 'cascade' }),
  receiptSignature: text('receipt_signature').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  electionVotesPerfIdx: index('election_votes_lookup_idx').on(t.electionId, t.positionId)
}));



// ==========================================
// 1. BETTER & SYSTEM AUTH CORE RELATIONS
// ==========================================

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  events: many(events),       // Admin owns many events
  elections: many(elections), // Admin owns many elections
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// Optional: Kept for reference in case you reactivate the userProfiles table
// export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
//   user: one(user, {
//     fields: [userProfiles.userId],
//     references: [user.id],
//   }),
// }));


// ==========================================
// 2. EVENTS APP RELATIONS
// ==========================================

export const eventsRelations = relations(events, ({ one, many }) => ({
  admin: one(user, {
    fields: [events.adminId],
    references: [user.id],
  }),
  categories: many(categories),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  event: one(events, {
    fields: [categories.eventId],
    references: [events.id],
  }),
  contestants: many(contestants),
}));

export const contestantsRelations = relations(contestants, ({ one, many }) => ({
  category: one(categories, {
    fields: [contestants.categoryId],
    references: [categories.id],
  }),
  transactions: many(eventTransactions),
}));

export const eventTransactionsRelations = relations(eventTransactions, ({ one }) => ({
  contestant: one(contestants, {
    fields: [eventTransactions.contestantId],
    references: [contestants.id],
  }),
}));


// ==========================================
// 3. ELECTION APP RELATIONS
// ==========================================

export const electionsRelations = relations(elections, ({ one, many }) => ({
  admin: one(user, {
    fields: [elections.adminId],
    references: [user.id],
  }),
  positions: many(positions),
  voters: many(voters),
  electionVotes: many(electionVotes),
}));

export const positionsRelations = relations(positions, ({ one, many }) => ({
  election: one(elections, {
    fields: [positions.electionId],
    references: [elections.id],
  }),
  candidates: many(candidates),
  electionVotes: many(electionVotes),
}));

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  position: one(positions, {
    fields: [candidates.positionId],
    references: [positions.id],
  }),
  electionVotes: many(electionVotes),
}));

export const votersRelations = relations(voters, ({ one }) => ({
  election: one(elections, {
    fields: [voters.electionId],
    references: [elections.id],
  }),
}));

export const electionVotesRelations = relations(electionVotes, ({ one }) => ({
  election: one(elections, {
    fields: [electionVotes.electionId],
    references: [elections.id],
  }),
  position: one(positions, {
    fields: [electionVotes.positionId],
    references: [positions.id],
  }),
  candidate: one(candidates, {
    fields: [electionVotes.candidateId],
    references: [candidates.id],
  }),
}));
