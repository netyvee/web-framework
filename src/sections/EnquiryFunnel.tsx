'use client';
// enquiry_funnel (SECTION-LIBRARY §18; CONVERSION-STANDARD §4). Working MINIMUM of
// the funnel contract (conversion/funnel.ts): choice steps with progress + state +
// completion → hands off to the division CRM enquiry URL carrying intent +
// attribution. Care/any division supply their own care-appropriate steps (NOT
// Cleaning's premises wording). a11y: radiogroup semantics, keyboard-native buttons,
// aria-live progress, focus moves to the new step heading.
import { useMemo, useRef, useState } from 'react';
import type { PageJson } from '../types';
import { resolveTheme } from '../tokens/theme';
import { buildEnquiryUrl, validateFunnel, FUNNEL_EVENTS, type FunnelSchema } from '../conversion/funnel';

function emit(name: string, detail: any) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function EnquiryFunnel({ fields, page }: { fields: any; page: PageJson }) {
  const schema = fields as Partial<FunnelSchema>;
  const t = resolveTheme(page.brand);
  const [stepIndex, setStepIndex] = useState(0);
  const [intent, setIntent] = useState<Record<string, string>>({});
  const headingRef = useRef<HTMLHeadingElement>(null);

  const steps = Array.isArray(schema.steps) ? schema.steps : [];
  const invalid = useMemo(() => validateFunnel(schema), [schema]);
  if (invalid.length > 0 || steps.length === 0) return null; // empty/invalid → render nothing

  const total = steps.length;
  const done = stepIndex >= total;
  const pct = Math.round(((done ? total : stepIndex) / total) * 100);
  const enquiryUrl = buildEnquiryUrl(page.nap.enquiry_url, schema.division!, intent, schema.source);

  function choose(stepId: string, key: string, value: string) {
    const next = { ...intent, [key]: value };
    setIntent(next);
    emit(FUNNEL_EVENTS.step, { division: schema.division, source: schema.source, stepId, value });
    const ni = stepIndex + 1;
    setStepIndex(ni);
    if (ni >= total) emit(FUNNEL_EVENTS.complete, { division: schema.division, source: schema.source, intent: next });
    requestAnimationFrame(() => headingRef.current?.focus());
  }

  // Route-out branch of an audience gate: emit attribution, then let the anchor's href
  // carry the visitor to the other journey (no preventDefault — governed link handoff).
  function routeOut(stepId: string, value: string, dest: string) {
    emit(FUNNEL_EVENTS.audience, { division: schema.division, source: schema.source, stepId, value, route_to: dest });
  }

  const step = steps[stepIndex];
  const isAudience = !done && step.type === 'audience';

  return (
    <section className="px-6 py-10 md:px-12" style={{ background: page.brand.bg, color: page.brand.text }}>
      <div className="mx-auto max-w-lg rounded-2xl p-6" style={{ background: t.bgCard, border: `1px solid ${t.accent}33` }}>
        <div className="flex items-baseline justify-between">
          <h2 ref={headingRef} tabIndex={-1} className="text-base font-bold outline-none">
            {done ? schema.completion!.headline : step.question}
          </h2>
          {schema.heading && <span className="text-xs" style={{ color: t.accent }}>{schema.heading}</span>}
        </div>

        <div className="mt-3 h-1 w-full overflow-hidden rounded" style={{ background: t.line }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Enquiry progress">
          <div className="h-1 rounded" style={{ width: `${pct}%`, background: t.accent }} />
        </div>

        {isAudience ? (
          // Audience gate: two distinct actions (route-out = navigate away; continue = advance),
          // so a plain group of native links/buttons — NOT a radiogroup (nothing is "selected";
          // one option leaves the funnel immediately).
          <div role="group" aria-label={step.question} className="mt-5 grid grid-cols-2 gap-3">
            {step.options.map((o) =>
              o.route_to ? (
                <a
                  key={o.value}
                  href={o.route_to}
                  onClick={() => routeOut(step.id, o.value, o.route_to!)}
                  className="rounded-[11px] p-4 text-left text-sm no-underline"
                  style={{ background: page.brand.bg, border: `1px solid ${t.line}`, color: t.text }}
                >
                  {o.icon && <span aria-hidden className="mr-1">{o.icon}</span>}
                  {o.label}
                </a>
              ) : (
                <button
                  key={o.value}
                  onClick={() => choose(step.id, step.intent_key ?? step.id, o.value)}
                  className="rounded-[11px] p-4 text-left text-sm"
                  style={{ background: page.brand.bg, border: `1px solid ${t.line}`, color: t.text }}
                >
                  {o.icon && <span aria-hidden className="mr-1">{o.icon}</span>}
                  {o.label}
                </button>
              ),
            )}
          </div>
        ) : !done ? (
          <div role="radiogroup" aria-label={step.question} className="mt-5 grid grid-cols-2 gap-3">
            {step.options.map((o) => (
              <button
                key={o.value}
                role="radio"
                aria-checked={intent[step.intent_key ?? step.id] === o.value}
                onClick={() => choose(step.id, step.intent_key ?? step.id, o.value)}
                className="rounded-[11px] p-4 text-left text-sm"
                style={{ background: page.brand.bg, border: `1px solid ${t.line}`, color: t.text }}
              >
                {o.icon && <span aria-hidden className="mr-1">{o.icon}</span>}
                {o.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-5">
            {schema.completion!.note && <p className="text-sm" style={{ color: t.text3 }}>{schema.completion!.note}</p>}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {(schema.reassurance ?? []).map((r, i) => (
              <span key={i} className="rounded-full px-3 py-1 text-xs font-medium" style={{ color: t.accent, background: t.lineAccent, border: `1px solid ${t.accent}40` }}>{r}</span>
            ))}
          </div>
          {!isAudience && (
            // Suppressed on the audience gate: the visitor MUST pick a card (client → continue,
            // candidate → route out) so a candidate can never slip straight into the client CTA.
            <a href={enquiryUrl} className="rounded-lg px-4 py-2 text-sm font-medium" style={{ background: t.accent, color: t.onAccent }}>
              {done ? (schema.completion!.cta_label ?? 'Continue') : 'Continue'} →
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
