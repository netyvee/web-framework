// @vigil/web-framework — CONVERSION FUNNEL CONTRACT (v0.2, §5).
// The reusable enquiry-funnel schema + step model + attribution + analytics +
// completion contract. The v0.2 component (sections/EnquiryFunnel) is a working
// MINIMUM implementing this contract: choice steps → hand-off to the division CRM
// enquiry URL (/enquire/{division}) carrying intent + attribution metadata. A
// fuller multi-field/postcode/booking funnel may follow, but the CONTRACT is fixed
// here so the CRM, analytics and the future dashboard code to ONE shape.
//
// CONVERSION-STANDARD.md rule: a homepage archetype cannot earn full conversion
// credit from a single CTA button — a funnel (or equivalent multi-touch journey)
// is required. This contract is that mechanism.

export type FunnelOption = {
  value: string;        // machine value carried as intent metadata
  label: string;        // visible label
  icon?: string;        // optional decorative glyph
};

export type FunnelStep = {
  id: string;                       // stable step key (analytics + dashboard)
  question: string;                 // legend / prompt
  type: 'choice';                   // v0.2 supports single-select choice; extensible
  options: FunnelOption[];
  intent_key?: string;              // query key for the selected value (default: id)
};

export type FunnelCompletion = {
  headline: string;                 // shown on the completion step before hand-off
  note?: string;                    // reassurance line
  cta_label?: string;               // hand-off button label
};

export type FunnelSchema = {
  division: string;                 // attribution — REQUIRED (maps to /enquire/{division})
  source?: string;                  // originating page/source id (attribution)
  heading?: string;                 // funnel card heading
  reassurance?: string[];           // trust chips inside the funnel (no-commitment etc.)
  steps: FunnelStep[];              // >= 1
  completion: FunnelCompletion;
};

// Analytics events the funnel emits on window (the dashboard/analytics layer
// listens; no vendor lock-in). Documented so the eventual dashboard maps them.
export const FUNNEL_EVENTS = {
  step: 'vigil:funnel_step',        // detail: { division, source, stepId, value }
  complete: 'vigil:funnel_complete',// detail: { division, source, intent }
} as const;

// Build the CRM hand-off URL from the base enquiry_url + accumulated intent.
// Division attribution + per-step intent + source become query metadata the CRM
// enquiry page reads (lead attribution). No PII collected client-side — the funnel
// only captures intent, then the CRM funnel collects details (mirrors the proven
// "redirect immediately, capture in CRM" principle).
export function buildEnquiryUrl(
  enquiryUrl: string,
  division: string,
  intent: Record<string, string>,
  source?: string,
): string {
  const params = new URLSearchParams();
  params.set('division', division);
  if (source) params.set('source', source);
  for (const [k, v] of Object.entries(intent)) if (v) params.set(k, v);
  const sep = enquiryUrl.includes('?') ? '&' : '?';
  return `${enquiryUrl}${sep}${params.toString()}`;
}

// Validate a funnel schema (used by the CRM gate + tests).
export function validateFunnel(schema: Partial<FunnelSchema>): string[] {
  const errors: string[] = [];
  if (!schema.division) errors.push('funnel.division is required (CRM attribution)');
  if (!Array.isArray(schema.steps) || schema.steps.length < 1) errors.push('funnel requires >= 1 step');
  (schema.steps ?? []).forEach((s, i) => {
    if (!s.id) errors.push(`step[${i}].id required`);
    if (s.type !== 'choice') errors.push(`step[${i}].type must be 'choice' (v0.2)`);
    if (!Array.isArray(s.options) || s.options.length < 2) errors.push(`step[${i}] needs >= 2 options`);
  });
  if (!schema.completion?.headline) errors.push('funnel.completion.headline required');
  return errors;
}
