import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { createStore } from '@tanstack/store';


export type ModalPage = 'card' | 'ussd' | 'ended' | 'stack' | 'profile'
export type ModalSize = 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
export type ModalState = { page: ModalPage | null; size: ModalSize }

export const modalPage = createStore<ModalState>({
  page: 'card',
  size: 'lg',
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function convertToFormData(state: Record<string, any>): FormData {
  const formData = new FormData();

  Object.entries(state).forEach(([key, value]) => {
    // Skip empty, null, or undefined fields to avoid stringifying them as "null"/"undefined"
    if (value === null || value === undefined) return;

    if (value instanceof File || value instanceof Blob) {
      formData.append(key, value);
    } else {
      // Safely cast primitives (numbers, booleans) to strings
      formData.append(key, String(value));
    }
  });

  return formData;
}


export const stripCountryCode = (num: any) => num?.toString()?.startsWith('233') ? num?.toString()?.slice(3) : num?.toString()?.startsWith('00233') ? num?.toString()?.slice(5) : num?.toString()?.startsWith('+233') ? num?.toString()?.slice(4) : num?.toString();

export const addCountryCode = (phone: any) => {
  let rawPhone = String(phone || '').trim();
  rawPhone = rawPhone?.replace(/[\s\-\(\)\+]/g, ''); 

  let cleanPhone = rawPhone;
  if (rawPhone.startsWith('0')) {
    cleanPhone = '233' + rawPhone.slice(1); 
  } else if (rawPhone.startsWith('233')) {
    cleanPhone = rawPhone;
  } else if (rawPhone.length === 9) {
    cleanPhone = '233' + rawPhone; 
  }
  return cleanPhone
}


export const generateSixDigitCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Omitted easily confused chars like 0, O, 1, I
  let result = "";
  const randomValues = new Uint32Array(6);
  globalThis.crypto.getRandomValues(randomValues);

  for (let i = 0; i < 6; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
};

export type VoterImportRow = {
  electionId: string | number;
  username?: string;
  name?: string;
  phoneNumber?: string;
  email?: string;
  inviteToken?: string;
};

/** Dedupe by election+username and ensure unique invite tokens before bulk insert. */
export function prepareVotersForBulkImport<T extends VoterImportRow>(rows: T[]) {
  const byKey = new Map<string, T>();
  const duplicateUsernames: string[] = [];
  const usedTokens = new Set<string>();

  for (const row of rows) {
    const username = String(row.username ?? "").replace(/\s+/g, "").trim();
    if (!username) continue;

    const electionId = String(row.electionId);
    const key = `${electionId}:${username.toLowerCase()}`;

    if (byKey.has(key)) {
      duplicateUsernames.push(username);
    }

    let inviteToken = row.inviteToken || generateSixDigitCode();
    while (usedTokens.has(inviteToken)) {
      inviteToken = generateSixDigitCode();
    }
    usedTokens.add(inviteToken);

    byKey.set(key, {
      ...row,
      username,
      name: typeof row.name === "string" ? row.name.trim() : row.name,
      email: row.email?.trim() || `${username}@vote.local`,
      inviteToken,
    } as T);
  }

  return {
    voters: Array.from(byKey.values()),
    duplicateUsernames: [...new Set(duplicateUsernames)],
  };
}


export const generateTokenCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Omitted easily confused chars like 0, O, 1, I
  let result = "";
  const randomValues = new Uint32Array(40);
  window.crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < 6; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
};

export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function maskPhoneNumber(phone: any) {
  return phone.replace(/(\d{3})\d{4}(\d{3})/, '$1xxxx$2');
}

export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const smsQueueTracker = new Map<string, {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  isProcessing: boolean;
}>();

export async function fetchWithRetry(url: string, options: any, retries = 3, delay = 1000): Promise<Response> {
  try {
    const res = await fetch(url, options);
    if (!res.ok && (res.status === 429 || res.status >= 500) && retries > 0) {
      console.warn(`Gateway rate-limited/errored (${res.status}). Backoff retrying in ${delay}ms...`);
      await wait(delay);
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    return res;
  } catch (err) {
    if (retries > 0) {
      console.warn(`Network disconnect encountered. Retrying in ${delay}ms...`);
      await wait(delay);
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw err;
  }
}


