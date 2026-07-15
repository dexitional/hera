import { authMiddleware } from '#/middleware/authMiddleware';
import { createServerFn } from '@tanstack/react-start';
import { and, asc, count, desc, eq, ilike, or, sql } from 'drizzle-orm';
import XLSX from 'xlsx-js-style';
import { db } from '../db';
import { categories, contestants, events, eventTransactions } from '../db/schema';
import { arcjetMiddleware } from '#/middleware/arcjetMiddleware';
import { generateContestantCode } from '#/lib/utils';
import { creditCardVote } from './paystack-credit';
import { processImageUpload } from './image-upload';

// ==========================================
// EVENTS FUNCTIONS
// ==========================================

// Public, unauthenticated listing for the voter-facing events directory.
export const getActiveEventsFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware])
  .handler(async () => {
    return await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        imageUrl: events.imageUrl,
        startAt: events.startAt,
        endAt: events.endAt,
        unitPrice: events.unitPrice,
        isActive: events.isActive,
        categoriesCount: sql<number>`count(${categories.id})::int`,
      })
      .from(events)
      .leftJoin(categories, eq(categories.eventId, events.id))
      .where(eq<any>(events.isActive, true))
      .groupBy(events.id)
      .orderBy(desc(events.createdAt));
  });

// Public, unauthenticated single-event overview for the voter-facing event landing page.
export const getPublicEventFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware])
  .handler(async ({ data: eventId }: any) => {
    const [eventRecord] = await db
      .select()
      .from(events)
      .where(and(eq<any>(events.id, eventId), eq<any>(events.isActive, true)));

    if (!eventRecord) {
      throw new Error(`Event [${eventId}] not found or not currently active.`);
    }

    const categoryRows = await db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        code: categories.code,
        contestantsCount: sql<number>`count(${contestants.id})::int`,
      })
      .from(categories)
      .leftJoin(contestants, eq(contestants.categoryId, categories.id))
      .where(eq<any>(categories.eventId, eventId))
      .groupBy(categories.id)
      .orderBy(asc(categories.createdAt));

    return {
      id: eventRecord.id,
      title: eventRecord.title,
      description: eventRecord.description,
      imageUrl: eventRecord.imageUrl,
      startAt: eventRecord.startAt,
      endAt: eventRecord.endAt,
      unitPrice: eventRecord.unitPrice,
      isActive: eventRecord.isActive,
      categories: categoryRows,
    };
  });

// Public, unauthenticated single-category overview (with contestants) for the voter-facing category page.
export const getPublicCategoryFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware])
  .handler(async ({ data: categoryId }: any) => {
    const [row] = await db
      .select({ category: categories, event: events })
      .from(categories)
      .innerJoin(events, eq(categories.eventId, events.id))
      .where(and(eq<any>(categories.id, categoryId), eq<any>(events.isActive, true)));

    if (!row) {
      throw new Error(`Category [${categoryId}] not found or not currently active.`);
    }

    const contestantRows = await db
      .select()
      .from(contestants)
      .where(eq<any>(contestants.categoryId, categoryId))
      .orderBy(asc(contestants.order));

    return {
      id: row.category.id,
      name: row.category.name,
      description: row.category.description,
      code: row.category.code,
      event: {
        id: row.event.id,
        title: row.event.title,
        startAt: row.event.startAt,
        endAt: row.event.endAt,
        unitPrice: row.event.unitPrice,
      },
      contestants: contestantRows.map((c) => ({
        id: c.id,
        name: c.name,
        tagline: c.tagline,
        imageUrl: c.imageUrl,
        code: c.code,
        order: c.order,
      })),
    };
  });

// Public, unauthenticated single-nominee profile for the voter-facing nominee page.
export const getPublicContestantFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware])
  .handler(async ({ data: contestantCode }: any) => {
    const code = String(contestantCode ?? '').toUpperCase();
    const [row] = await db
      .select({ contestant: contestants, category: categories, event: events })
      .from(contestants)
      .innerJoin(categories, eq(contestants.categoryId, categories.id))
      .innerJoin(events, eq(categories.eventId, events.id))
      .where(and(eq<any>(contestants.code, code), eq<any>(events.isActive, true)));

    if (!row) {
      throw new Error(`Nominee [${code}] not found or not currently active.`);
    }

    return {
      id: row.contestant.id,
      name: row.contestant.name,
      tagline: row.contestant.tagline,
      imageUrl: row.contestant.imageUrl,
      code: row.contestant.code,
      category: { id: row.category.id, name: row.category.name },
      event: {
        id: row.event.id,
        title: row.event.title,
        startAt: row.event.startAt,
        endAt: row.event.endAt,
        unitPrice: row.event.unitPrice,
      },
    };
  });

export const getEventsFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context }) => {
    const admin: any = context?.user;
    return await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        imageUrl: events.imageUrl,
        startAt: events.startAt,
        endAt: events.endAt,
        unitPrice: events.unitPrice,
        paymentAmount: events.paymentAmount,
        paymentDeduction: events.paymentDeduction,
        isActive: events.isActive,
        adminId: events.adminId,
        createdAt: events.createdAt,
        categoriesCount: sql<number>`count(${categories.id})::int`,
      })
      .from(events)
      .leftJoin(categories, eq(categories.eventId, events.id))
      .where(eq<any>(events.adminId, admin.id))
      .groupBy(events.id)
      .orderBy(desc(events.createdAt));
  });

export const getEventFn = createServerFn({ method: 'GET' }).middleware([arcjetMiddleware]).handler(
  async ({ data: eventId }: any) => {
    return await db.select().from(events).where(eq<any>(events.id, eventId));
  }
);

export const createEventFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin: any = context?.user;

    const imageUrl = await processImageUpload(data.get("image") as File | null, {
      folder: 'events',
      maxWidth: 1200,
      maxHeight: 675,
      fit: 'cover',
      quality: 80,
    });

    const [created] = await db.insert(events).values({
      title: data.get("title") as string,
      description: data.get("description") as string,
      startAt: data.get("startAt") ? new Date(data.get("startAt") as string) : null,
      endAt: data.get("endAt") ? new Date(data.get("endAt") as string) : null,
      unitPrice: data.get("unitPrice") ? Number(data.get("unitPrice")) : null,
      isActive: data.get("isActive") === "true",
      adminId: admin.id,
      ...(imageUrl && { imageUrl }),
    }).returning();
    return created;
  });

export const updateEventFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin: any = context?.user;

    const imageUrl = await processImageUpload(data.get("image") as File | null, {
      folder: 'events',
      maxWidth: 1200,
      maxHeight: 675,
      fit: 'cover',
      quality: 80,
    });

    const [updated] = await db
      .update(events)
      .set({
        title: data.get("title") as string,
        description: data.get("description") as string,
        startAt: data.get("startAt") ? new Date(data.get("startAt") as string) : null,
        endAt: data.get("endAt") ? new Date(data.get("endAt") as string) : null,
        unitPrice: data.get("unitPrice") ? Number(data.get("unitPrice")) : null,
        isActive: data.get("isActive") === "true",
        ...(imageUrl && { imageUrl }),
      })
      .where(and(eq<any>(events.id, data.get("id") as any), eq<any>(events.adminId, admin.id)))
      .returning();

    return updated;
  });

export const updateEventActiveStateFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin: any = context?.user;
    const { eventId, isActive } = data;

    const [updated] = await db
      .update(events)
      .set({ isActive: !!isActive })
      .where(and(eq<any>(events.id, eventId), eq<any>(events.adminId, admin.id)))
      .returning();

    return updated;
  });

export const deleteEventFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data: eventId }: any) => {
    const admin: any = context?.user;
    return await db
      .delete(events)
      .where(and(eq<any>(events.id, eventId), eq<any>(events.adminId, admin.id)))
      .returning();
  });

export const getEventOverviewFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data: eventId }: any) => {
    const admin: any = context?.user;

    const [eventRecord]: any = await db
      .select()
      .from(events)
      .where(and(eq<any>(events.id, eventId), eq<any>(events.adminId, admin.id)));

    if (!eventRecord) {
      throw new Error(`Event instance [${eventId}] not found.`);
    }

    const [
      [categoriesCountResult],
      [contestantsCountResult],
      [transactionsCountResult],
      [transactionTotals],
    ] = await Promise.all([
      db
        .select({ count: sql<number>`count(${categories.id})::int` })
        .from(categories)
        .where(eq<any>(categories.eventId, eventId)),
      db
        .select({ count: sql<number>`count(${contestants.id})::int` })
        .from(contestants)
        .innerJoin(categories, eq(contestants.categoryId, categories.id))
        .where(eq<any>(categories.eventId, eventId)),
      db
        .select({ count: sql<number>`count(${eventTransactions.id})::int` })
        .from(eventTransactions)
        .innerJoin(contestants, eq(eventTransactions.contestantId, contestants.id))
        .innerJoin(categories, eq(contestants.categoryId, categories.id))
        .where(eq<any>(categories.eventId, eventId)),
      db
        .select({
          totalPayAmount: sql<number>`coalesce(sum(${eventTransactions.payAmount}), 0)::int`,
          totalVotes: sql<number>`coalesce(sum(${eventTransactions.votes}), 0)::int`,
        })
        .from(eventTransactions)
        .innerJoin(contestants, eq(eventTransactions.contestantId, contestants.id))
        .innerJoin(categories, eq(contestants.categoryId, categories.id))
        .where(and(eq<any>(categories.eventId, eventId), eq(eventTransactions.payStatus, true))),
    ]);

    return {
      id: eventRecord.id,
      title: eventRecord.title,
      description: eventRecord.description,
      imageUrl: eventRecord.imageUrl,
      startAt: eventRecord.startAt ? eventRecord.startAt.toISOString() : null,
      endAt: eventRecord.endAt ? eventRecord.endAt.toISOString() : null,
      unitPrice: eventRecord.unitPrice,
      paymentAmount: transactionTotals?.totalPayAmount ?? 0,
      paymentDeduction: eventRecord.paymentDeduction,
      isActive: eventRecord.isActive,
      createdAt: eventRecord.createdAt ? eventRecord.createdAt.toISOString() : null,
      counts: {
        categories: categoriesCountResult?.count ?? 0,
        contestants: contestantsCountResult?.count ?? 0,
        transactions: transactionsCountResult?.count ?? 0,
        votesCast: transactionTotals?.totalVotes ?? 0,
      },
    };
  });


// ==========================================
// CATEGORY FUNCTIONS (events' equivalent of positions)
// ==========================================

export const getCategoriesFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin: any = context?.user;
    const eventId = data?.eventId ?? data;
    const page = Math.max(Number(data?.page) || 1, 1);
    const pageSize = Math.max(Number(data?.pageSize) || 15, 1);
    const searchQuery = (data?.searchQuery || '').trim();

    const limitValue = pageSize;
    const offsetValue = (page - 1) * limitValue;

    const conditions: any = [eq(events.adminId, admin.id), eq(events.id, eventId)];
    if (searchQuery) {
      conditions.push(ilike(categories.name, `%${searchQuery}%`));
    }
    const queryCondition = and(...conditions);

    const [rows, [countResult]] = await Promise.all([
      db
        .select({
          category: categories,
          event: events,
          contestantsCount: sql<number>`count(${contestants.id})::int`,
        })
        .from(categories)
        .innerJoin(events, eq(categories.eventId, events.id))
        .leftJoin(contestants, eq(contestants.categoryId, categories.id))
        .where(queryCondition)
        .groupBy(categories.id, events.id)
        .orderBy(asc(categories.createdAt))
        .limit(limitValue)
        .offset(offsetValue),
      db
        .select({ total: count() })
        .from(categories)
        .innerJoin(events, eq(categories.eventId, events.id))
        .where(queryCondition),
    ]);

    const totalCount = countResult?.total ?? 0;
    const totalPages = Math.max(Math.ceil(totalCount / limitValue), 1);

    return {
      categories: rows,
      pagination: { totalCount, totalPages, currentPage: page, pageSize: limitValue },
    };
  });

export const getCategoryFn = createServerFn({ method: 'GET' }).middleware([arcjetMiddleware]).handler(
  async ({ data: categoryId }: any) => {
    return await db.select().from(categories).where(eq<any>(categories.id, categoryId));
  }
);

export const createCategoryFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin: any = context?.user;
    try {
      const [ownedEvent] = await db
        .select({ id: events.id })
        .from(events)
        .where(and(eq<any>(events.id, data.eventId), eq<any>(events.adminId, admin.id)));
      if (!ownedEvent) {
        throw new Error('Event not found.');
      }

      return await db.insert(categories).values({
        eventId: data.eventId,
        name: data.name,
        description: data.description,
        code: data.code,
      }).returning();
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new Error('That category code is already in use for this event.');
      }
      throw error;
    }
  });

export const updateCategoryFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin: any = context?.user;
    try {
      const updated = await db
        .update(categories)
        .set({
          name: data.name,
          description: data.description,
          code: data.code,
        })
        .from(events)
        .where(
          and(
            eq<any>(categories.id, data.id),
            eq(categories.eventId, events.id),
            eq<any>(events.adminId, admin.id),
          ),
        )
        .returning({ id: categories.id, name: categories.name, description: categories.description, code: categories.code, eventId: categories.eventId, createdAt: categories.createdAt });
      if (updated.length === 0) {
        throw new Error('Category not found.');
      }
      return updated;
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new Error('That category code is already in use for this event.');
      }
      throw error;
    }
  });

export const deleteCategoryFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data: categoryId }: any) => {
    const admin: any = context?.user;
    const [ownedCategory] = await db
      .select({ id: categories.id })
      .from(categories)
      .innerJoin(events, eq(categories.eventId, events.id))
      .where(and(eq<any>(categories.id, categoryId), eq<any>(events.adminId, admin.id)));
    if (!ownedCategory) {
      throw new Error('Category not found.');
    }
    return await db.delete(categories).where(eq<any>(categories.id, categoryId)).returning();
  });


// ==========================================
// CONTESTANT FUNCTIONS (events' equivalent of candidates)
// ==========================================

export const getContestantsFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin: any = context?.user;
    const eventId = data?.eventId ?? data;
    const page = Math.max(Number(data?.page) || 1, 1);
    const pageSize = Math.max(Number(data?.pageSize) || 15, 1);
    const searchQuery = (data?.searchQuery || '').trim();
    const categoryFilter = data?.categoryFilter || 'ALL';

    const limitValue = pageSize;
    const offsetValue = (page - 1) * limitValue;

    const conditions: any = [eq(events.adminId, admin.id), eq(events.id, eventId)];
    if (searchQuery) {
      conditions.push(ilike(contestants.name, `%${searchQuery}%`));
    }
    if (categoryFilter !== 'ALL') {
      conditions.push(eq(categories.name, categoryFilter));
    }
    const queryCondition = and(...conditions);

    const [rows, [countResult], categoryOptions] = await Promise.all([
      db
        .select()
        .from(contestants)
        .innerJoin(categories, eq(contestants.categoryId, categories.id))
        .innerJoin(events, eq(categories.eventId, events.id))
        .where(queryCondition)
        .orderBy(asc(categories.name), asc(contestants.order))
        .limit(limitValue)
        .offset(offsetValue),
      db
        .select({ total: count() })
        .from(contestants)
        .innerJoin(categories, eq(contestants.categoryId, categories.id))
        .innerJoin(events, eq(categories.eventId, events.id))
        .where(queryCondition),
      db
        .select({ name: categories.name })
        .from(categories)
        .where(eq<any>(categories.eventId, eventId))
        .orderBy(asc(categories.name)),
    ]);

    const totalCount = countResult?.total ?? 0;
    const totalPages = Math.max(Math.ceil(totalCount / limitValue), 1);

    return {
      contestants: rows,
      categoryNames: categoryOptions.map((c: any) => c.name),
      pagination: { totalCount, totalPages, currentPage: page, pageSize: limitValue },
    };
  });

export const getContestantFn = createServerFn({ method: 'GET' }).middleware([arcjetMiddleware]).handler(
  async ({ data: contestantId }: any) => {
    return await db.select().from(contestants).where(eq<any>(contestants.id, contestantId));
  }
);

export const createContestantFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin: any = context?.user;
    try {
      const [ownedCategory] = await db
        .select({ id: categories.id })
        .from(categories)
        .innerJoin(events, eq(categories.eventId, events.id))
        .where(and(eq<any>(categories.id, data.get("categoryId")), eq<any>(events.adminId, admin.id)));
      if (!ownedCategory) {
        throw new Error('Category not found.');
      }

      const finalAvatarUrl = await processImageUpload(data.get("image") as File | null, {
        folder: 'contestants',
        maxWidth: 800,
        maxHeight: 800,
        quality: 75,
      });

      // The interaction code is system-generated (5 chars, globally unique) --
      // retry on the rare collision rather than trusting client input.
      let lastError: any;
      for (let attempt = 0; attempt < 10; attempt++) {
        try {
          return await db.insert(contestants).values({
            categoryId: data.get("categoryId") as any,
            name: data.get("name") as string,
            tagline: data.get("tagline") as string,
            order: data.get("order") as any,
            code: generateContestantCode(),
            ...(finalAvatarUrl && { imageUrl: finalAvatarUrl }),
          }).returning();
        } catch (error: any) {
          if (error?.code === '23505' && String(error?.constraint).includes('code')) {
            lastError = error;
            continue;
          }
          throw error;
        }
      }
      throw lastError;
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new Error('That contestant code is already in use for this category.');
      }
      throw error;
    }
  }
);

export const updateContestantFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin: any = context?.user;
    try {
      const [ownedContestant] = await db
        .select({ id: contestants.id })
        .from(contestants)
        .innerJoin(categories, eq(contestants.categoryId, categories.id))
        .innerJoin(events, eq(categories.eventId, events.id))
        .where(and(eq<any>(contestants.id, data.get("id")), eq<any>(events.adminId, admin.id)));
      if (!ownedContestant) {
        throw new Error('Contestant not found.');
      }

      const finalAvatarUrl = await processImageUpload(data.get("image") as File | null, {
        folder: 'contestants',
        maxWidth: 800,
        maxHeight: 800,
        quality: 75,
      });

      return await db
        .update(contestants)
        .set({
          categoryId: data.get("categoryId") as any,
          name: data.get("name") as string,
          tagline: data.get("tagline") as string,
          order: data.get("order") as any,
          code: String(data.get("code") ?? "").toUpperCase(),
          ...(finalAvatarUrl && { imageUrl: finalAvatarUrl }),
        })
        .where(eq<any>(contestants.id, data.get("id") as any))
        .returning();
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new Error('That contestant code is already in use.');
      }
      throw error;
    }
  });

export const deleteContestantFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data: contestantId }: any) => {
    const admin: any = context?.user;
    const [ownedContestant] = await db
      .select({ id: contestants.id })
      .from(contestants)
      .innerJoin(categories, eq(contestants.categoryId, categories.id))
      .innerJoin(events, eq(categories.eventId, events.id))
      .where(and(eq<any>(contestants.id, contestantId), eq<any>(events.adminId, admin.id)));
    if (!ownedContestant) {
      throw new Error('Contestant not found.');
    }
    return await db.delete(contestants).where(eq<any>(contestants.id, contestantId)).returning();
  });


// ==========================================
// EVENT TRANSACTION FUNCTIONS (events' equivalent of voters)
// ==========================================

export const getEventTransactionsFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin: any = context?.user;
    const eventId = data?.eventId ?? data;
    const page = Math.max(Number(data?.page) || 1, 1);
    const pageSize = Math.max(Number(data?.pageSize) || 15, 1);
    const searchQuery = (data?.searchQuery || '').trim();
    const statusFilter = data?.statusFilter || 'ALL';

    const limitValue = pageSize;
    const offsetValue = (page - 1) * limitValue;

    const conditions: any = [eq(events.adminId, admin.id), eq(events.id, eventId)];
    if (searchQuery) {
      const searchPattern = `%${searchQuery}%`;
      conditions.push(
        or(
          ilike(contestants.name, searchPattern),
          ilike(eventTransactions.payPhone, searchPattern),
          ilike(eventTransactions.transRef, searchPattern),
        )
      );
    }
    if (statusFilter === 'PAID') {
      conditions.push(eq(eventTransactions.payStatus, true));
    } else if (statusFilter === 'PENDING') {
      conditions.push(eq(eventTransactions.payStatus, false));
    }
    const queryCondition = and(...conditions);

    const [rows, [countResult]] = await Promise.all([
      db
        .select({
          transaction: eventTransactions,
          contestant: contestants,
          category: categories,
        })
        .from(eventTransactions)
        .innerJoin(contestants, eq(eventTransactions.contestantId, contestants.id))
        .innerJoin(categories, eq(contestants.categoryId, categories.id))
        .innerJoin(events, eq(categories.eventId, events.id))
        .where(queryCondition)
        .orderBy(desc(eventTransactions.createdAt))
        .limit(limitValue)
        .offset(offsetValue),
      db
        .select({ total: count() })
        .from(eventTransactions)
        .innerJoin(contestants, eq(eventTransactions.contestantId, contestants.id))
        .innerJoin(categories, eq(contestants.categoryId, categories.id))
        .innerJoin(events, eq(categories.eventId, events.id))
        .where(queryCondition),
    ]);

    const totalCount = countResult?.total ?? 0;
    const totalPages = Math.max(Math.ceil(totalCount / limitValue), 1);

    return {
      transactions: rows,
      pagination: { totalCount, totalPages, currentPage: page, pageSize: limitValue },
    };
  });

export const getEventTransactionFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data: transactionId }: any) => {
    const admin: any = context?.user;
    return await db
      .select({ eventTransactions })
      .from(eventTransactions)
      .innerJoin(contestants, eq(eventTransactions.contestantId, contestants.id))
      .innerJoin(categories, eq(contestants.categoryId, categories.id))
      .innerJoin(events, eq(categories.eventId, events.id))
      .where(and(eq<any>(eventTransactions.id, transactionId), eq<any>(events.adminId, admin.id)))
      .then((rows) => rows.map((r) => r.eventTransactions));
  });

export const createEventTransactionFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin: any = context?.user;
    const [ownedContestant] = await db
      .select({ id: contestants.id })
      .from(contestants)
      .innerJoin(categories, eq(contestants.categoryId, categories.id))
      .innerJoin(events, eq(categories.eventId, events.id))
      .where(and(eq<any>(contestants.id, data.contestantId), eq<any>(events.adminId, admin.id)));
    if (!ownedContestant) {
      throw new Error('Contestant not found.');
    }

    return await db.insert(eventTransactions).values({
      contestantId: data.contestantId,
      payAmount: data.payAmount != null && data.payAmount !== '' ? Number(data.payAmount) : null,
      payStatus: !!data.payStatus,
      payRef: data.payRef || null,
      payPhone: data.payPhone,
      transRef: data.transRef || null,
      votes: data.votes != null && data.votes !== '' ? Number(data.votes) : 0,
      channel: data.channel,
    }).returning();
  });

export const updateEventTransactionFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const admin: any = context?.user;
    const [ownedTransaction] = await db
      .select({ id: eventTransactions.id })
      .from(eventTransactions)
      .innerJoin(contestants, eq(eventTransactions.contestantId, contestants.id))
      .innerJoin(categories, eq(contestants.categoryId, categories.id))
      .innerJoin(events, eq(categories.eventId, events.id))
      .where(and(eq<any>(eventTransactions.id, data.id), eq<any>(events.adminId, admin.id)));
    if (!ownedTransaction) {
      throw new Error('Transaction not found.');
    }

    return await db
      .update(eventTransactions)
      .set({
        contestantId: data.contestantId,
        payAmount: data.payAmount != null && data.payAmount !== '' ? Number(data.payAmount) : null,
        payStatus: !!data.payStatus,
        payRef: data.payRef || null,
        payPhone: data.payPhone,
        transRef: data.transRef || null,
        votes: data.votes != null && data.votes !== '' ? Number(data.votes) : 0,
        channel: data.channel,
      })
      .where(eq<any>(eventTransactions.id, data.id))
      .returning();
  });

export const deleteEventTransactionFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data: transactionId }: any) => {
    const admin: any = context?.user;
    const [ownedTransaction] = await db
      .select({ id: eventTransactions.id })
      .from(eventTransactions)
      .innerJoin(contestants, eq(eventTransactions.contestantId, contestants.id))
      .innerJoin(categories, eq(contestants.categoryId, categories.id))
      .innerJoin(events, eq(categories.eventId, events.id))
      .where(and(eq<any>(eventTransactions.id, transactionId), eq<any>(events.adminId, admin.id)));
    if (!ownedTransaction) {
      throw new Error('Transaction not found.');
    }
    return await db.delete(eventTransactions).where(eq<any>(eventTransactions.id, transactionId)).returning();
  });


// ==========================================
// EVENT LIVE TELEMETRY FEED (events' equivalent of election telemetry)
// ==========================================

export const getEventTelemetryFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data: eventId }: any) => {
    const admin: any = context?.user;

    const [
      [eventRecord],
      rawCategories,
      rawContestantTallies,
      [summaryTotals],
      rawRecentTransactions,
    ] = await Promise.all([
      db.select().from(events).where(and(eq<any>(events.id, eventId), eq<any>(events.adminId, admin.id))),
      db.select().from(categories).where(eq<any>(categories.eventId, eventId)),
      db
        .select({
          id: contestants.id,
          name: contestants.name,
          tagline: contestants.tagline,
          imageUrl: contestants.imageUrl,
          categoryId: contestants.categoryId,
          order: contestants.order,
          voteCount: sql<number>`coalesce(sum(case when ${eventTransactions.payStatus} then ${eventTransactions.votes} else 0 end), 0)::int`,
        })
        .from(contestants)
        .innerJoin(categories, eq(contestants.categoryId, categories.id))
        .leftJoin(eventTransactions, eq(eventTransactions.contestantId, contestants.id))
        .where(eq<any>(categories.eventId, eventId))
        .groupBy(contestants.id, contestants.name, contestants.tagline, contestants.imageUrl, contestants.categoryId, contestants.order)
        .orderBy(asc(contestants.order)),
      db
        .select({
          totalVotes: sql<number>`coalesce(sum(${eventTransactions.votes}), 0)::int`,
          totalAmount: sql<number>`coalesce(sum(${eventTransactions.payAmount}), 0)::int`,
          totalTransactions: sql<number>`count(${eventTransactions.id})::int`,
        })
        .from(eventTransactions)
        .innerJoin(contestants, eq(eventTransactions.contestantId, contestants.id))
        .innerJoin(categories, eq(contestants.categoryId, categories.id))
        .where(and(eq<any>(categories.eventId, eventId), eq(eventTransactions.payStatus, true))),
      db
        .select({
          id: eventTransactions.id,
          contestantName: contestants.name,
          categoryName: categories.name,
          payPhone: eventTransactions.payPhone,
          payAmount: eventTransactions.payAmount,
          votes: eventTransactions.votes,
          channel: eventTransactions.channel,
          createdAt: eventTransactions.createdAt,
        })
        .from(eventTransactions)
        .innerJoin(contestants, eq(eventTransactions.contestantId, contestants.id))
        .innerJoin(categories, eq(contestants.categoryId, categories.id))
        .where(and(eq<any>(categories.eventId, eventId), eq(eventTransactions.payStatus, true)))
        .orderBy(desc(eventTransactions.createdAt))
        .limit(15),
    ]);

    if (!eventRecord) {
      throw new Error(`Event instance [${eventId}] not found.`);
    }

    const maskPhone = (phone: string) => (phone ? `${phone.slice(0, 4)}****${phone.slice(-2)}` : 'unknown');

    const formatElapsedTime = (pastDate: Date): string => {
      const now = new Date();
      const diffMs = now.getTime() - pastDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      return `${Math.floor(diffMins / 60)}h ago`;
    };

    const formattedTallies = rawCategories.map((cat) => {
      const categoryContestants = rawContestantTallies
        .filter((c) => c.categoryId === cat.id)
        .map((c, idx) => ({
          id: c.id,
          name: c.name,
          teaser: c.tagline ?? "",
          imageUrl: c.imageUrl ?? "",
          ballotNumber: c.order ?? idx + 1,
          votes: c.voteCount,
        }));

      return {
        id: cat.id,
        title: cat.name,
        totalVotesForPosition: categoryContestants.reduce((sum, c) => sum + c.votes, 0),
        candidates: categoryContestants,
      };
    });

    return {
      eventDetails: {
        title: eventRecord.title,
        unitPrice: eventRecord.unitPrice,
        totalCategories: rawCategories.length,
      },
      summary: {
        totalVotes: summaryTotals?.totalVotes ?? 0,
        totalAmount: summaryTotals?.totalAmount ?? 0,
        totalTransactions: summaryTotals?.totalTransactions ?? 0,
      },
      tallies: formattedTallies,
      auditLedger: rawRecentTransactions.map((log) => ({
        id: `tx_${log.id}`,
        positionTitle: `${log.contestantName} (${log.categoryName})`,
        voterMask: maskPhone(log.payPhone),
        channel: log.channel,
        amount: log.payAmount,
        votes: log.votes,
        timestamp: formatElapsedTime(log.createdAt),
      })),
    };
  });


// ==========================================
// EVENT FINAL RESULTS (print / export)
// ==========================================

// Certified-style final results for an event: categories with their contestants
// ranked by paid votes and the top vote-getter in each category flagged as the
// winner. Unlike elections (multi-seat positions with abstention ballots),
// events are single-winner-per-category pageant/award-style contests with no
// abstention concept -- every eventTransaction row is itself a paid vote.
export const getEventFinalResultsFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const eventId = data?.eventId ?? data;
    const admin: any = context?.user;

    const [
      [eventRecord],
      rawCategories,
      rawContestantTallies,
      [summaryTotals],
    ] = await Promise.all([
      db.select().from(events).where(and(eq<any>(events.id, eventId), eq<any>(events.adminId, admin.id))),
      db.select().from(categories).where(eq<any>(categories.eventId, eventId)).orderBy(asc(categories.createdAt)),
      db
        .select({
          id: contestants.id,
          name: contestants.name,
          teaser: contestants.tagline,
          imageUrl: contestants.imageUrl,
          code: contestants.code,
          order: contestants.order,
          categoryId: contestants.categoryId,
          voteCount: sql<number>`coalesce(sum(case when ${eventTransactions.payStatus} then ${eventTransactions.votes} else 0 end), 0)::int`,
        })
        .from(contestants)
        .innerJoin(categories, eq(contestants.categoryId, categories.id))
        .leftJoin(eventTransactions, eq(eventTransactions.contestantId, contestants.id))
        .where(eq<any>(categories.eventId, eventId))
        .groupBy(contestants.id, contestants.name, contestants.tagline, contestants.imageUrl, contestants.code, contestants.order, contestants.categoryId),
      db
        .select({
          totalVotes: sql<number>`coalesce(sum(${eventTransactions.votes}), 0)::int`,
          totalAmount: sql<number>`coalesce(sum(${eventTransactions.payAmount}), 0)::int`,
          totalTransactions: sql<number>`count(${eventTransactions.id})::int`,
        })
        .from(eventTransactions)
        .innerJoin(contestants, eq(eventTransactions.contestantId, contestants.id))
        .innerJoin(categories, eq(contestants.categoryId, categories.id))
        .where(and(eq<any>(categories.eventId, eventId), eq(eventTransactions.payStatus, true))),
    ]);

    if (!eventRecord) {
      throw new Error(`Event instance [${eventId}] not found.`);
    }

    const categoryResults = rawCategories.map((cat, catIdx) => {
      const categoryContestants = rawContestantTallies.filter((c) => c.categoryId === cat.id);
      const totalVotesForCategory = categoryContestants.reduce((sum, c) => sum + c.voteCount, 0);
      const highestVotes = Math.max(0, ...categoryContestants.map((c) => c.voteCount));

      const rankedContestants = categoryContestants
        .map((c, idx) => ({
          id: c.id,
          name: c.name,
          teaser: c.teaser ?? '',
          imageUrl: c.imageUrl ?? '',
          code: c.code,
          ballotNumber: c.order ?? idx + 1,
          votes: c.voteCount,
          percentage: totalVotesForCategory > 0 ? (c.voteCount / totalVotesForCategory) * 100 : 0,
          isWinner: highestVotes > 0 && c.voteCount === highestVotes,
        }))
        .sort((a, b) => b.votes - a.votes);

      return {
        id: cat.id,
        title: cat.name,
        order: catIdx,
        totalVotesForCategory,
        contestants: rankedContestants,
      };
    });

    return {
      event: {
        id: eventRecord.id,
        title: eventRecord.title,
        description: eventRecord.description,
        imageUrl: eventRecord.imageUrl,
        startAt: eventRecord.startAt ? eventRecord.startAt.toISOString() : null,
        endAt: eventRecord.endAt ? eventRecord.endAt.toISOString() : null,
        isActive: eventRecord.isActive,
      },
      stats: {
        totalVotes: summaryTotals?.totalVotes ?? 0,
        totalTransactions: summaryTotals?.totalTransactions ?? 0,
        grossRevenue: summaryTotals?.totalAmount ?? 0,
        totalCategories: rawCategories.length,
        totalContestants: rawContestantTallies.length,
      },
      categories: categoryResults,
    };
  });

// Certified-style 3-sheet Excel export (Executive Summary, Final Results Tallies,
// Recent Transaction Ledger) -- mirrors exportElectionResultsToFormatExcelFn's
// structure/styling for a consistent admin experience across both modules.
export const exportEventResultsToExcelFn = createServerFn({ method: 'GET' })
  .middleware([arcjetMiddleware, authMiddleware])
  .handler(async ({ context, data }: any) => {
    const { eventId } = data;
    const admin: any = context?.user;
    try {
      const [
        [eventRecord],
        rawCategories,
        rawContestantTallies,
        rawRecentTransactions,
      ] = await Promise.all([
        db.select().from(events).where(and(eq<any>(events.id, eventId), eq<any>(events.adminId, admin.id))),
        db.select().from(categories).where(eq<any>(categories.eventId, eventId)).orderBy(asc(categories.createdAt)),
        db
          .select({
            id: contestants.id,
            name: contestants.name,
            categoryId: contestants.categoryId,
            order: contestants.order,
            voteCount: sql<number>`coalesce(sum(case when ${eventTransactions.payStatus} then ${eventTransactions.votes} else 0 end), 0)::int`,
          })
          .from(contestants)
          .innerJoin(categories, eq(contestants.categoryId, categories.id))
          .leftJoin(eventTransactions, eq(eventTransactions.contestantId, contestants.id))
          .where(eq<any>(categories.eventId, eventId))
          .groupBy(contestants.id, contestants.name, contestants.categoryId, contestants.order)
          .orderBy(asc(contestants.order)),
        db
          .select({
            id: eventTransactions.id,
            categoryName: categories.name,
            contestantName: contestants.name,
            payPhone: eventTransactions.payPhone,
            payAmount: eventTransactions.payAmount,
            votes: eventTransactions.votes,
            channel: eventTransactions.channel,
            createdAt: eventTransactions.createdAt,
          })
          .from(eventTransactions)
          .innerJoin(contestants, eq(eventTransactions.contestantId, contestants.id))
          .innerJoin(categories, eq(contestants.categoryId, categories.id))
          .where(and(eq<any>(categories.eventId, eventId), eq(eventTransactions.payStatus, true)))
          .orderBy(desc(eventTransactions.createdAt)),
      ]);

      if (!eventRecord) {
        throw new Error(`Event instance [${eventId}] not found.`);
      }

      const workbook = XLSX.utils.book_new();

      const STYLES = {
        mainHeader: {
          font: { name: 'Arial', size: 11, bold: true, color: { rgb: 'FFFFFF' } },
          fill: { fgColor: { rgb: '0A192A' } },
          alignment: { horizontal: 'left', vertical: 'center' }
        },
        categoryRow: {
          font: { name: 'Arial', size: 11, bold: true, color: { rgb: '1E1B4B' } },
          fill: { fgColor: { rgb: 'E0E7FF' } },
          alignment: { horizontal: 'left', vertical: 'center' }
        },
        defaultText: {
          font: { name: 'Arial', size: 10 },
          alignment: { horizontal: 'left', vertical: 'center' }
        }
      };

      const createStyledSheet = (headers: string[], rows: any[], columnWidths: { wch: number }[]) => {
        const ws: XLSX.WorkSheet = {};
        ws['!cols'] = columnWidths;

        headers.forEach((header, colIndex) => {
          const cellRef = XLSX.utils.encode_cell({ r: 0, c: colIndex });
          ws[cellRef] = { v: header, t: 's', s: STYLES.mainHeader };
        });

        rows.forEach((row, rowIndex) => {
          const sheetRowIndex = rowIndex + 1;
          const isCategoryDivider = row._type === 'CATEGORY_HEADER';
          const currentStyle = isCategoryDivider ? STYLES.categoryRow : STYLES.defaultText;

          headers.forEach((_, colIndex) => {
            const cellKey = Object.keys(row).filter(k => k !== '_type')[colIndex];
            if (!cellKey) return;

            const cellValue = row[cellKey];
            const cellRef = XLSX.utils.encode_cell({ r: sheetRowIndex, c: colIndex });

            ws[cellRef] = {
              v: cellValue,
              t: typeof cellValue === 'number' ? 'n' : 's',
              s: currentStyle
            };
          });
        });

        const maxRow = rows.length;
        const maxCol = headers.length - 1;
        ws['!ref'] = XLSX.utils.encode_range({ r: 0, c: 0 }, { r: maxRow, c: maxCol });

        return ws;
      };

      // ================= SHEET 1: EXECUTIVE SUMMARY =================
      const totalVotes = rawContestantTallies.reduce((sum, c) => sum + c.voteCount, 0);
      const grossRevenue = rawRecentTransactions.reduce((sum, t) => sum + (t.payAmount ?? 0), 0);
      const summaryHeaders = ['Event Metric Description', 'Value / Metric Tally'];
      const summaryRows = [
        { desc: 'Event Title', val: eventRecord.title },
        { desc: 'Configured Categories Count', val: rawCategories.length },
        { desc: 'Enrolled Contestants Count', val: rawContestantTallies.length },
        { desc: 'Total Paid Votes', val: totalVotes },
        { desc: 'Gross Revenue Collected (GHS)', val: grossRevenue.toFixed(2) },
        { desc: 'Recorded Transactions', val: rawRecentTransactions.length },
        { desc: 'Export Generation Timestamp', val: new Date().toLocaleString() },
      ];
      const summarySheet = createStyledSheet(summaryHeaders, summaryRows, [{ wch: 35 }, { wch: 45 }]);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');

      // ================= SHEET 2: FINAL RESULTS TALLIES =================
      const talliesHeaders = ['Category', 'Contestant Name', 'Votes Counted', 'Percentage Share'];
      const talliesRows: any[] = [];

      for (const cat of rawCategories) {
        const categoryContestants = rawContestantTallies.filter((c) => c.categoryId === cat.id);
        const totalVotesForCat = categoryContestants.reduce((sum, c) => sum + c.voteCount, 0);

        talliesRows.push({
          _type: 'CATEGORY_HEADER',
          catTitle: cat.name.toUpperCase(),
          contName: '',
          vCount: `Total Votes: ${totalVotesForCat}`,
          pct: '',
        });

        categoryContestants
          .sort((a, b) => b.voteCount - a.voteCount)
          .forEach((c) => {
            const sharePct = totalVotesForCat > 0 ? ((c.voteCount / totalVotesForCat) * 100).toFixed(2) + '%' : '0.00%';
            talliesRows.push({
              _type: 'DEFAULT',
              catTitle: '',
              contName: c.name,
              vCount: c.voteCount,
              pct: sharePct,
            });
          });

        talliesRows.push({ _type: 'DEFAULT', catTitle: '', contName: '', vCount: '', pct: '' });
      }

      const talliesSheet = createStyledSheet(talliesHeaders, talliesRows, [{ wch: 25 }, { wch: 32 }, { wch: 18 }, { wch: 18 }]);
      XLSX.utils.book_append_sheet(workbook, talliesSheet, 'Final Results Tallies');

      // ================= SHEET 3: RECENT TRANSACTION LEDGER =================
      const ledgerHeaders = ['Transaction ID', 'Category (Contestant)', 'Masked Phone', 'Channel', 'Amount (GHS)', 'Votes', 'Date'];
      const ledgerRows = rawRecentTransactions.map((tx) => ({
        _type: 'DEFAULT',
        txId: `tx_${tx.id}`,
        desc: `${tx.categoryName} (${tx.contestantName})`,
        mask: tx.payPhone ? `${tx.payPhone.slice(0, 4)}****${tx.payPhone.slice(-2)}` : 'unknown',
        channel: tx.channel,
        amount: tx.payAmount ?? 0,
        votes: tx.votes,
        date: new Date(tx.createdAt).toLocaleString(),
      }));

      const ledgerSheet = createStyledSheet(ledgerHeaders, ledgerRows, [{ wch: 16 }, { wch: 34 }, { wch: 20 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 22 }]);
      XLSX.utils.book_append_sheet(workbook, ledgerSheet, 'Recent Transaction Ledger');

      const excelBuffer64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
      const cleanTitle = eventRecord.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

      return {
        success: true,
        filename: `event_${cleanTitle}_results.xlsx`,
        base64Data: excelBuffer64,
      };
    } catch (error: any) {
      console.error('Export Event Results Error:', error);
      return {
        success: false,
        error: error?.message || 'Failed to generate the event results workbook.',
        filename: '',
        base64Data: '',
      };
    }
  });


// ==========================================
// PUBLIC CARD CHECKOUT (Paystack)
// ==========================================

// Verifies a Paystack transaction server-side and, only once payment is confirmed,
// credits the corresponding vote transaction. Never trust the client's "it succeeded"
// signal for money -- always re-check with Paystack directly using the secret key.
export const verifyAndCastCardVoteFn = createServerFn({ method: 'POST' })
  .middleware([arcjetMiddleware])
  .handler(async ({ data }: any) => {
    const { reference, contestantId, votes, payEmail, payPhone } = data;

    if (!reference || !contestantId || !votes) {
      throw new Error('Missing required payment details.');
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey || /^sk_test_0+$/.test(secretKey)) {
      throw new Error('Card payments are not configured for this platform yet.');
    }

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } },
    );
    const verifyResult: any = await verifyResponse.json();

    if (!verifyResponse.ok || !verifyResult?.status || verifyResult.data?.status !== 'success') {
      throw new Error(verifyResult?.message || 'Payment verification failed.');
    }

    const result = await creditCardVote({
      reference,
      contestantId,
      votes: Number(votes),
      payPhone: payPhone || payEmail || verifyResult.data.customer?.email,
      amountKobo: verifyResult.data.amount,
      transRef: verifyResult.data.id ? String(verifyResult.data.id) : null,
      channel: 'WEB',
    });

    switch (result.status) {
      case 'credited':
        return {
          success: true,
          votes: result.votes,
          amount: result.amount,
          reference: result.reference,
        };
      case 'already_recorded':
        throw new Error('This payment has already been recorded.');
      case 'not_found':
        throw new Error(result.reason);
      case 'amount_mismatch':
        throw new Error('Paid amount does not match the expected vote total.');
    }
  });
