import { describe, expect, it } from 'vitest';
import { breadcrumbsFor, isNavActive, MAIN_NAV, navFor } from './nav';

const item = (to: string) => MAIN_NAV.find((n) => n.to === to)!;
const ID = '00000000-0000-0000-0000-000000000003';

describe('breadcrumbsFor', () => {
  it('dashboard is a single current crumb', () => {
    expect(breadcrumbsFor('/admin')).toEqual([{ label: 'Dashboard' }]);
  });
  it('labels sections and leaves the current page unlinked', () => {
    expect(breadcrumbsFor('/admin/elections')).toEqual([{ label: 'Dashboard', to: '/admin' }, { label: 'Elections' }]);
  });
  it('names ID segments by what they are and links them to their overview', () => {
    expect(breadcrumbsFor(`/admin/elections/${ID}/voters`)).toEqual([
      { label: 'Dashboard', to: '/admin' },
      { label: 'Elections', to: '/admin/elections' },
      { label: 'Election', to: `/admin/elections/${ID}/manage` },
      { label: 'Voters' },
    ]);
  });
  it('handles nested records (event nominee edit)', () => {
    expect(breadcrumbsFor(`/admin/events/${ID}/contestants/${ID}/edit`).map((c) => c.label)).toEqual(['Dashboard', 'Events', 'Event', 'Nominees', 'Nominee', 'Edit']);
  });
  it('treats better-auth style user ids as IDs', () => {
    expect(breadcrumbsFor('/admin/users/DLKvWTW6nBZXOQxPuDvmwMSwHA5V3nPd').map((c) => c.label)).toEqual(['Dashboard', 'Users', 'User']);
  });
});

describe('isNavActive', () => {
  it('Dashboard is active only on /admin', () => {
    expect(isNavActive(item('/admin'), '/admin')).toBe(true);
    expect(isNavActive(item('/admin'), '/admin/elections')).toBe(false);
  });
  it('sections are active on their sub-pages, not on look-alike prefixes', () => {
    expect(isNavActive(item('/admin/events'), `/admin/events/${ID}/manage`)).toBe(true);
    expect(isNavActive(item('/admin/events'), '/admin/eventsx')).toBe(false);
  });
});

describe('navFor', () => {
  it('hides super-admin sections from regular admins', () => {
    expect(navFor(MAIN_NAV, false).map((n) => n.label)).toEqual(['Dashboard', 'Elections', 'Events']);
    expect(navFor(MAIN_NAV, true).map((n) => n.label)).toContain('Revenue');
  });
});
