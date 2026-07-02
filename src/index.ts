// @vigil/web-framework — public surface (v0.2).
export * from './types';

// content loader + image contract
export { getPageSlugs, getPage, paramsToFile, imgSrc, imgAlt } from './loader';
export { buildPageMetadata } from './metadata';

// provenance (canonical values + validation)
export {
  SECTION_PROVENANCE,
  isValidProvenance,
  validateProvenance,
  inferProvenance,
  type ProvenanceError,
  type ProvenanceValidateOptions,
} from './provenance';

// design tokens (runtime theme resolver + surface hierarchy)
export { resolveTheme, surfaceBg, SURFACES, type Theme, type Surface } from './tokens/theme';

// conversion funnel contract
export {
  buildEnquiryUrl,
  validateFunnel,
  FUNNEL_EVENTS,
  type FunnelSchema,
  type FunnelStep,
  type FunnelOption,
  type FunnelCompletion,
} from './conversion/funnel';

// SEO / structured data
export { buildJsonLd, type JsonLdOptions } from './seo/schema';
export { JsonLd } from './seo/JsonLd';

// section registry
export { RenderSections, SECTION_TYPES } from './sections/registry';

// nucleus sections (v0.1.x)
export { Hero } from './sections/Hero';
export { ServiceGrid } from './sections/ServiceGrid';
export { TextImage } from './sections/TextImage';
export { Prose } from './sections/Prose';
export { Cta } from './sections/Cta';
export { Faq } from './sections/Faq';
export { Testimonial } from './sections/Testimonial';
export { ContactForm } from './sections/ContactForm';
export { BoroughBlock } from './sections/BoroughBlock';

// library sections (v0.2)
export { TrustBadgeRow } from './sections/TrustBadgeRow';
export { MetricsStrip } from './sections/MetricsStrip';
export { ProofStrip } from './sections/ProofStrip';
export { ComplianceStrip } from './sections/ComplianceStrip';
export { DifferentiationPanel } from './sections/DifferentiationPanel';
export { ProcessSteps } from './sections/ProcessSteps';
export { QuickAnswer } from './sections/QuickAnswer';
export { LocationsCoverage } from './sections/LocationsCoverage';
export { ContactBlock } from './sections/ContactBlock';
export { EnquiryFunnel } from './sections/EnquiryFunnel';

// shell
export { Header } from './shell/Header';
export { Footer } from './shell/Footer';
export { MobileCta } from './shell/MobileCta';
