import type { PageJson } from './types';

/**
 * The primary conversion href for a page.
 *
 * Recruitment/candidate pages route to the CANDIDATE (careers) funnel — nap.careers_url when the
 * CRM provides it, otherwise derived from enquiry_url (/enquire/{div} -> /careers/{div}) — so a
 * candidate is NEVER sent into the client-sales enquiry funnel. Every other page type returns
 * nap.enquiry_url unchanged (byte-identical to before → existing sites/pages unaffected).
 *
 * Used by the Shell CTAs and the contact/enquiry section components so routing is consistent
 * everywhere a conversion action renders.
 */
export function primaryCtaHref(page: PageJson): string {
  const enquiry = page.nap.enquiry_url;
  if (page.page_type === 'recruitment') {
    return page.nap.careers_url
      ?? (enquiry.includes('/enquire/') ? enquiry.replace('/enquire/', '/careers/') : enquiry);
  }
  return enquiry;
}

/** True for recruitment/candidate page types (label decisions live in the components). */
export function isRecruitmentPage(page: PageJson): boolean {
  return page.page_type === 'recruitment';
}
