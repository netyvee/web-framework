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
  // Audience-gate route-out (opt-in, additive; only meaningful on an `audience` step).
  // When set, choosing this option navigates the visitor OUT of this funnel to route_to
  // (a governed link handoff — e.g. a jobseeker → the recruitment/careers destination)
  // instead of advancing into the client enquiry funnel. Options WITHOUT route_to are the
  // "continue" branch and proceed into the funnel as normal (e.g. a client → next step).
  // The server-side audience guard stays in the CRM; this is the front-of-funnel split so a
  // candidate is never carried into the client-sales pipeline in the first place.
  route_to?: string;
};

export type FunnelStep = {
  id: string;                       // stable step key (analytics + dashboard)
  question: string;                 // legend / prompt
  // 'choice' = single-select that advances the funnel; 'audience' = a route-out gate whose
  // options split by visitor type (>=1 route_to "route-out" option + >=1 continue option).
  type: 'choice' | 'audience';
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
  audience: 'vigil:funnel_audience',// detail: { division, source, stepId, value, route_to } — route-out gate chosen
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
    if (s.type !== 'choice' && s.type !== 'audience') errors.push(`step[${i}].type must be 'choice' or 'audience'`);
    if (!Array.isArray(s.options) || s.options.length < 2) errors.push(`step[${i}] needs >= 2 options`);
    // An audience gate must actually split: at least one route-out branch AND at least one
    // continue branch, else it either dead-ends every visitor or is just a plain choice step.
    if (s.type === 'audience') {
      const opts = Array.isArray(s.options) ? s.options : [];
      if (!opts.some((o) => o.route_to)) errors.push(`step[${i}] (audience) needs >= 1 option with route_to (route-out branch)`);
      if (!opts.some((o) => !o.route_to)) errors.push(`step[${i}] (audience) needs >= 1 option without route_to (continue branch)`);
    }
  });
  if (!schema.completion?.headline) errors.push('funnel.completion.headline required');
  return errors;
}
