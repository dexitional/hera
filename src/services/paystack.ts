interface MomoPayload {
    email: string;
    amountInBaseCurrency: number;
    phoneNumber: string;
    currency: 'GHS' | 'NGN' | 'KES';
}

export async function initiateMomoCharge(phoneNumber: string, email: string, amountInGhs: number) {
  const provider = detectMomoProvider(phoneNumber); 
  const response = await fetch('https://paystack.co', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      amount: amountInGhs * 100, // Convert to lowest currency unit (Pesewas/Kobo)
      mobile_money: {
        phone: phoneNumber,
        provider: provider,
      },
    }),
  });

  const result = await response.json();
  return result;
}


export async function sendMomoPushRequest({
    email,
    amountInBaseCurrency,
    phoneNumber,
    currency
  }: MomoPayload) {
    
    // Detect network provider based on phone number prefix
    const provider = detectNetworkProvider(phoneNumber, currency);
    // Paystack demands amounts in lowest denominations (multiplied by 100)
    const amountInLowestUnit = Math.round(amountInBaseCurrency * 100);
  
    const payload = {
      email: email,
      amount: amountInLowestUnit,
      currency: currency,
      mobile_money: {
        phone: phoneNumber,
        provider: provider
      }
    };
  
    try {
      const response = await fetch('https://paystack.co', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
  
      const result = await response.json();
      if (!response.ok || !result.status) {
        throw new Error(result.message || 'Paystack initialization failed');
      }
  
      // Expected response status for successful push initiation: "pay_offline" or "pending"
      return {
        success: true,
        reference: result.data.reference,
        status: result.data.status,
        message: result.data.display_text || 'Prompt sent successfully'
      };
  
    } catch (error: any) {
      console.error('Momo Push Request Error:', error.message);
      return { success: false, error: error.message };
    }
}

/** Helper to auto-resolve providers for West and East African networks **/

function detectNetworkProvider(phone: string, currency: string): string {
    if (currency === 'KES') return 'mpesa';
    const localPhone = phone.replace('+233', '0').replace('+234', '0');
    
    if (/^0(24|054|055|059|053|025)/.test(localPhone)) return 'mtn';
    if (/^0(20|050)/.test(localPhone)) return 'vod'; // Telecel
    if (/^0(26|056|027|057)/.test(localPhone)) return 'tgo'; // AT
    // Default fallback if matching fails
    return 'mtn'; 
}

function detectMomoProvider(phone: string): 'mtn' | 'vod' | 'tgo' {
  if (phone.includes('024') || phone.includes('054') || phone.includes('055') || phone.includes('059') || phone.includes('025')) return 'mtn';
  if (phone.includes('020') || phone.includes('050')) return 'vod';
  return 'tgo';
}
