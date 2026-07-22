import type { PageJson } from '../types';
import { resolveTheme } from '../tokens/theme';

// reassurance_strip (v0.6.6, MAIN-HOMEPAGE-VISUAL-02) — the light lower strip from the reference:
// a concise corporate statement on the left, a single contact action on the right, over a light ground
// with a thin top divider + short teal accent rule. The contact action is EMAIL-ONLY (page.nap.email);
// it renders NO phone and NO dead tel: (the corporate number is an open gate, M-14). If no email is on
// the page it renders no action at all rather than a dead affordance.
export function ReassuranceStrip({ fields, page }: { fields: any; page: PageJson }) {
  const t = resolveTheme(page.brand);
  const statement = typeof fields.statement === 'string' ? fields.statement : '';
  const email = page.nap.email;
  const hasEmail = typeof email === 'string' && email.trim() !== '';
  const actionLabel = typeof fields.action_label === 'string' && fields.action_label.trim() ? fields.action_label : 'Get in touch';
  return (
    <section id="contact" style={{ background: page.brand.bg, color: page.brand.text }} className="px-6 py-14">
      <div className="mx-auto grid max-w-6xl items-center gap-8 border-t md:grid-cols-2" style={{ borderColor: t.line }}>
        <div className="pt-10">
          <div className="mb-5 h-[3px] w-12 rounded-full" style={{ background: t.accent }} aria-hidden="true" />
          {statement && <p className="max-w-md text-lg leading-relaxed" style={{ color: page.brand.text }}>{statement}</p>}
        </div>
        {hasEmail && (
          <div className="pt-10 md:justify-self-end">
            <a href={`mailto:${email}`} className="group inline-flex items-center gap-4 hover:underline">
              <span
                className="flex h-12 w-12 flex-none items-center justify-center rounded-full"
                style={{ background: `${t.accent}1a`, color: t.accent }}
                aria-hidden="true"
              >
                {/* envelope glyph (inline SVG, no external asset) */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              </span>
              <span className="text-left">
                <span className="block text-sm font-medium" style={{ color: page.brand.text }}>{actionLabel}</span>
                {/* link_label ("Email us") shows in place of the raw address when set; the mailto still targets the address. */}
                <span className="block text-base font-medium" style={{ color: t.accent }}>
                  {typeof fields.link_label === 'string' && fields.link_label.trim() ? fields.link_label : email}
                </span>
              </span>
              <span aria-hidden="true" style={{ color: t.accent }}>→</span>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
