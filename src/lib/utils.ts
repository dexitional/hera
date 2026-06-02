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


export const stripCountryCode = (num: any) => num.startsWith('233') ? num.slice(3) : num.startsWith('00233') ? num.slice(5) : num.startsWith('+233') ? num.slice(4) : num;

export const addCountryCode = (phone: any) => {
  let rawPhone = String(phone || '').trim();
  rawPhone = rawPhone.replace(/[\s\-\(\)\+]/g, ''); 

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
  window.crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < 6; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
};


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