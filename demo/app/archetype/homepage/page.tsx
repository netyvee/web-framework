// PAGE-ARCHETYPES §1 — DIVISION HOMEPAGE, composed end-to-end through the REAL
// registry + shell + JSON-LD. Neutral identity. This is a fully framework-adopted
// division homepage, structurally.
import { Header, Footer, MobileCta, RenderSections, JsonLd, resolveTheme } from '@vigil/web-framework';
import { demoNav, demoPage, withSections, archetypeHomepage } from '@/lib/neutral';

export const metadata = { title: 'Archetype — Division homepage (neutral demo)' };

const page = withSections(archetypeHomepage);
const t = resolveTheme(page.brand);

export default function ArchetypeHomepage() {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: page.brand.bg, color: page.brand.text, ...(t.cssVars as any) }}>
      <JsonLd page={page} origin="https://demo.example" />
      <Header page={page} nav={demoNav} />
      <main className="flex-1">
        <RenderSections page={page} />
      </main>
      <Footer page={page} nav={demoNav} />
      <MobileCta page={page} nav={demoNav} />
    </div>
  );
}
