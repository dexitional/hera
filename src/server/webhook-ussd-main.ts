import { db } from '../db';
import { events, categories, contestants, votes } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { guardTransaction } from '../middleware/idempotency';
import { sendMomoPushRequest } from '../services/paystack';

export async function handleVotingUssd(req: Request) {
  const formData = await req.formData();
  const phone = formData.get('phoneNumber') as string;
  const text = formData.get('text') as string; // e.g., "1*2*1"

  const steps = text === '' ? [] : text.split('*');
  let response = '';

  // Step 1: Main Menu - List Active Events
  if (steps.length === 0) {
    const activeEvents = await db.select().from(events).where(eq(events.isActive, 1));
    response = 'CON Select an Event:\n';
    activeEvents.forEach((ev) => {
      response += `${ev.id}. ${ev.title}\n`;
    });
    return new Response(response, { headers: { 'Content-Type': 'text/plain' } });
  }

  // Step 2: Show Categories for the Selected Event
  if (steps.length === 1) {
    const eventId = parseInt(steps[0]);
    const eventCategories = await db.select().from(categories).where(eq(categories.eventId, eventId));
    
    if (eventCategories.length === 0) return new Response('END No categories found.', { headers: { 'Content-Type': 'text/plain' } });
    
    response = 'CON Select a Category:\n';
    eventCategories.forEach((cat) => {
      response += `${cat.code}. ${cat.name}\n`;
    });
    return new Response(response, { headers: { 'Content-Type': 'text/plain' } });
  }

  // Step 3: Show Contestants in the Selected Category
  if (steps.length === 2) {
    const eventId = parseInt(steps[0]);
    const categoryCode = steps[1];

    // Find the specific category row based on event parent and user code selection
    const [targetCategory] = await db.select()
      .from(categories)
      .where(and(eq(categories.eventId, eventId), eq(categories.code, categoryCode)))
      .limit(1);

    if (!targetCategory) return new Response('END Category not found.', { headers: { 'Content-Type': 'text/plain' } });

    const categoryContestants = await db.select().from(contestants).where(eq(contestants.categoryId, targetCategory.id));
    
    response = 'CON Vote for your Contestant:\n';
    categoryContestants.forEach((c) => {
      response += `${c.code}. ${c.name}\n`;
    });
    return new Response(response, { headers: { 'Content-Type': 'text/plain' } });
  }

  // Step 4: Choose Vote Weight Packages
  if (steps.length === 3) {
    response = 'CON Choose Voting Package:\n';
    response += '1. 1 Free Vote\n';
    response += '2. 10 Paid Votes (GHS 5)\n';
    response += '3. 50 Paid Votes (GHS 20)';
    return new Response(response, { headers: { 'Content-Type': 'text/plain' } });
  }

  // Step 5: Process Vote Execution & Billing Trigger
  if (steps.length === 4) {
    const eventId = parseInt(steps[0]);
    const categoryCode = steps[1];
    const contestantCode = steps[2];
    const packageChoice = steps[3];

    // Query Category Database ID
    const [category] = await db.select().from(categories)
      .where(and(eq(categories.eventId, eventId), eq(categories.code, categoryCode))).limit(1);
    
    if (!category) return new Response('END Invalid Category configuration.', { headers: { 'Content-Type': 'text/plain' } });

    // Query Contestant Row 
    const [contestant] = await db.select().from(contestants)
      .where(and(eq(contestants.categoryId, category.id), eq(contestants.code, contestantCode))).limit(1);

    if (!contestant) return new Response('END Contestant not found.', { headers: { 'Content-Type': 'text/plain' } });

    // Handle Free Package tier immediately
    if (packageChoice === '1') {
      await db.insert(votes).values({
        eventId,
        categoryId: category.id,
        contestantId: contestant.id,
        voterPhone: phone,
        voteCount: 1,
        channel: 'USSD'
      });
      return new Response(`END Thank you! Your free vote for ${contestant.name} has been counted.`, { headers: { 'Content-Type': 'text/plain' } });
    }

    // Set variable parameters for paid packages
    let cost = packageChoice === '2' ? 5 : 20;
    let votesAwarded = packageChoice === '2' ? 10 : 50;

    // Apply Redis Guard to prevent concurrent session double billing
    const lock = await guardTransaction(phone, 45);
    if (!lock.isAllowed) return new Response(`END ${lock.message}`, { headers: { 'Content-Type': 'text/plain' } });

    response = `END Processing GHS ${cost} for ${votesAwarded} votes to ${contestant.name}. Please confirm the MoMo PIN prompt on your phone.`;

    // Offload the Paystack API execution context out of the main execution loop
    process.nextTick(async () => {
      await sendMomoPushRequest({
        email: `${phone.replace('+', '')}@voting-saas.internal`,
        amountInBaseCurrency: cost,
        phoneNumber: phone.replace('+233', '0'),
        currency: 'GHS',
        metadata: {
          eventId,
          categoryId: category.id,
          contestantId: contestant.id,
          voterPhone: phone,
          voteCount: votesAwarded
        }
      } as any);
    });

    return new Response(response, { headers: { 'Content-Type': 'text/plain' } });
  }

  return new Response('END System tracking error.', { headers: { 'Content-Type': 'text/plain' } });
}
