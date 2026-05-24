import crypto from 'crypto';
import { db } from '../db';
import { user } from '../db/schema';
import { eq } from 'drizzle-orm';


//#   /webhooks/paystack

export async function handlePaystackWebhook(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    // 1. Capture the raw text body exactly as sent (do not use parsed JSON)
    const rawBody = await req.text();
    
    // 2. Extract the payload signature from headers
    const paystackSignature = req.headers.get('x-paystack-signature');

    if (!paystackSignature) {
      return new Response('Missing Signature Header', { status: 401 });
    }

    // 3. Recompute the HMAC SHA512 hash using your secret key
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(rawBody)
      .digest('hex');

    // 4. Securely compare hashes using timing-safe equivalence
    if (hash !== paystackSignature) {
      return new Response('Signature Verification Failed', { status: 403 });
    }

    // 5. Safely parse payload data after verification passes
    const event = JSON.parse(rawBody);

    // 6. Handle successful payment events
    if (event.event === 'charge.success') {
      const paymentData = event.data;
      const customerEmail = paymentData.customer.email;
      const metadata = paymentData.metadata; // Optional extra contextual data

      // Update subscription status in your PostgreSQL database via Drizzle
      await db.update(user)
        .set({ 
          isSubscribed: true, 
          subscriptionPlan: metadata?.planName || 'Premium' 
        })
        .where(eq(user.email, customerEmail));
    }

    /*
      if (body.event === 'charge.success') {
        const paymentData = body.data;
        const phone = paymentData.authorization.mobile_money_business_name; 
        const customerEmail = paymentData.customer.email;

        // Locate matching subscription account by either email or telephone identifier
        await db.update(users)
          .set({ isSubscribed: true, subscriptionPlan: 'Premium' })
          .where(eq(users.email, customerEmail));
      }
    */

    /*
     
     if (eventData.event === 'charge.success') {
        const metadata = eventData.data.metadata;

        if (metadata?.eventId && metadata?.contestantId) {
          // Atomically batch insert calculated bulk votes into database records
          await db.insert(votes).values({
            eventId: Number(metadata.eventId),
            contestantId: Number(metadata.contestantId),
            voterPhone: metadata.voterPhone,
            voteCount: Number(metadata.voteCount),
            channel: 'USSD'
          });

          console.log(`Successfully credited ${metadata.voteCount} votes to Contestant ID: ${metadata.contestantId}`);
        }
      }
    */

    /*
      
    
      if (eventData.event === 'charge.success') {
        const metadata = eventData.data.metadata;

        if (metadata?.eventId && metadata?.categoryId && metadata?.contestantId) {
          await db.insert(votes).values({
            eventId: Number(metadata.eventId),
            categoryId: Number(metadata.categoryId),
            contestantId: Number(metadata.contestantId),
            voterPhone: metadata.voterPhone,
            voteCount: Number(metadata.voteCount),
            channel: 'USSD'
          });
        }
      }
    

    
    */


    return new Response('Event Processed Successfully', { status: 200 });

  } catch (error: any) {
    console.error('Webhook Error:', error.message);
    return new Response('Internal Server Error', { status: 500 });
  }
  
}
