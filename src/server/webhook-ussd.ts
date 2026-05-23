import { guardTransaction, releaseTransactionLock } from '../middleware/idempotency';
import { sendMomoPushRequest } from '../services/paystack';

export async function handleUssdRequest(req: Request) {
  const formData = await req.formData();
  const phone = formData.get('phoneNumber') as string;
  const userInput = formData.get('text') as string;

  /*
  
      let response = "";

      if (text === "") {
        // Main Menu
        response = "CON Welcome to your SaaS \n";
        response += "1. Check Subscription Status \n";
        response += "2. Renew Plan";
      
      
      } else if (text === "1") {
        // Fetch user status via Drizzle using their phone number
        const user = await db.select().from(users).where(eq(users.phone, phoneNumber)).limit(1);
        if (user[0]?.isSubscribed) {
          response = `END Your account is Active on the ${user[0].subscriptionPlan} plan.`;
        } else {
          response = "END You do not have an active subscription.";
        }
     }

  */

  if (userInput === '1') {
    // 1. Evaluate Redis Lock instantly before spending resources or hitting APIs
    const lockCheck = await guardTransaction(phone, 60);
    if (!lockCheck.isAllowed) {
      return new Response(`END ${lockCheck.message}`, {
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // 2. Fast tracking client text return execution
    const responseMessage = 'END Processing your payment request. Enter your MoMo PIN when prompted.';

    // 3. Dispatch heavy third-party work cleanly out of the HTTP lifecycle thread
    process.nextTick(async () => {
      try {
        const paystackResult = await sendMomoPushRequest({
          email: `${phone.replace('+', '')}@ussd-saas.internal`,
          amountInBaseCurrency: 20.00,
          phoneNumber: phone.replace('+233', '0'), // Standardizes local formatting
          currency: 'GHS'
        });

        if (!paystackResult.success) {
          // If Paystack immediately fails, clear lock early
          await releaseTransactionLock(phone);
        }
      } catch (err) {
        await releaseTransactionLock(phone);
        console.error('Background task execution engine critical crash:', err);
      }
    });

    return new Response(responseMessage, {
      headers: { 'Content-Type': 'text/plain' }
    });
  }
  
  return new Response('END Invalid selection', { headers: { 'Content-Type': 'text/plain' } });
}
