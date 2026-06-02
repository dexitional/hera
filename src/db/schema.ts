import { relations } from 'drizzle-orm';
import { pgTable, serial, text, integer, timestamp, varchar, boolean, doublePrecision, unique, index } from 'drizzle-orm/pg-core';

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
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  unitPrice: doublePrecision('unit_price'),
  paymentAmount: doublePrecision('payment_amount'),
  paymentDeduction: doublePrecision('payment_deduction'),
  isActive: boolean('is_active').default(true).notNull(),
  adminId: text('admin_id').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').references(() => events.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  code: text('code').notNull(), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  eventCodeUniq: unique().on(t.eventId, t.code) 
}));

export const contestants = pgTable('contestants', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  tagline: text('tagline').notNull(),
  order: integer('order'),
  imageUrl: text('image_url'),
  code: text('code').notNull(), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  categoryContestantCodeUniq: unique().on(t.categoryId, t.code)
}));

export const votes = pgTable('votes', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').references(() => events.id, { onDelete: 'cascade' }).notNull(),
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'cascade' }).notNull(),
  contestantId: integer('contestant_id').references(() => contestants.id, { onDelete: 'cascade' }).notNull(),
  voterPhone: text('voter_phone').notNull(),
  voteCount: integer('vote_count').default(1).notNull(),
  channel: text('channel').notNull(), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  voterPhoneIdx: index('votes_voter_phone_idx').on(t.voterPhone),
  contestantVotesIdx: index('votes_contestant_idx').on(t.contestantId)
}));

// ==========================================
// ELECTION APP TABLES 
// ==========================================
export const elections = pgTable('elections', {
  id: serial('id').primaryKey(),
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
  showFeed: boolean('show_feed').default(false).notNull(),
  isActive: boolean('is_active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const positions = pgTable('positions', {
  id: serial('id').primaryKey(),
  electionId: integer('election_id').references(() => elections.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  order: integer('order'),
  slots: integer('slots').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const candidates = pgTable('candidates', {
  id: serial('id').primaryKey(),
  positionId: integer('position_id').references(() => positions.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  teaser: text('teaser'),
  order: integer('order'),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const voters = pgTable('voters', {
  id: serial('id').primaryKey(),
  electionId: integer('election_id').references(() => elections.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(), 
  username: varchar('username', { length: 50 }).notNull(), 
  phoneNumber: text('phone_number').notNull(),
  email: text('email').notNull(),
  inviteToken: varchar('invite_token', { length: 64 }).notNull().unique(),
  isVerified: boolean('is_verified').default(false).notNull(),
  hasVoted: boolean('has_voted').default(false).notNull(),
  invitedAt: timestamp('invited_at').defaultNow().notNull(),
}, (t) => ({
  electionEmailUniq: unique().on(t.electionId, t.email),
  electionUsernameUniq: unique().on(t.electionId, t.username),
}));

export const electionVotes = pgTable('election_votes', {
  id: serial('id').primaryKey(),
  electionId: integer('election_id').references(() => elections.id, { onDelete: 'cascade' }).notNull(),
  positionId: integer('position_id').references(() => positions.id, { onDelete: 'cascade' }).notNull(),
  // candidateId is nullable to natively represent explicit voter abstentions
  candidateId: integer('candidate_id').references(() => candidates.id, { onDelete: 'cascade' }), 
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
  votes: many(votes), // Secure fix: Allows finding total votes within an event container
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  event: one(events, {
    fields: [categories.eventId],
    references: [events.id],
  }),
  contestants: many(contestants),
  votes: many(votes),
}));

export const contestantsRelations = relations(contestants, ({ one, many }) => ({
  category: one(categories, {
    fields: [contestants.categoryId],
    references: [categories.id],
  }),
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  event: one(events, {
    fields: [votes.eventId],
    references: [events.id],
  }),
  category: one(categories, {
    fields: [votes.categoryId],
    references: [categories.id],
  }),
  contestant: one(contestants, {
    fields: [votes.contestantId],
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
