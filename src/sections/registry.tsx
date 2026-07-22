// Section registry (v0.2). Base = the 9 nucleus types (F1.2); v0.2 EXTENDS with
// the production library types (SECTION-LIBRARY §10–20). Additive only — existing
// types/pages are unaffected. Must stay in lockstep with the CRM config/sections.php
// (docs/SEMVER-POLICY registry-lockstep rule); adding types = minor.
import type { PageJson, Section } from '../types';
import { Hero } from './Hero';
import { ServiceGrid } from './ServiceGrid';
import { TextImage } from './TextImage';
import { Prose } from './Prose';
import { Cta } from './Cta';
import { Faq } from './Faq';
import { Testimonial } from './Testimonial';
import { ContactForm } from './ContactForm';
import { BoroughBlock } from './BoroughBlock';
// v0.2 library
import { TrustBadgeRow } from './TrustBadgeRow';
import { MetricsStrip } from './MetricsStrip';
import { ProofStrip } from './ProofStrip';
import { ComplianceStrip } from './ComplianceStrip';
import { DifferentiationPanel } from './DifferentiationPanel';
import { ProcessSteps } from './ProcessSteps';
import { QuickAnswer } from './QuickAnswer';
import { LocationsCoverage } from './LocationsCoverage';
import { ContactBlock } from './ContactBlock';
import { EnquiryFunnel } from './EnquiryFunnel';
// v0.6.1 — governed corporate→division gateway (MAIN-HOMEPAGE-BUILD-01 / D-101)
import { DivisionGateway } from './DivisionGateway';
// v0.6.5 — corporate visual hero: H1 + four fixed-order division image placeholders (MAIN-HOMEPAGE-VISUAL-01)
import { DivisionVisualHero } from './DivisionVisualHero';

type SectionProps = { fields: any; page: PageJson };

const MAP: Record<string, React.FC<SectionProps>> = {
  // nucleus (v0.1.x)
  hero: Hero,
  service_grid: ServiceGrid,
  text_image: TextImage,
  prose: Prose,
  cta: Cta,
  faq: Faq,
  testimonial: Testimonial,
  contact_form: ContactForm,
  borough_block: BoroughBlock,
  // library (v0.2)
  trust_badge_row: TrustBadgeRow,
  metrics_strip: MetricsStrip,
  proof_strip: ProofStrip,
  compliance_strip: ComplianceStrip,
  differentiation_panel: DifferentiationPanel,
  process_steps: ProcessSteps,
  quick_answer: QuickAnswer,
  locations_coverage: LocationsCoverage,
  contact_block: ContactBlock,
  enquiry_funnel: EnquiryFunnel,
  // v0.6.1 — corporate→division gateway (corporate-only; approved-host allow-list)
  division_gateway: DivisionGateway,
  // v0.6.5 — corporate visual hero: four fixed-order division image placeholders, non-clickable
  division_visual_hero: DivisionVisualHero,
};

export const SECTION_TYPES = Object.keys(MAP);

export function RenderSections({ page }: { page: PageJson }) {
  return (
    <>
      {page.sections.map((s: Section, i: number) => {
        const C = MAP[s.type];
        if (!C) {
          // Parity guard: an unknown section type means the CRM registry and the
          // website registry drifted. Fail loudly outside production.
          if (process.env.NODE_ENV !== 'production') {
            throw new Error(`Unknown section type: ${s.type}`);
          }
          return null;
        }
        return <C key={i} fields={s.fields} page={page} />;
      })}
    </>
  );
}
