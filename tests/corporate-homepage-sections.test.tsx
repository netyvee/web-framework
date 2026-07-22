// corporate_hero + reassurance_strip (v0.6.6) — the light corporate homepage's other two sections.
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CorporateHero } from '../src/sections/CorporateHero';
import { ReassuranceStrip } from '../src/sections/ReassuranceStrip';
import { page } from './fixtures';
import type { PageJson } from '../src/types';

const mainPage: PageJson = { ...page, site: 'main', nap: { ...page.nap, email: 'info@vigilservices.co.uk', phone: '' } };

describe('corporate_hero', () => {
  const render = (fields: any, p: PageJson = mainPage) => renderToStaticMarkup(<CorporateHero fields={fields} page={p} />);
  it('renders one H1 with the approved heading + supporting copy', () => {
    const html = render({ heading: 'Vigil Services Ltd', sub: 'Four specialist divisions.' });
    expect((html.match(/<h1\b/g) ?? []).length).toBe(1);
    expect(html).toContain('Vigil Services Ltd');
    expect(html).toContain('Four specialist divisions.');
  });
  it('carries no links and no image (the hero photo is not duplicated)', () => {
    const html = render({ heading: 'Vigil Services Ltd', sub: 'x' });
    expect(html).not.toContain('<a ');
    expect(html).not.toContain('<img');
  });
});

describe('reassurance_strip — email-only, no dead tel:', () => {
  const render = (fields: any, p: PageJson = mainPage) => renderToStaticMarkup(<ReassuranceStrip fields={fields} page={p} />);
  it('renders the corporate email as a mailto action and NO phone / NO tel:', () => {
    const html = render({ statement: 'We combine skilled people with high standards.', action_label: 'Get in touch' });
    expect(html).toContain('mailto:info@vigilservices.co.uk');
    expect(html).toContain('Get in touch');
    expect(html).not.toContain('tel:');
    expect(html).toContain('We combine skilled people with high standards.');
  });
  it('renders no contact action when the page has no email (no dead affordance)', () => {
    const noEmail: PageJson = { ...mainPage, nap: { ...mainPage.nap, email: '' } };
    const html = render({ statement: 'x' }, noEmail);
    expect(html).not.toContain('mailto:');
    expect(html).not.toContain('tel:');
  });
  it('has an id="contact" anchor for the header Contact link', () => {
    expect(render({ statement: 'x' })).toContain('id="contact"');
  });
});
