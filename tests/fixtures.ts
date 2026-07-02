// Neutral test identity — deliberately NOT a real division's values, so the test
// suite itself can never normalise a real identity literal into the framework.
import type { PageJson, SiteNav } from '../src/types';

export const nav: SiteNav = {
  brandName: 'Test Trading Co',
  primary: [
    { label: 'Home', href: '/' },
    { label: 'Widgets', href: '/widgets' },
  ],
  footer: [
    { heading: 'Services', links: [{ label: 'Widgets', href: '/widgets' }] },
  ],
  companyReg: 'Company Reg. 00000000',
  enquiryCtaLabel: 'Request a widget',
  logo: { src: '/logo-test.png', alt: 'Test Trading Co', footerSrc: '/logo-test-white.png' },
  legalLinks: [{ label: 'Privacy', href: '/privacy' }, { label: 'Cookies', href: '/cookies' }],
};

export const page: PageJson = {
  schema_version: 1,
  site: 'test_site',
  slug: '/',
  page_type: 'homepage',
  seo: {
    title: 'Test Page Title',
    description: 'Test page description for contract tests.',
    canonical: '/',
  },
  brand: { bg: '#0a1628', text: '#ffffff', cta: '#4ecdc4', secondary: '#7fb2d4' },
  nap: {
    phone: '020 0000 0000',
    email: 'test@example.invalid',
    address: '1 Test Street, Testville',
    trading_name: 'Test Trading Co',
    enquiry_url: 'https://crm.example.invalid/enquire/test',
  },
  sections: [],
};

export const withSections = (sections: PageJson['sections']): PageJson => ({
  ...page,
  sections,
});
