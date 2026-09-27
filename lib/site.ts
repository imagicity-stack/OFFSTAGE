export const SITE = {
  email: 'hello@offstagepr.in',
  phone: '+917370002080',
  phoneLabel: '+91 73700 02080',
  instagram: 'https://instagram.com/offstage.pr',
  instagramHandle: '@offstage.pr',
  company: 'Flykraft Synergies Private Limited',
  cin: 'U14101JH2024PTC022177',
  gstin: '20AAFCF8404P1ZJ',
  office: 'Kolghatti, Near Black Tank, Reformatory School, Hazaribagh – 825319, Jharkhand, India',
};

// Design "Tweaks" from the prototype.
export const SHOW_SPOTLIGHT = true;
export const SHOW_MARQUEE = true;

export const LEGAL_PAGES = [
  ['privacy', 'Privacy Policy'],
  ['terms', 'Terms & Conditions'],
  ['refund', 'Refund & Cancellation'],
  ['cookies', 'Cookie Policy'],
  ['disclaimer', 'Disclaimer'],
] as const;

export type LegalSlug = (typeof LEGAL_PAGES)[number][0];
