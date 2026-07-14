const PAYSTACK_INLINE_SRC = 'https://js.paystack.co/v1/inline.js';

export const PAYSTACK_PUBLIC_KEY: string = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';

let inlineScriptPromise: Promise<void> | null = null;

function loadPaystackInline(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Paystack checkout can only run in the browser.'));
  }
  if ((window as any).PaystackPop) return Promise.resolve();
  if (inlineScriptPromise) return inlineScriptPromise;

  inlineScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PAYSTACK_INLINE_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load the Paystack checkout script.'));
    document.body.appendChild(script);
  });

  return inlineScriptPromise;
}

export type PaystackCheckoutParams = {
  email: string;
  amountInKobo: number;
  currency?: string;
  metadata?: Record<string, any>;
};

export type PaystackCheckoutResult = { reference: string };

export async function openPaystackCheckout(params: PaystackCheckoutParams): Promise<PaystackCheckoutResult> {
  await loadPaystackInline();

  return new Promise((resolve, reject) => {
    const PaystackPop = (window as any).PaystackPop;
    const handler = PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: params.email,
      amount: params.amountInKobo,
      currency: params.currency || 'GHS',
      metadata: params.metadata || {},
      callback: (response: any) => {
        resolve({ reference: response.reference });
      },
      onClose: () => {
        reject(new Error('Payment window closed before completion.'));
      },
    });
    handler.openIframe();
  });
}
