// @vigil/web-framework — SiteFooter (v1.28.0, netyvee/app#344, D-140/D-142/D-167).
//
// ONE canonical white footer for every Vigil site (Founder-approved 2026-11-14), built as three bands on one
// column grid so every element snaps to a shared column edge:
//   band 1  identity   logo + description | contact | quote button + social links
//   band 2  navigation  up to five equal columns: Services | Careers | Areas covered | Company | Legal
//   band 3  small print company line | trading name  (+ overflow legal links, optional note)
//
// ROW RULE (Founder, 2026-11-14): every column in a footer shows the same number of rows, R (`rows`). A list longer
// than R is cut to R; when a hub page exists (`viewAll`) its link takes the last row ("All areas →"). LEGAL links are
// never cut: any beyond R move to the small-print row. A column with no links is omitted, never padded.
//
// The component is a pure server-safe component with its OWN scoped CSS (class prefix `vf-sf`), so it renders
// identically on sites whose Tailwind does not scan this package. Colours are the canonical brand tokens.
import type { ReactNode } from 'react';
import Link from 'next/link';
import type { NavLinkRel } from '../types';

export type SiteFooterLink = { label: string; href: string; rel?: NavLinkRel; /** Open in a new tab (external profiles). Adds rel="noopener noreferrer". */ newTab?: boolean };

export type SiteFooterColumn = {
  /** Heading text. The canonical set is FOOTER_HEADINGS; "Our businesses" is Main's Services slot. */
  heading: string;
  links: SiteFooterLink[];
  /** Hub page. When the list is cut it becomes the last row ("All areas →"). */
  viewAll?: SiteFooterLink;
  /** 'legal' columns are never cut: overflow moves to the small-print row. */
  kind?: 'legal';
};

export type SiteFooterProps = {
  logo: { src: string; alt: string; height?: number };
  description?: string;
  /** Address lines, e.g. ['<street>', '<town> <postcode>']. */
  address?: string[];
  phone?: SiteFooterLink;
  email?: string;
  social?: SiteFooterLink[];
  cta?: SiteFooterLink;
  columns: SiteFooterColumn[];
  /** R: rows shown per column. */
  rows: number;
  /** e.g. "© <year> <Company> · Company No. <n> · Registered in England and Wales". */
  companyLine: string;
  /** e.g. "<Division> is a trading name of <Company>." */
  tradingNote?: string;
  /** Optional small note under the bar (Cleaning keeps its two SEO paragraphs here). */
  note?: ReactNode;
};

/** The canonical heading set, in order. */
export const FOOTER_HEADINGS = ['Services', 'Careers', 'Areas covered', 'Company', 'Legal'] as const;

export type BalancedFooter = { columns: SiteFooterColumn[]; legalOverflow: SiteFooterLink[] };

/**
 * Applies the row rule. Pure and exported so it can be tested and reused by consumers.
 *  - empty columns are omitted;
 *  - kind 'legal': first `rows` links stay, the rest are returned as `legalOverflow` (never dropped);
 *  - other columns longer than `rows`: with viewAll, `rows - 1` links + the viewAll link; without, `rows` links.
 */
export function balanceFooterColumns(columns: SiteFooterColumn[], rows: number): BalancedFooter {
  const r = Math.max(1, Math.floor(rows));
  const out: SiteFooterColumn[] = [];
  const legalOverflow: SiteFooterLink[] = [];
  for (const col of columns) {
    if (!col.links || col.links.length === 0) continue;
    if (col.kind === 'legal') {
      out.push({ ...col, links: col.links.slice(0, r) });
      legalOverflow.push(...col.links.slice(r));
    } else if (col.links.length > r) {
      const shown = col.viewAll ? col.links.slice(0, Math.max(0, r - 1)).concat([col.viewAll]) : col.links.slice(0, r);
      out.push({ ...col, links: shown });
    } else {
      out.push(col);
    }
  }
  return { columns: out, legalOverflow };
}

const INK = '#0a1628';
const TEAL_DEEP = '#0b7a72'; // 5.2:1 on white (the older #0f8f86 is 3.97:1 and fails AA for small text)
const TEAL = '#4ecdc4';

const CSS = `
.vf-sf{background:#fff;color:${INK};border-top:1px solid rgba(10,22,40,.12);font-size:14px;line-height:20px}
.vf-sf *{box-sizing:border-box}
.vf-sf a{color:inherit;text-decoration:none}
.vf-sf a:hover{text-decoration:underline;text-underline-offset:3px}
.vf-sf a:focus-visible{outline:2px solid ${TEAL_DEEP};outline-offset:2px;border-radius:2px}
.vf-sf ul{list-style:none;margin:0;padding:0}
.vf-sf-wrap{max-width:72rem;margin:0 auto;padding:0 24px}
.vf-sf-band{padding:36px 0}
.vf-sf-band+.vf-sf-band{border-top:1px solid rgba(10,22,40,.12)}
.vf-sf-grid{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));column-gap:32px;align-items:start}
.vf-sf-brand img{display:block;width:auto}
.vf-sf-desc{margin:14px 0 0;line-height:21px;color:rgba(10,22,40,.76);max-width:380px}
.vf-sf h3{margin:0 0 12px;font-size:12px;line-height:16px;font-weight:500;letter-spacing:.12em;text-transform:uppercase;color:${TEAL_DEEP}}
.vf-sf address{font-style:normal;display:grid;line-height:22px;color:rgba(10,22,40,.8)}
.vf-sf address a{color:${TEAL_DEEP}}
.vf-sf address a:first-of-type{margin-top:4px}
.vf-sf-actions{display:flex;flex-direction:column;align-items:flex-start;gap:14px}
.vf-sf-cta{display:inline-flex;align-items:center;min-height:44px;background:${TEAL};color:${INK}!important;font-weight:500;padding:0 22px;border-radius:8px;white-space:nowrap}
.vf-sf-cta:hover{text-decoration:none!important;background:#44c2b9}
.vf-sf-social{display:flex;flex-wrap:wrap;gap:4px 18px;line-height:22px;color:rgba(10,22,40,.8)}
.vf-sf-col li{color:rgba(10,22,40,.8)}
.vf-sf-col li a{display:block;padding:4px 0}
.vf-sf-col li.vf-sf-all a{color:${TEAL_DEEP};font-weight:500}
.vf-sf-bar{display:grid;gap:10px;padding:20px 0 28px}
.vf-sf-more{display:flex;flex-wrap:wrap;gap:4px 24px;font-size:13px;color:rgba(10,22,40,.8)}
.vf-sf-small{display:flex;flex-wrap:wrap;justify-content:space-between;gap:6px 32px;font-size:12px;line-height:18px;color:rgba(10,22,40,.68)}
.vf-sf-note{margin:0;font-size:12px;line-height:18px;color:rgba(10,22,40,.6);max-width:55rem}
@media(max-width:900px){
.vf-sf-grid{grid-template-columns:1fr 1fr;column-gap:24px;row-gap:28px}
.vf-sf-grid>.vf-sf-brand,.vf-sf-grid>.vf-sf-contact,.vf-sf-grid>.vf-sf-actions{grid-column:1/-1!important}
.vf-sf-actions{flex-direction:row;flex-wrap:wrap;align-items:center}
.vf-sf-col li a{padding:8px 0}
.vf-sf-small{flex-direction:column}
.vf-sf-band{padding:28px 0}
}`;

export function SiteFooter(props: SiteFooterProps) {
  const { logo, description, address, phone, email, social, cta, columns, rows, companyLine, tradingNote, note } = props;
  const { columns: cols, legalOverflow } = balanceFooterColumns(columns, rows);
  const n = Math.max(3, cols.length);
  // Identity band snaps to the same grid: brand 1 (or 1-2 with five columns), contact next (two columns when
  // there are four or more), actions in the LAST column.
  const brandSpan = n >= 5 ? 2 : 1;
  const contactSpan = n >= 4 ? 2 : 1;
  const contactStart = brandSpan + 1;
  const hasContact = Boolean((address && address.length) || phone || email);
  const hasActions = Boolean(cta || (social && social.length));
  const rel = (l: SiteFooterLink) => (l.rel ? ({ 'data-vf-rel': l.rel } as const) : {});
  const tab = (l: SiteFooterLink) => (l.newTab ? ({ target: '_blank', rel: 'noopener noreferrer' } as const) : {});
  return (
    <footer className="vf-sf" data-vf-footer data-vf-footer-v="2">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="vf-sf-wrap">
        <div className="vf-sf-band vf-sf-grid" style={{ ['--n' as string]: n }}>
          <div className="vf-sf-brand" style={{ gridColumn: `1 / span ${brandSpan}`, marginTop: 4 }}>
            {/* plain <img>: no per-site remotePatterns needed, identical as a repo-static or CDN asset */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo.src} alt={logo.alt} height={logo.height ?? 40} style={{ height: logo.height ?? 40 }} />
            {description && <p className="vf-sf-desc">{description}</p>}
          </div>
          {hasContact && (
            <div className="vf-sf-contact" style={{ gridColumn: `${contactStart} / span ${contactSpan}` }}>
              <h3>Contact</h3>
              <address>
                {address && address.map((line) => <span key={line}>{line}</span>)}
                {phone && <a href={phone.href}>{phone.label}</a>}
                {email && <a href={`mailto:${email}`}>{email}</a>}
              </address>
            </div>
          )}
          {hasActions && (
            <div className="vf-sf-actions" style={{ gridColumn: `${n} / span 1` }}>
              {cta && <a className="vf-sf-cta" href={cta.href} style={n >= 5 ? { padding: '0 14px' } : undefined}>{cta.label}</a>}
              {social && social.length > 0 && (
                <ul className="vf-sf-social" aria-label="Social media">
                  {social.map((s) => <li key={s.href}><a href={s.href} {...rel(s)} {...tab(s)}>{s.label}</a></li>)}
                </ul>
              )}
            </div>
          )}
        </div>
        <div className="vf-sf-band vf-sf-grid" style={{ ['--n' as string]: n }}>
          {cols.map((col, i) => {
            const id = `vf-sf-h-${i}`;
            return (
              <nav key={col.heading} className="vf-sf-col" aria-labelledby={id}>
                <h3 id={id}>{col.heading}</h3>
                <ul>
                  {col.links.map((l) => {
                    const isAll = col.viewAll && l.href === col.viewAll.href && l.label === col.viewAll.label;
                    return <li key={`${l.href}|${l.label}`} className={isAll ? 'vf-sf-all' : undefined}><Link href={l.href} {...rel(l)}>{l.label}</Link></li>;
                  })}
                </ul>
              </nav>
            );
          })}
        </div>
        <div className="vf-sf-band vf-sf-bar">
          {legalOverflow.length > 0 && (
            <ul className="vf-sf-more" aria-label="More legal information">
              {legalOverflow.map((l) => <li key={l.href}><Link href={l.href} {...rel(l)}>{l.label}</Link></li>)}
            </ul>
          )}
          <div className="vf-sf-small">
            <span>{companyLine}</span>
            {tradingNote && <span>{tradingNote}</span>}
          </div>
          {note && <div className="vf-sf-note">{note}</div>}
        </div>
      </div>
    </footer>
  );
}
