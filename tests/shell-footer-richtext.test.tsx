// F2-06 item B (netyvee/app#344) — Shell's optional nav.footerRichText slot, found
// via the package spec's required diff step: Security's bespoke footer is already
// fully expressible with the existing Shell footer contract (no gap); Cleaning's
// carries a genuine two-paragraph SEO/keyword block with no home in nav
// links/NAP/CTA/companyReg. See AUDIT/F2-06-07-FRAMEWORK-GENERALISATION-PACKAGE-SPEC-01.md
// item B and types.ts's SiteNav.footerRichText doc comment.
//
// Two concerns proven separately, same pattern as prose-rich-content.test.tsx:
// 1. Backward compatibility: Care/Staffing/Main's current nav configs don't set
//    footerRichText, so their Shell footer output is byte-identical to before.
// 2. The new capability: when set, it renders via the exact same ProseBlock/
//    ProseInline renderer Prose.tsx already proves, not a second one.
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Shell } from '../src/shell/Shell';
import { page, nav } from './fixtures';
import type { ProseBlock } from '../src/types';

const baseHtml = renderToStaticMarkup(
  <Shell page={page} nav={nav}>
    <div>PAGE CONTENT</div>
  </Shell>
);

const richBlocks: ProseBlock[] = [
  { type: 'paragraph', content: ['First SEO paragraph with a ', { text: 'bold', bold: true }, ' word.'] },
  { type: 'paragraph', content: ['Second SEO paragraph, plain text only.'] },
];

const richHtml = renderToStaticMarkup(
  <Shell page={page} nav={{ ...nav, footerRichText: richBlocks }}>
    <div>PAGE CONTENT</div>
  </Shell>
);

describe('Shell footer — optional footerRichText slot (F2-06 item B)', () => {
  it('existing consumers (no footerRichText set) render a byte-identical footer', () => {
    const noSlot = renderToStaticMarkup(
      <Shell page={page} nav={{ ...nav, footerRichText: undefined }}>
        <div>PAGE CONTENT</div>
      </Shell>
    );
    expect(noSlot).toBe(baseHtml);
    expect(baseHtml).not.toContain('data-vf-footer-richtext');
  });

  it('an empty array also renders no rich-text block (same as omitted)', () => {
    const empty = renderToStaticMarkup(
      <Shell page={page} nav={{ ...nav, footerRichText: [] }}>
        <div>PAGE CONTENT</div>
      </Shell>
    );
    expect(empty).toBe(baseHtml);
  });

  it('renders footerRichText blocks via the shared ProseBlock renderer when present', () => {
    const footer = richHtml.match(/<footer[\s\S]*?<\/footer>/)![0];
    expect(footer).toContain('data-vf-footer-richtext');
    expect(footer).toContain('First SEO paragraph with a ');
    expect(footer).toContain('<strong>bold</strong>');
    expect(footer).toContain('Second SEO paragraph, plain text only.');
  });

  it('the rich-text block sits after the main footer grid, before </footer>', () => {
    const footer = richHtml.match(/<footer[\s\S]*?<\/footer>/)![0];
    const gridEnd = footer.indexOf('</footer>');
    const richStart = footer.indexOf('data-vf-footer-richtext');
    expect(richStart).toBeGreaterThan(-1);
    expect(richStart).toBeLessThan(gridEnd);
  });

  it('everything else about the footer (NAP, columns, CTA, companyReg) is unchanged when footerRichText is also set', () => {
    const footer = richHtml.match(/<footer[\s\S]*?<\/footer>/)![0];
    expect(footer).toContain(page.nap.address!);
    expect(footer).toContain(page.nap.phone);
    expect(footer).toContain('Privacy');
    expect(footer).toContain(nav.companyReg);
    expect(footer).toContain(nav.enquiryCtaLabel);
  });
});
