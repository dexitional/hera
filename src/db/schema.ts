import { relations } from 'drizzle-orm';
import { pgTable, serial, text, integer, timestamp, varchar, boolean, doublePrecision } from 'drizzle-orm/pg-core';

// ==========================================
// BETTER AUTH REQUIRED CORE TABLES
// ==========================================
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  phone: text('phone').notNull().unique(),
  paystackCustomerCode: text('paystack_customer_code'),
  isSubscribed: boolean('is_subscribed').default(false).notNull(),
  subscriptionPlan: text('subscription_plan'),
  image: text('image'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
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
//  GENERAL TABLES 
// ==========================================

// export const users = pgTable('users', {
//   id: serial('id').primaryKey(),
//   email: text('email').notNull().unique(),
//   phone: text('phone').notNull().unique(),
//   paystackCustomerCode: text('paystack_customer_code'),
//   isSubscribed: boolean('is_subscribed').default(false).notNull(),
//   subscriptionPlan: text('subscription_plan'),
// }); 

// export const userProfiles = pgTable('user_profiles', {
//   id: serial('id').primaryKey(),
//   userId: text('user_id').notNull(),
//   avatarUrl: text('avatar_url'), // Stores the CDN/S3 image link
// });


// export const organizations = pgTable('organizations', {
//   id: serial('id').primaryKey(),
//   name: text('name').notNull(),
//   imageUrl: text('image_url'),
//   email: text('email').notNull().unique(),
//   phone: text('phone').notNull().unique(),
// });


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
  isActive: integer('is_active').default(1).notNull(),
  adminId: text('admin_id').references(() => user.id, { onDelete: 'cascade' }).notNull(), // Linked to Better Auth User
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').references(() => events.id).notNull(),
  name: text('name').notNull(), // e.g., "Artist of the Year", "Best Rapper"
  description: text('description').notNull(),
  code: text('code').notNull(), // e.g., "1", "2"
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const contestants = pgTable('contestants', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').references(() => categories.id).notNull(),
  name: text('name').notNull(),
  tagline: text('tagline').notNull(),
  order: integer('order'),
  imageUrl: text('image_url'),
  code: text('code').notNull(), // e.g., "1", "2"
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const votes = pgTable('votes', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').notNull(),
  categoryId: integer('category_id').references(() => categories.id).notNull(),
  contestantId: integer('contestant_id').references(() => contestants.id).notNull(),
  voterPhone: text('voter_phone').notNull(),
  voteCount: integer('vote_count').default(1).notNull(),
  channel: text('channel').notNull(), // "USSD" or "WEB"
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ==========================================
// ELECTION APP TABLES 
// ==========================================

export const elections = pgTable('elections', {
  id: serial('id').primaryKey(),
  adminId: text('admin_id').references(() => user.id, { onDelete: 'cascade' }).notNull(), // Linked to Better Auth User
  tag: text('tag').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  startAt: timestamp('start_at').notNull(),
  endAt: timestamp('end_at').notNull(),
  imageUrl: text('image_url'),
  billVoters: integer('bill_voters'),
  billAmount: doublePrecision('bill_amount'),
  billPaid: boolean('bill_paid').default(false).notNull(),
  authMode: text('auth_mode'), // google, credential, otp, 
  status: text('status').default('staged').notNull(), // staged, started, ended, 
  makePublic: boolean('make_public').default(false).notNull(),
  showFeed: boolean('show_feed').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
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
  name: text('name').notNull(), // e.g. "Kwame Mensah"
  username: varchar('username', { length: 50 }).notNull(), // e.g. "kwame_m"
  phoneNumber: text('phone_number').notNull(),
  email: text('email').notNull().unique(),
  inviteToken: varchar('invite_token', { length: 64 }).notNull().unique(),
  isVerified: boolean('is_verified').default(false).notNull(),
  hasVoted: boolean('has_voted').default(false).notNull(),
  invitedAt: timestamp('invited_at').defaultNow().notNull(),
});

export const electionVotes = pgTable('election_votes', {
  id: serial('id').primaryKey(),
  electionId: integer('election_id').references(() => elections.id, { onDelete: 'cascade' }).notNull(),
  positionId: integer('position_id').references(() => positions.id, { onDelete: 'cascade' }).notNull(),
  candidateId: integer('candidate_id').references(() => candidates.id, { onDelete: 'cascade' }).notNull(),
  receiptSignature: text('receipt_signature').notNull(), // Digital cryptographic signature hash string
  createdAt: timestamp('created_at').defaultNow().notNull(),
});





// ==========================================
// ELECTION APP RELATIONS
// ==========================================

export const electionsRelations = relations(elections, ({ many }) => ({
  positions: many(positions),
  voters: many(voters),
  electionVotes: many(electionVotes),
}));

export const positionsRelations = relations(positions, ({ one, many }) => ({
  election: one(elections, {
    fields: [positions.electionId],
    references: [elections.id],
  }),
  candidates: many(candidates), // 👈 This fixes your exact error!
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


// ==========================================
// EVENTS APP RELATIONS
// ==========================================

export const eventsRelations = relations(events, ({ many }) => ({
  categories: many(categories),
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
  category: one(categories, {
    fields: [votes.categoryId],
    references: [categories.id],
  }),
  contestant: one(contestants, {
    fields: [votes.contestantId],
    references: [contestants.id],
  }),
}));