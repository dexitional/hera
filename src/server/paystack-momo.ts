// Initiates a Mobile Money charge via Paystack's Charge API. This is an offline
// payment method -- Paystack prompts the customer to approve on their phone, and
// the final success/failure only arrives later via the charge.success webhook
// (see src/routes/api/webhooks.paystack.ts). This module intentionally has no
// createServerFn exports mixed in -- see paystack-credit.ts for why that matters.

export type MomoProvider = 'mtn' | 'atl' | 'vod';

/** Maps a Ghanaian MSISDN prefix to the mobile network operator code Paystack expects. */
export function detectGhMomoProvider(phone: string): MomoProvider {
  const local = phone.replace('+233', '0').replace('233', '0');
  if (/^0(24|25|53|54|55|59)/.test(local)) return 'mtn';
  if (/^0(20|50)/.test(local)) return 'vod'; // Vodafone/Telecel
  if (/^0(26|27|56|57)/.test(local)) return 'atl'; // AirtelTigo
  return 'mtn';
}

export type InitiateMomoChargeParams = {
  email: string;
  amountGhs: number;
  phone: string;
  currency?: 'GHS';
  metadata?: Record<string, any>;
};

export type InitiateMomoChargeResult = {
  reference: string;
  status: string; // e.g. 'pay_offline', 'send_otp', 'success'
  displayText?: string;
};

export async function initiateMomoCharge(params: InitiateMomoChargeParams): Promise<InitiateMomoChargeResult> {
  const { email, amountGhs, phone, currency = 'GHS', metadata } = params;
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error('Card/mobile money payments are not configured for this platform yet.');
  }

  const provider = detectGhMomoProvider(phone);

  const response = await fetch('https://api.paystack.co/charge', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amountGhs * 100),
      currency,
      mobile_money: { phone, provider },
      metadata,
    }),
  });

  const result: any = await response.json();
  if (!response.ok || !result?.status) {
    throw new Error(result?.message || 'Failed to initiate mobile money charge.');
  }

  return {
    reference: result.data.reference,
    status: result.data.status,
    displayText: result.data.display_text,
  };
}
