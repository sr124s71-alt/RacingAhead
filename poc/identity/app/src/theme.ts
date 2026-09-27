import type { Variant } from './api';

export interface Theme {
  name: string;
  tagline: string;
  primary: string;
  primaryDark: string;
  tint: string;
  onPrimary: string;
}

export const THEMES: Record<Variant, Theme> = {
  user: {
    name: 'SportSeek',
    tagline: 'Book · Play · Compete',
    primary: '#0B8A5C',
    primaryDark: '#06623F',
    tint: '#E3F5EC',
    onPrimary: '#FFFFFF',
  },
  partner: {
    name: 'SportSeek Partner',
    tagline: 'Facilities · Coaching · Wellness',
    primary: '#C2410C',
    primaryDark: '#9A3412',
    tint: '#FDEDE3',
    onPrimary: '#FFFFFF',
  },
  admin: {
    name: 'SportSeek Admin',
    tagline: 'Identity operations',
    primary: '#1E3A8A',
    primaryDark: '#172554',
    tint: '#E6ECFA',
    onPrimary: '#FFFFFF',
  },
};

export const C = {
  bg: '#F4F5F7',
  card: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  danger: '#B91C1C',
  dangerBg: '#FDECEC',
  ok: '#047857',
  okBg: '#E1F5EC',
  warn: '#92400E',
  warnBg: '#FEF3C7',
  info: '#1D4ED8',
  infoBg: '#E6EEFD',
};

/** Colour per app, used on role chips so the audience can see which app a role belongs to. */
export const APP_COLOURS: Record<string, string> = {
  'user-app': THEMES.user.primary,
  'partner-app': THEMES.partner.primary,
  'admin-portal': THEMES.admin.primary,
};

export const APP_LABELS: Record<string, string> = {
  'user-app': 'User App',
  'partner-app': 'Partner App',
  'admin-portal': 'Admin Portal',
  bootstrap: 'Phase 1 bootstrap',
  seed: 'Seed',
};

export const ROLE_LABELS: Record<string, string> = {
  Player: 'Player',
  EventOrganiser: 'Event Organiser',
  FacilityPartner: 'Facility Partner',
  Coach: 'Coach',
  Physio: 'Physio',
  Nutritionist: 'Nutritionist',
  Admin: 'Admin',
};
