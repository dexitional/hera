// Admin colour theme: "system" (default, follows the OS), "light" or "dark".
//
// Stored per browser in localStorage. Applied as the `admin-light` class on
// <html> (see src/styles/admin-theme.css), only on /admin routes:
//   * before first paint by ADMIN_THEME_INIT_SCRIPT (inlined in __root.tsx),
//     so a light-theme page never flashes dark;
//   * afterwards by the admin shell, which also tracks OS changes in "system".

export type AdminThemePref = 'system' | 'light' | 'dark';

export const ADMIN_THEME_KEY = 'heravote-admin-theme';
export const ADMIN_LIGHT_CLASS = 'admin-light';

export function readAdminThemePref(): AdminThemePref {
  try {
    const v = window.localStorage.getItem(ADMIN_THEME_KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function writeAdminThemePref(pref: AdminThemePref): void {
  try {
    window.localStorage.setItem(ADMIN_THEME_KEY, pref);
  } catch {
    // storage unavailable (private mode etc.): the choice lasts for this page only
  }
}

export function systemPrefersDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return true;
  }
}

export function resolveAdminTheme(pref: AdminThemePref): 'light' | 'dark' {
  if (pref === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return pref;
}

/**
 * Applies the admin theme, or (null) hands <html> back to the public site.
 * color-scheme is set inline because the site's own init script sets it
 * inline too (and an inline style beats the stylesheet).
 */
export function applyAdminTheme(theme: 'light' | 'dark' | null): void {
  const root = document.documentElement;
  root.classList.toggle(ADMIN_LIGHT_CLASS, theme === 'light');
  root.style.colorScheme = theme ?? (root.classList.contains('light') ? 'light' : 'dark');
}

/** Runs before first paint (inlined in <head>); mirrors the functions above. */
export const ADMIN_THEME_INIT_SCRIPT = `(function(){try{if(location.pathname.indexOf('/admin')!==0)return;var p=localStorage.getItem('${ADMIN_THEME_KEY}');var light=p==='light'||(p!=='dark'&&!window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;if(light)r.classList.add('${ADMIN_LIGHT_CLASS}');r.style.colorScheme=light?'light':'dark';}catch(e){}})();`;
